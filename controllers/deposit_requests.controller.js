const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const DepositRequest = require('../models/deposit_request.model');
const AppBankAccount = require('../models/app_bank_account.model');
const User = require('../models/accounts.model');
const getBalance = require('../utils/getBalance');
const { upload } = require('../services/cloudinary.service');
const { send } = require('../services/email.service');
const { depositStatus } = require('../emails/templates');

exports.createDepositRequest = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Screenshot is required', 400));

  const { amount, currency, appBankAccountId } = req.body;
  const { sessionAccount } = req;

  if (!amount || Number(amount) <= 0) return next(new AppError('Invalid amount', 400));

  const appBankAccount = await AppBankAccount.findOne({ where: { id: appBankAccountId, status: 'active' } });
  if (!appBankAccount) return next(new AppError('Bank account not found', 404));

  const screenshot = await upload(req.file.buffer, 'vouchers', req.file.mimetype);

  await DepositRequest.create({
    amount: Number(amount),
    currency,
    deposit_amount: Number(amount),
    screenshot,
    accountId: sessionAccount.id,
    appBankAccountId: Number(appBankAccountId),
  });

  return res.status(201).json({ status: 'success' });
});

exports.getMyDepositRequests = catchAsync(async (req, res) => {
  const { sessionAccount } = req;

  const requests = await DepositRequest.findAll({
    where: { accountId: sessionAccount.id },
    include: [{ model: AppBankAccount, as: 'appBankAccount', attributes: ['bank_name', 'account_number'] }],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(requests);
});

exports.getDepositRequests = catchAsync(async (req, res) => {
  const { Op } = require('sequelize');
  const history = req.query.history === 'true';
  const where = history ? { status: { [Op.ne]: 'pending' } } : { status: 'pending' };

  const requests = await DepositRequest.findAll({
    where,
    include: [
      { model: User.Accounts, as: 'account', attributes: ['id', 'email', 'username'] },
      { model: AppBankAccount, as: 'appBankAccount', attributes: ['bank_name', 'account_number'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(requests);
});

exports.acceptDepositRequest = catchAsync(async (req, res, next) => {
  const request = await DepositRequest.findByPk(req.params.id, {
    include: [{ model: User.Accounts, as: 'account' }],
  });

  if (!request) return next(new AppError('Request not found', 404));
  if (request.status !== 'pending') return next(new AppError('Request is not pending', 400));

  await request.update({ status: 'accepted' });

  const balance = await getBalance(request.accountId, request.currency);
  await balance.increment('amount', { by: request.deposit_amount });

  const { subject, html } = depositStatus({ status: 'accepted', amount: request.deposit_amount, currency: request.currency });
  send(request.account.email, subject, html);

  return res.status(200).json({ status: 'success' });
});

exports.rejectDepositRequest = catchAsync(async (req, res, next) => {
  const request = await DepositRequest.findByPk(req.params.id, {
    include: [{ model: User.Accounts, as: 'account' }],
  });

  if (!request) return next(new AppError('Request not found', 404));
  if (request.status !== 'pending') return next(new AppError('Request is not pending', 400));

  await request.update({ status: 'rejected' });

  const { subject, html } = depositStatus({ status: 'rejected', amount: request.deposit_amount, currency: request.currency });
  send(request.account.email, subject, html);

  return res.status(200).json({ status: 'success' });
});

exports.cancelDepositRequest = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;

  const request = await DepositRequest.findOne({
    where: { id: req.params.id, accountId: sessionAccount.id },
  });

  if (!request) return next(new AppError('Request not found', 404));
  if (request.status !== 'pending') return next(new AppError('Solo puedes cancelar solicitudes pendientes', 400));

  await request.update({ status: 'cancelled' });

  return res.status(200).json({ status: 'success' });
});
