const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const { promisify } = require("util");
const Account = require("../models/accounts.model");

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token)
    next(
      new AppError("You are not logged in. Please login to get access", 401)
    );

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.SECRET_JWT_SEED
  );

  const account = await Account.findOne({
    where: {
      id: decoded.id,
      status: "active",
    },
  });

  if (!account)
    next(
      new AppError("The owner of this account it not longer avalaible", 401)
    );

  req.sessionAccount = account;

  next();
});

exports.recovery = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) next(new AppError("You don't have a recovery token", 401));

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.RECOVERY_SECRET_JWT_SEED
  );

  const account = await Account.findOne({
    where: {
      id: decoded.id,
    },
  });

  if (!account)
    next(
      new AppError("The owner of this account it not longer avalaibleeeee", 401)
    );

  req.recoveryAccount = account;

  next();
});

exports.protectAccountOwner = catchAsync(async (req, res, next) => {
  const { user, sessionAccount } = req;

  if (user.id !== sessionAccount.id)
    next(new AppError("You do not own of this account", 401));

  next();
});
