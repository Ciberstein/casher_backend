const hashPassword = require("../utils/hashPassword");
const { transporter } = require("../mail/transporter");
const { generateJWT, recoveryJWT } = require("../utils/jwt");
const Account = require("../models/accounts.model");

exports.createAccount = async (req, res) => {
  const { email, password } = req.body;

  await Account.create({
    password: hashPassword(password),
    email: email.toLowerCase(),
  });

  return res.json({
    status: "success",
    message: "Account has been created",
  });
};

exports.sendLoginAuthCode = async (req, res) => {
  const { account, code } = req;

  const mailOptions = {
    from: process.env.SENDMAIL_USER,
    to: account.email,
    subject: "Login verification code",
    text: code,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
      res.status(500).json({
        status: "success",
        message: "Error interno por favor contacte a soporte",
      });
    } else {
      console.log("Correo electrónico enviado:", info.response);
      res.status(201).json({
        status: "success",
        message:
          "Se ha enviado un código de verificacion a su correo electrónico",
      });
    }
  });
};

exports.loginAccount = async (req, res) => {
  const { code } = req;

  const token = await generateJWT(code.accountId);

  await code.destroy();

  res.status(201).json({
    status: "success",
    message: "Account has been logged",
    token,
  });
};

exports.recoverySession = async (req, res) => {
  const { code } = req;

  const recoveryToken = await recoveryJWT(code.accountId);

  await code.destroy();

  res.status(201).json({
    status: "success",
    message: "Recovery session generated",
    recoveryToken,
    code,
  });
};

exports.sendRecoveryAuthCode = async (req, res) => {
  const { account, code } = req;

  const mailOptions = {
    from: process.env.SENDMAIL_USER,
    to: account.email,
    subject: "Recovery password verification code",
    text: code,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
      res.status(500).json({
        status: "success",
        message: "Error interno por favor contacte a soporte",
      });
    } else {
      console.log("Correo electrónico enviado:", info.response);
      res.status(201).json({
        status: "success",
        message:
          "Se ha enviado un código de verificacion a su correo electrónico",
      });
    }
  });
};

exports.recoveryPassword = async (req, res) => {
  const { password } = req.body;
  const { recoveryAccount } = req;

  await recoveryAccount.update({
    password: hashPassword(password),
  });

  return res.status(200).json({
    status: "success",
    message: "Password updated",
  });
};
