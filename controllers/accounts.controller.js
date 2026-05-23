const { hashPassword } = require("../utils/hashPassword");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generateJWT } = require("../utils/jwt");
const jwt = require("jsonwebtoken");
const User = require("../models/accounts.model");
const Loan = require("../models/loan.model");
const Payment = require("../models/payment.model");
const calculateOutstanding = require("../utils/loanCalculator");
const getExchangeRate = require("../utils/exchangeRate");

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

  const [account, activeLoans] = await Promise.all([
    User.Accounts.findOne({
      where: { id: sessionAccount.id },
      attributes: ["id", "email", "username", "picture", "balance_available", "role", "currency", "interest_rate"],
      include: [{
        attributes: ["first_name", "middle_name", "surname_1", "surname_2", "birthday"],
        model: User.Data,
        as: 'data',
      }],
    }),
    Loan.findAll({ where: { accountId: sessionAccount.id, status: 'accepted' } }),
  ]);

  let balance_pending = 0;
  if (activeLoans.length > 0) {
    const rate = await getExchangeRate();
    await Promise.all(activeLoans.map(async (loan) => {
      const outstanding = calculateOutstanding(loan.amount, loan.interest_rate, loan.accepted_at, loan.paid_amount);
      if (outstanding < 1) {
        await loan.update({ status: 'paid' });
        return;
      }
      balance_pending += loan.currency === 'USD' ? outstanding * rate : outstanding;
    }));
  }

  return res.status(200).json({ ...account.toJSON(), balance_pending });
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

exports.updateCurrency = catchAsync(async (req, res) => {
  const { currency } = req.body;
  const { sessionAccount } = req;

  await sessionAccount.update({ currency });

  return res.status(200).json({
    status: "success",
    message: "Currency updated",
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { username, deleteAvatar } = req.body;
  const { sessionAccount } = req;

  if (!username && !req.file && deleteAvatar !== 'true') return next(new AppError('Nada que actualizar', 400));

  if (username) {
    const taken = await User.Accounts.findOne({ where: { username } });
    if (taken && taken.id !== sessionAccount.id) return next(new AppError('El nombre de usuario ya está en uso', 409));
  }

  const updates = {};
  if (username) updates.username = username;

  const { upload, destroy } = require('../services/cloudinary.service');

  if (deleteAvatar === 'true' && sessionAccount.picture) {
    await destroy(sessionAccount.picture);
    updates.picture = null;
  } else if (req.file) {
    if (sessionAccount.picture) await destroy(sessionAccount.picture);
    updates.picture = await upload(req.file.buffer, 'avatars', req.file.mimetype);
  }

  await sessionAccount.update(updates);

  return res.status(200).json({ status: 'success', message: 'Perfil actualizado con éxito' });
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

exports.payBalance = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;
  const { amount, currency } = req.body;

  if (!amount || amount <= 0) return next(new AppError('Monto inválido', 400));

  const rate = await getExchangeRate();
  const amountCOP = currency === 'USD' ? amount * rate : Number(amount);

  if (sessionAccount.balance_available < amountCOP)
    return next(new AppError('Saldo disponible insuficiente', 400));

  const activeLoans = await Loan.findAll({
    where: { accountId: sessionAccount.id, status: 'accepted' },
    order: [['accepted_at', 'ASC']],
  });

  // Freeze outstandings at a single point in time to avoid re-calculating
  // inside the loop (continuous interest growth makes apply >= outstanding
  // never true when paying off the full balance).
  const outstandings = activeLoans.map(loan =>
    calculateOutstanding(loan.amount, loan.interest_rate, loan.accepted_at, loan.paid_amount)
  );

  const totalPending = outstandings.reduce((sum, o) => sum + o, 0);

  if (totalPending <= 0) return next(new AppError('No tienes deuda pendiente', 400));
  // Allow up to 1 COP of rounding tolerance so a display-rounded payment
  // is not rejected when the real outstanding has more decimal precision.
  if (amountCOP > totalPending + 1) return next(new AppError('El monto supera la deuda pendiente', 400));

  let remaining = amountCOP;
  for (let i = 0; i < activeLoans.length; i++) {
    if (remaining <= 0) break;
    const loan = activeLoans[i];
    const outstanding = outstandings[i];
    if (outstanding <= 0) continue;

    const apply = Math.min(remaining, outstanding);
    remaining -= apply;

    // Treat as fully paid if within 1 COP of the outstanding — covers
    // floating-point drift and display-rounding from the frontend.
    if (outstanding - apply < 1) {
      await loan.update({ status: 'paid', paid_amount: loan.paid_amount + apply });
    } else {
      await loan.update({ paid_amount: loan.paid_amount + apply });
    }
  }

  await sessionAccount.decrement('balance_available', { by: amountCOP });

  await Payment.create({ amount, currency, accountId: sessionAccount.id });

  return res.status(200).json({ status: 'success', message: 'Abono realizado con éxito' });
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
