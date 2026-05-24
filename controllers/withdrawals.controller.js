const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Withdrawal = require('../models/withdrawal.model');
const BankAccount = require('../models/bank_account.model');
const User = require('../models/accounts.model');
const getBalance = require('../utils/getBalance');
const { upload } = require('../services/cloudinary.service');
const { send } = require('../services/email.service');
const { withdrawalStatus } = require('../emails/templates');

exports.createWithdrawal = catchAsync(async (req, res, next) => {
  const { bankAccountId, amount, currency } = req.body;
  const { sessionAccount } = req;

  if (!amount || amount <= 0) return next(new AppError('Invalid amount', 400));

  const bankAccount = await BankAccount.findOne({
    where: { id: bankAccountId, accountId: sessionAccount.id, status: 'active' },
  });
  if (!bankAccount) return next(new AppError('Bank account not found', 404));

  const balance = await getBalance(sessionAccount.id, currency);
  if (Number(balance.amount) < Number(amount))
    return next(new AppError('Insufficient balance', 400));

  await balance.decrement('amount', { by: Number(amount) });

  await Withdrawal.create({
    amount: Number(amount),
    currency,
    accountId: sessionAccount.id,
    bankAccountId,
  });

  return res.status(201).json({ status: 'success' });
});

exports.getMyWithdrawals = catchAsync(async (req, res) => {
  const { sessionAccount } = req;

  const withdrawals = await Withdrawal.findAll({
    where: { accountId: sessionAccount.id },
    include: [{ model: BankAccount, as: 'bankAccount', attributes: ['bank_name', 'account_number', 'account_type'] }],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(withdrawals);
});

exports.getPendingWithdrawals = catchAsync(async (req, res) => {
  const { Op } = require('sequelize');
  const history = req.query.history === 'true';
  const where = history ? { status: { [Op.ne]: 'pending' } } : { status: 'pending' };

  const withdrawals = await Withdrawal.findAll({
    where,
    include: [
      { model: User.Accounts, as: 'account', attributes: ['id', 'email', 'username'] },
      { model: BankAccount, as: 'bankAccount' },
    ],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(withdrawals);
});

exports.acceptWithdrawal = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Screenshot is required', 400));

  const withdrawal = await Withdrawal.findByPk(req.params.id, {
    include: [{ model: User.Accounts, as: 'account' }],
  });

  if (!withdrawal) return next(new AppError('Withdrawal not found', 404));
  if (withdrawal.status !== 'pending') return next(new AppError('Withdrawal is not pending', 400));

  const screenshot = await upload(req.file.buffer, 'vouchers', req.file.mimetype);
  await withdrawal.update({ status: 'accepted', screenshot });

  const { subject, html } = withdrawalStatus({ status: 'accepted', amount: withdrawal.amount, currency: withdrawal.currency });
  send(withdrawal.account.email, subject, html);

  return res.status(200).json({ status: 'success', message: 'Withdrawal accepted' });
});

exports.cancelWithdrawal = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;

  const withdrawal = await Withdrawal.findOne({
    where: { id: req.params.id, accountId: sessionAccount.id },
  });

  if (!withdrawal) return next(new AppError('Withdrawal not found', 404));
  if (withdrawal.status !== 'pending') return next(new AppError('Solo puedes cancelar retiros pendientes', 400));

  await withdrawal.update({ status: 'cancelled' });

  const balance = await getBalance(sessionAccount.id, withdrawal.currency);
  await balance.increment('amount', { by: withdrawal.amount });

  return res.status(200).json({ status: 'success', message: 'Withdrawal cancelled' });
});

exports.rejectWithdrawal = catchAsync(async (req, res, next) => {
  const withdrawal = await Withdrawal.findByPk(req.params.id, {
    include: [{ model: User.Accounts, as: 'account' }],
  });

  if (!withdrawal) return next(new AppError('Withdrawal not found', 404));
  if (withdrawal.status !== 'pending') return next(new AppError('Withdrawal is not pending', 400));

  await withdrawal.update({ status: 'rejected' });

  const balance = await getBalance(withdrawal.accountId, withdrawal.currency);
  await balance.increment('amount', { by: withdrawal.amount });

  const { subject, html } = withdrawalStatus({ status: 'rejected', amount: withdrawal.amount, currency: withdrawal.currency });
  send(withdrawal.account.email, subject, html);

  return res.status(200).json({ status: 'success', message: 'Withdrawal rejected' });
});
