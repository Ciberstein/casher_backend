const { hashPassword } = require("../utils/hashPassword");
const catchAsync = require("../utils/catchAsync");
const { generateJWT } = require("../utils/jwt");
const jwt = require("jsonwebtoken");
const User = require("../models/accounts.model");

exports.validateAuth = catchAsync(async (req, res) => {
  const { cookies } = req;

  const auth = cookies.token ? true : false;

  return res.status(200).send(auth);
});

exports.loginAccount = catchAsync(async (req, res) => {
  const { account } = req;

  return res.status(202).json({
    status: "success",
    message: "The account must be validated",
    account
  });
});

exports.accountRecoveryPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  const { code } = req;

  await code.account.update({
    password: await hashPassword(password),
  });

  return res.status(200).json({
    status: "success",
    message: "Password reset",
  });
});

exports.createAccount = catchAsync(async (req, res) => {
  const { account, mail } = req;

  if (!mail)
    return res.status(500).json({
      status: "error",
      message: "Error on sending security code",
    });

  return res.status(200).json({
    status: "success",
    message: "Account has been created",
    account
  });
});

exports.sendMailCode = catchAsync(async (req, res) => {
  const { mail } = req;

  if (mail)
    return res.status(200).json({
      status: "success",
      message: "Auth code sent",
    });

  return res.status(500).json({
    status: "error",
    message: "Error on sending code",
  });
});

exports.validateAccount = catchAsync(async (req, res) => {
  const { code } = req;

  await code.account.update({
    status: "active",
  });

  res.status(200).json({
    status: "success",
    message: "Validation completed",
  });
});

exports.logout = catchAsync(async (req, res) => {
  res.clearCookie('token');
  res.send('Logged out');
});

exports.getAccountData = catchAsync(async (req, res) => {
  const { sessionAccount } = req;

  const account = await User.Accounts.findOne({
    where: { id: sessionAccount.id },
    attributes: ["id", "email", "username", "picture", "balance_available", "balance_pending", "role"],
    include: [{
      attributes: ["first_name", "middle_name", "surname_1", "surname_2", "birthday"],
      model: User.Data,
      as: 'data'
    }]
  });

  return res.status(200).send(account);
});

exports.accountRecovery = catchAsync(async (req, res) => {
  const { account } = req;

  return res.status(202).json({
    message: "The recovery code was sent",
    account,
  });
});

exports.updateEmailCode = catchAsync(async (req, res) => {
  const { email } = req;

  return res.status(200).json(email);
});

exports.updateEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  const { sessionAccount } = req;

  await sessionAccount.update({
    email: email.toLowerCase(),
  });

  return res.status(200).json({
    status: "success",
    message: "Correo electrónico actualizado con éxito",
  });
});

exports.updatePersonalData = catchAsync(async (req, res) => {
  const {
    first_name,
    middle_name = null,
    surname_1,
    surname_2 = null
  } = req.body;
  const { sessionAccount } = req;

  await sessionAccount.data.update({
    first_name, 
    middle_name,
    surname_1,
    surname_2,
  });

  return res.status(200).json({
    status: "success",
    message: "Datos personales actualizados con éxito"
  });
});

exports.updatePaswordCode = catchAsync(async (req, res) => {
  const { new_password } = req.body;

  return res.status(200).send(new_password);
});

exports.updatePassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  const { sessionAccount } = req;

  await sessionAccount.update({
    password: await hashPassword(String(password)),
  });

  return res.status(200).json({
    status: "success",
    message: "Password updated",
  });
});

exports.authRefresh = catchAsync(async (req, res) => {
  const { cookies } = req;

  const decoded = jwt.decode(cookies.token);

  const token = await generateJWT(decoded.id);
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, 
    sameSite: 'strict',
  });

  return res.status(200).json({
    status: 'success',
    message: 'Token refreshed'
  });
});

exports.validateSession = catchAsync(async (req, res) => {
  const { cookies } = req;

  if (cookies.token) {
    return res.status(200).json({ auth: true });
  }

  return res.status(200).json({ auth: false });
});
