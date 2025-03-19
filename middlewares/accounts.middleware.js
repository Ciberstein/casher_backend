const AppError = require("../utils/appError");
const Account = require("../models/accounts.model");
const hashPassword = require("../utils/hashPassword");

exports.validRegisterAccount = async (req, res, next) => {
  const { email, password, password_repeat } = req.body;

  const account = await Account.findOne({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (account) {
    next(new AppError("This email already registered", 401));
  }

  if (password !== password_repeat) {
    next(new AppError("Passwords do not match", 401));
  }

  next();
};

exports.validExistAccount = async (req, res, next) => {
  const { email } = req.body;

  const account = await Account.findOne({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!account) {
    next(new AppError(`Account not found`, 401));
  }

  req.account = account;
  next();
};

exports.validLoginAccount = async (req, res, next) => {
  const { password } = req.body;
  const { account } = req;

  const auth = await Account.findOne({
    where: {
      email: account.email,
      password: hashPassword(password),
    },
  });

  if (!auth) {
    next(new AppError("Authentication error", 401));
  }

  next();
};

exports.validRecoveryPassword = async (req, res, next) => {
  const { password, password_repeat } = req.body;

  if (password !== password_repeat) {
    next(new AppError("Passwords do not match", 401));
  }

  next();
};
