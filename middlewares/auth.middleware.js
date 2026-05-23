const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const { promisify } = require("util");
const generateCode = require("../utils/generateCode");
const Codes = require("../models/auth.codes.model");
const formatTime = require("../utils/formatTime");
const mailSender = require("../mail/mailSender");
const User = require("../models/accounts.model");

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please login to get access', 401));
  }

  let decoded;

  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_SEED);
  } catch (error) {
    return next(new AppError('Invalid token. Please login again', 401));
  }

  const account = await User.Accounts.findOne({
    where: { id: decoded.id, status: "active" },
    include: [{ model: User.Data, as: "data" }],
  });

  if (!account) {
    return next(new AppError('The owner of this account is no longer available', 406));
  }

  req.sessionAccount = account;
  next();
});

exports.protectAccountOwner = catchAsync(async (req, res, next) => {
  const { user, sessionAccount } = req;

  if (user.id !== sessionAccount.id) {
    return next(new AppError("You do not own of this account", 401));
  }

  next();
});

exports.authCodeGenerate = catchAsync(async (req, res, next) => {
  let code;
  let code_exist;

  do {
    code = generateCode().toString();

    code_exist = await Codes.findOne({
      where: { code },
    });
  } while (code_exist);

  req.code = code;

  next();
});

exports.userHasCode = catchAsync(async (req, res, next) => {
  const { account, code, email = null } = req;

  const query = await Codes.findOne({
    where: { accountId: account.id },
  });

  if (query) {
    const now = new Date();
    const dif = (now - query.updatedAt) / 1000;
    const limit = process.env.MAIL_SEND_LIMIT;

    if (dif < limit) {
      // Within rate limit — reuse existing code without sending a new email
      req.code = query.code;
      req.skipMail = true;
      req.email = email || account.email;
      return next();
    }

    await query.update({ code });
  } else {
    await Codes.create({
      code,
      accountId: account.id,
    });
  }

  req.email = email || account.email;

  next();
});

exports.sendMailCode = catchAsync(async (req, res, next) => {
  const { email, code, skipMail } = req;

  if (skipMail) {
    req.mail = true;
    return next();
  }

  const body = `Hello, <br />Here you have a temporary security code for your account.
    It can only be used once within the next ${formatTime(
      process.env.MAIL_CODE_EXPIRE
    )}, after which it will expire:<br /><br />
    <b>${code}</b><br /><br />Did you receive this email without having an active request to enter a verification code?
    If so, the security of your account may be compromised. Please change your password as soon as possible.`;

  req.mail = await mailSender(email, "Security code", body);

  next();
});

exports.authCodeExist = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;
  const { code, accountId = sessionAccount.id } = req.body;

  const code_exist = await Codes.findOne({
    where: { code, accountId },
    include: [{
      model: User.Accounts,
      as: "account"
    }],
  });

  if (!code_exist) {
    return next(new AppError("Invalid code", 401));
  }

  req.code = code_exist;

  next();
});

exports.authCodeExpired = catchAsync(async (req, res, next) => {
  const { code } = req;

  const limit = process.env.MAIL_CODE_EXPIRE;
  const now = new Date();
  const dif = now - code.updatedAt;

  if (dif > limit) {
    return next(new AppError("Code expired", 401));
  }

  next();
});

exports.authCodeDelete = catchAsync(async (req, res, next) => {
  const { code } = req;

  await code.destroy();

  next();
});

exports.authRefresh = catchAsync(async (req, _, next) => {
  const { cookies } = req;

  if (!cookies.token) {
    return next(new AppError("Missing token", 400));
  }

  next();
});
