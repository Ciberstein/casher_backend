const { hashPassword } = require("../utils/hashPassword");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generateJWT } = require("../utils/jwt");
const jwt = require("jsonwebtoken");
const User = require("../models/accounts.model");
const Loan = require("../models/loan.model");
const Payment = require("../models/payment.model");
const AccountBalance = require("../models/account_balance.model");
const calculateOutstanding = require("../utils/loanCalculator");
const getBalance = require("../utils/getBalance");

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

  const [account, accountBalances, activeLoans] = await Promise.all([
    User.Accounts.findOne({
      where: { id: sessionAccount.id },
      attributes: ["id", "email", "username", "picture", "role", "currency", "interest_rate"],
      include: [{
        attributes: ["first_name", "middle_name", "surname_1", "surname_2", "birthday"],
        model: User.Data,
        as: 'data',
      }],
    }),
    AccountBalance.findAll({ where: { accountId: sessionAccount.id } }),
    Loan.findAll({ where: { accountId: sessionAccount.id, status: 'accepted' } }),
  ]);

  const balances = accountBalances.reduce((acc, b) => ({ ...acc, [b.currency]: Number(b.amount) }), {});

  const pending = {};
  if (activeLoans.length > 0) {
    await Promise.all(activeLoans.map(async (loan) => {
      const outstanding = calculateOutstanding(loan.amount, loan.interest_rate, loan.accepted_at, loan.paid_amount);
      if (outstanding < 0.01) {
        await loan.update({ status: 'paid' });
        return;
      }
      pending[loan.currency] = (pending[loan.currency] || 0) + outstanding;
    }));
  }

  return res.status(200).json({ ...account.toJSON(), balances, pending });
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

  const balance = await getBalance(sessionAccount.id, currency);
  if (Number(balance.amount) < Number(amount))
    return next(new AppError('Saldo disponible insuficiente', 400));

  const activeLoans = await Loan.findAll({
    where: { accountId: sessionAccount.id, status: 'accepted', currency },
    order: [['accepted_at', 'ASC']],
  });

  const outstandings = activeLoans.map(loan =>
    calculateOutstanding(loan.amount, loan.interest_rate, loan.accepted_at, loan.paid_amount)
  );

  const totalPending = outstandings.reduce((sum, o) => sum + o, 0);

  if (totalPending <= 0) return next(new AppError('No tienes deuda pendiente en esta moneda', 400));
  if (Number(amount) > totalPending + 0.01) return next(new AppError('El monto supera la deuda pendiente', 400));

  let remaining = Number(amount);
  for (let i = 0; i < activeLoans.length; i++) {
    if (remaining <= 0) break;
    const loan = activeLoans[i];
    const outstanding = outstandings[i];
    if (outstanding <= 0) continue;

    const apply = Math.min(remaining, outstanding);
    remaining -= apply;

    if (outstanding - apply < 0.01) {
      await loan.update({ status: 'paid', paid_amount: loan.paid_amount + apply });
    } else {
      await loan.update({ paid_amount: loan.paid_amount + apply });
    }
  }

  await balance.decrement('amount', { by: Number(amount) });

  await Payment.create({ amount, currency, accountId: sessionAccount.id });

  return res.status(200).json({ status: 'success', message: 'Abono realizado con éxito' });
});

exports.getUsers = catchAsync(async (req, res) => {
  const users = await User.Accounts.findAll({
    attributes: ['id', 'email', 'username', 'role', 'status', 'interest_rate', 'picture', 'createdAt'],
    include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'middle_name', 'surname_1', 'surname_2'] }],
    order: [['createdAt', 'DESC']],
  });
  return res.status(200).json(users);
});

exports.adminUpdateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { username, email, interest_rate, status, first_name, middle_name, surname_1, surname_2 } = req.body;

  const user = await User.Accounts.findByPk(id, {
    include: [{ model: User.Data, as: 'data' }],
  });
  if (!user) return next(new AppError('Usuario no encontrado', 404));

  const accountUpdates = {};
  if (username !== undefined) {
    const taken = await User.Accounts.findOne({ where: { username } });
    if (taken && taken.id !== Number(id)) return next(new AppError('El nombre de usuario ya está en uso', 409));
    accountUpdates.username = username;
  }
  if (email !== undefined) {
    const emailLower = email.toLowerCase();
    const taken = await User.Accounts.findOne({ where: { email: emailLower } });
    if (taken && taken.id !== Number(id)) return next(new AppError('El correo ya está en uso', 409));
    accountUpdates.email = emailLower;
  }
  if (interest_rate !== undefined) accountUpdates.interest_rate = Number(interest_rate);
  if (status !== undefined) accountUpdates.status = status;

  if (Object.keys(accountUpdates).length > 0) await user.update(accountUpdates);

  const dataUpdates = {};
  if (first_name !== undefined) dataUpdates.first_name = first_name;
  if (middle_name !== undefined) dataUpdates.middle_name = middle_name || null;
  if (surname_1 !== undefined) dataUpdates.surname_1 = surname_1;
  if (surname_2 !== undefined) dataUpdates.surname_2 = surname_2 || null;

  if (Object.keys(dataUpdates).length > 0) await user.data.update(dataUpdates);

  return res.status(200).json({ status: 'success', message: 'Usuario actualizado' });
});

exports.adminUpdateUserPicture = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { deleteAvatar } = req.body;

  const user = await User.Accounts.findByPk(id);
  if (!user) return next(new AppError('Usuario no encontrado', 404));

  const { upload, destroy } = require('../services/cloudinary.service');

  if (deleteAvatar === 'true') {
    if (user.picture) await destroy(user.picture);
    await user.update({ picture: null });
  } else if (req.file) {
    if (user.picture) await destroy(user.picture);
    const pictureUrl = await upload(req.file.buffer, 'avatars', req.file.mimetype);
    await user.update({ picture: pictureUrl });
  } else {
    return next(new AppError('Nada que actualizar', 400));
  }

  return res.status(200).json({ status: 'success', message: 'Imagen actualizada' });
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
