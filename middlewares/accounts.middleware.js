const AppError = require("../utils/appError");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const catchAsync = require("../utils/catchAsync");
const { generateJWT } = require("../utils/jwt");
const admin = require('../firebase/config');
const User = require("../models/accounts.model");

exports.firebase = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  const data = await admin.auth().verifyIdToken(token);

  if (!data) {
    return next(new AppError(`Error on decoding data`, 401));
  }

  const account = await User.Accounts.findOne({
    where: { email: data.email.toLowerCase() },
  });

  if (!account) {
    return res.status(201).send(data);
  }

  if (data.picture && account.picture !== data.picture) {
    await account.update({ picture: data.picture });
  }

  req.account = account;

  next();
});

exports.validRegisterAccount = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const account = await User.Accounts.findOne({
    where: { email: email.toLowerCase() },
  });

  if (account) {
    return next(new AppError("This email already registered", 401));
  }

  next();
});

exports.validExistAccount = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const account = await User.Accounts.findOne({
    where: { email: email.toLowerCase() },
    attributes: ["id", "email", "status"],
  });

  if (!account) {
    return next(new AppError(`Account not found`, 401));
  }

  req.account = account;
  next();
});

exports.createAccount = catchAsync(async (req, res, next) => {
  const {
    email,
    password,
    first_name,
    middle_name = null,
    surname_1,
    surname_2 = null,
    birthday,
    email_verified = false,
    picture = null
  } = req.body;

  let webName;
  let username;

  do {
    username = `user_${Math.floor(100000 + Math.random() * 900000)}`;

    webName = await User.Accounts.findOne({
      where: { username },
    });
  } while (webName);

  const account = await User.Accounts.create(
    {
      status: email_verified ? "active" : "pending",
      username,
      picture,
      password: await hashPassword(password),
      email: email.toLowerCase(),
      attributes: ['id', 'email', 'status'],
      data: {
        first_name,
        middle_name,
        surname_1,
        surname_2,
        birthday
      }
    },
    {
      include: [{
        attributes: [
          'first_name',
          'middle_name',
          'surname_1',
          'surname_2',
          'birthday'
        ],
        model: User.Data,
        as: 'data',
      }],
    }
  );

  if (!account) {
    return next(new AppError("Error on register", 500));
  }

  if (email_verified) {
    return res.status(201).json({
      status: "success",
      message: "Account has been created",
      account,
    });
  }

  req.account = account;

  next();
});

exports.validLoginAccount = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  const { account } = req;

  const accountWithPassword = await User.Accounts.findOne({
    where: { email: account.email },
    attributes: ['password'],
  });

  const isValid = await comparePassword(password, accountWithPassword.password);

  if (!isValid) {
    return next(new AppError("Authentication error", 401));
  }

  next();
});

exports.accountVerify = catchAsync(async (req, res, next) => {
  const { account } = req;

  if (account.status === "active") {
    const token = await generateJWT(account.id);

    return res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    }).status(200).json({
      status: "success",
      message: "Account has been logged",
      account
    });
  }

  if (account.status === "disabled") {
    return next(new AppError("Account disabled", 401));
  }

  next();
});

exports.validAuthCodeReceipt = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const account = await User.Accounts.findOne({
    where: { email },
    attributes: ["id", "email", "status"],
  });

  if (!account) {
    return next(new AppError(`Account with email: ${email} not found`, 404));
  }

  req.email = account.email;
  req.account = account;

  next();
});

exports.passwordsMatch = catchAsync(async (req, res, next) => {
  const { password, password_repeat } = req.body;

  if (password !== password_repeat) {
    return next(new AppError("Passwords do not match", 401));
  }

  next();
});

exports.emailsValidations = catchAsync(async (req, res, next) => {
  const { new_email, new_email_repeat } = req.body;
  const { sessionAccount } = req;

  const account = await User.Accounts.findOne({
    where: { email: new_email.toLowerCase() },
  });

  if (account) {
    return next(new AppError("Correo electrónico en uso", 401));
  }

  if (new_email !== new_email_repeat) {
    return next(new AppError(`Los emails no coinciden`, 401));
  }

  if (new_email === sessionAccount.email) {
    return next(new AppError(`La nueva direccion de correo debe ser diferente a la actual`, 401));
  }

  req.email = new_email;
  req.account = sessionAccount;

  next();
});

exports.updatePasword = catchAsync(async (req, res, next) => {
  const { password, new_password, new_password_repeat } = req.body;
  const { sessionAccount } = req;

  const isValid = await comparePassword(password, sessionAccount.password);

  if (!isValid) {
    return next(new AppError("Wrong password", 401));
  }

  if (new_password !== new_password_repeat) {
    return next(new AppError("New Passwords do not match", 401));
  }

  req.account = sessionAccount;

  next();
});
