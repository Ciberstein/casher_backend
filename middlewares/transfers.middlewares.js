const User = require("../models/accounts.model");
const Transfer = require("../models/transfers.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const getBalance = require("../utils/getBalance");

exports.validUser = catchAsync(async (req, res, next) => {
  const { type, user, amount } = req.body;
  const { sessionAccount } = req;
  const query = { status: "active" };

  if (type === 1 || type === '1')
    query.email = user.toLowerCase();
  else if (type === 2 || type === '2')
    query.username = user;

  const account = await User.Accounts.findOne({
    where: query,
    attributes: ["id", "username", "email"],
    include: [{
      attributes: ["first_name", "middle_name", "surname_1", "surname_2"],
      model: User.Data,
      as: 'data'
    }]
  });

  if (!account) {
    return next(new AppError("Account not found", 404));
  }

  if (account.id === sessionAccount.id) {
    return next(new AppError("The user must not be yourself.", 401));
  }

  if (!amount) {
    return res.status(200).send();
  }

  req.account = account;

  next();
});

exports.validBalance = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;
  const { amount, currency } = req.body;

  const balance = await getBalance(sessionAccount.id, currency || 'COP');
  if (Number(balance.amount) < Number(amount))
    return next(new AppError("Insufficient balance", 401));

  req.amount = Number(amount);
  req.currency = currency || 'COP';
  next();
});

exports.validConfirmation = catchAsync(async (req, res, next) => {
  const { account } = req;
  const { amount, confirmation } = req.body;

  if (!confirmation) {
    return res.status(201).json({
      ...account.toJSON(),
      amount,
    });
  }

  next();
});

exports.txById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const transfer = await Transfer.findOne({
    where: { id },
    include: [
      {
        model: User.Accounts,
        attributes: ["id", "email", "username"],
        as: "owner",
        include: [{
          model: User.Data,
          attributes: ["first_name", "middle_name", "surname_1", "surname_2"],
          as: "data",
        }]
      },
      {
        model: User.Accounts,
        attributes: ["id", "email", "username"],
        as: "receiver",
        include: [{
          model: User.Data,
          attributes: ["first_name", "middle_name", "surname_1", "surname_2"],
          as: "data",
        }]
      }
    ]
  });

  if (!transfer) {
    return next(new AppError("Transfer not found", 404));
  }

  req.transaction = transfer;

  next();
});

exports.manageTx = catchAsync(async (req, res, next) => {
  const { transaction, sessionAccount } = req;
  const { status } = req.body;

  if (transaction.status !== "pending") {
    return next(new AppError("The transaction has already been resolved.", 401));
  }

  if (status && transaction.owner.id !== sessionAccount.id) {
    return next(new AppError("Only the owner can do this.", 401));
  }

  if (status) {
    const currency = transaction.data.currency || 'COP';
    const balance = await getBalance(sessionAccount.id, currency);
    if (Number(balance.amount) < transaction.data.amount)
      return next(new AppError("Insufficient balance", 401));

    req.amount = transaction.data.amount;
    req.currency = currency;
  }

  next();
});
