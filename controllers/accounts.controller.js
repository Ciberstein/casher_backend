const hashPassword = require("../utils/hashPassword");
const catchAsync = require("../utils/catchAsync");
const Account = require("../models/accounts.model");

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
    password: hashPassword(password),
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

  const account = await Account.findOne({
    where: { id: sessionAccount.id },
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
  const { first_name, last_name } = req.body;
  const { sessionAccount } = req;

  await sessionAccount.update({
    first_name, last_name
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
    password: hashPassword(String(password)),
  });

  return res.status(200).json({
    status: "success",
    message: "Password updated",
  });
});