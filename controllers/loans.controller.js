const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Loan = require('../models/loan.model');
const User = require('../models/accounts.model');
const calculateOutstanding = require('../utils/loanCalculator');
const getExchangeRate = require('../utils/exchangeRate');

const withOutstanding = (loan) => ({
  ...loan.toJSON(),
  outstanding: loan.status === 'accepted'
    ? calculateOutstanding(loan.amount, loan.interest_rate, loan.accepted_at, loan.paid_amount)
    : null,
});

exports.createLoan = catchAsync(async (req, res) => {
  const { amount, currency } = req.body;
  const { sessionAccount } = req;

  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  const loan = await Loan.create({
    amount,
    currency: currency || sessionAccount.currency,
    interest_rate: sessionAccount.interest_rate,
    accountId: sessionAccount.id,
  });

  return res.status(201).json({ status: 'success', loan });
});

exports.getMyLoans = catchAsync(async (req, res) => {
  const { sessionAccount } = req;

  const loans = await Loan.findAll({
    where: { accountId: sessionAccount.id },
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(loans.map(withOutstanding));
});

exports.getPendingLoans = catchAsync(async (req, res) => {
  const { Op } = require('sequelize');
  const history = req.query.history === 'true';
  const where = history ? { status: { [Op.ne]: 'pending' } } : { status: 'pending' };

  const loans = await Loan.findAll({
    where,
    include: [{ model: User.Accounts, as: 'account', attributes: ['id', 'email', 'username'] }],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(loans.map(withOutstanding));
});

exports.acceptLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findByPk(req.params.id, {
    include: [{ model: User.Accounts, as: 'account' }],
  });

  if (!loan) return next(new AppError('Loan not found', 404));
  if (loan.status !== 'pending') return next(new AppError('Loan is not pending', 400));

  const rate = await getExchangeRate();
  const amountCOP = loan.currency === 'USD' ? loan.amount * rate : loan.amount;

  await loan.update({ status: 'accepted', accepted_at: new Date() });
  await loan.account.increment('balance_available', { by: amountCOP });

  return res.status(200).json({ status: 'success', message: 'Loan accepted' });
});

exports.rejectLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findByPk(req.params.id);

  if (!loan) return next(new AppError('Loan not found', 404));
  if (loan.status !== 'pending') return next(new AppError('Loan is not pending', 400));

  await loan.update({ status: 'rejected' });

  return res.status(200).json({ status: 'success', message: 'Loan rejected' });
});

exports.cancelLoan = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;

  const loan = await Loan.findOne({ where: { id: req.params.id, accountId: sessionAccount.id } });

  if (!loan) return next(new AppError('Loan not found', 404));
  if (loan.status !== 'pending') return next(new AppError('Solo puedes cancelar préstamos pendientes', 400));

  await loan.update({ status: 'cancelled' });

  return res.status(200).json({ status: 'success', message: 'Loan cancelled' });
});
