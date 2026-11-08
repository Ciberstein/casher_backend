const { hashPassword, comparePassword } = require("../utils/hashPassword");
const QRCode = require("qrcode");
const {
  generateSecret,
  verifyTotp,
  otpauthUrl,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  consumeBackupCode,
  verifyChallenge,
} = require("../utils/twoFactor");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { startSession, trustDevice, revokeAll, IDLE_MS, cookieOpts } = require("../utils/sessions");
const { generateJWT } = require("../utils/jwt");
const Session = require("../models/session.model");
const TrustedDevice = require("../models/trusted_device.model");
const jwt = require("jsonwebtoken");
const User = require("../models/accounts.model");
const Loan = require("../models/loan.model");
const Currency = require("../models/currency.model");
const Country = require("../models/country.model");

// Una moneda es válida si existe en la tabla currencies y está activa
const isAllowedCurrency = async (code) =>
  typeof code === 'string' && !!(await Currency.findOne({ where: { code, active: true } }));

// Igual para los países: deben existir en la tabla countries y estar activos
const isAllowedCountry = async (code) =>
  typeof code === 'string' && !!(await Country.findOne({ where: { code, active: true } }));
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
  // Si se restablece la contraseña es porque no se confía en quien pudiera tener acceso
  await revokeAll(code.account.id);

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
  // Cierra también la sesión en el servidor (si el token es nuestro, aunque haya expirado)
  try {
    const { sid } = jwt.verify(req.cookies.token, process.env.JWT_SECRET_SEED, { ignoreExpiration: true });
    if (sid) await Session.destroy({ where: { id: sid } });
  } catch { /* sin cookie o token inválido: solo se limpia */ }

  res.clearCookie('token');
  res.send('Logged out');
});

// ---------- Autenticación en dos pasos (TOTP) ----------

// Valida un código de la app o un código de respaldo. Devuelve true y consume el de respaldo si aplica.
const checkSecondFactor = async (account, code) => {
  const value = String(code || '').trim();
  if (!account.two_factor_secret) return false;

  if (/^\d{6}$/.test(value)) {
    return verifyTotp(decryptSecret(account.two_factor_secret), value);
  }

  const remaining = consumeBackupCode(account.two_factor_backup_codes, value);
  if (!remaining) return false;
  await account.update({ two_factor_backup_codes: remaining });
  return true;
};

// Segundo paso del login: canjea el challenge + código por la sesión
exports.loginTwoFactor = catchAsync(async (req, res, next) => {
  const { challenge, code, trustDevice: trust } = req.body;

  let decoded;
  try {
    decoded = verifyChallenge(challenge);
  } catch {
    return next(new AppError('La verificación expiró, ingresa de nuevo', 401));
  }

  const account = await User.Accounts.unscoped().findOne({
    where: { id: decoded.id, status: 'active', two_factor_enabled: true },
  });

  if (!account || !(await checkSecondFactor(account, code)))
    return next(new AppError('Código incorrecto', 401));

  await startSession(req, res, account.id);
  if (trust === true) await trustDevice(req, res, account.id);

  return res.status(200).json({
    status: 'success',
    message: 'Account has been logged',
  });
});

// Paso 1 del alta: genera un secreto pendiente y su QR. No activa nada todavía.
exports.twoFactorSetup = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;

  if (sessionAccount.two_factor_enabled)
    return next(new AppError('La verificación en dos pasos ya está activa', 400));

  const secret = generateSecret();
  await sessionAccount.update({ two_factor_secret: encryptSecret(secret) });

  const qr = await QRCode.toDataURL(otpauthUrl(sessionAccount.email, secret), { margin: 1, width: 220 });

  return res.status(200).json({ status: 'success', secret, qr });
});

// Paso 2 del alta: confirma con un código de la app, activa y entrega los códigos de respaldo (una sola vez)
exports.twoFactorEnable = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const account = await User.Accounts.unscoped().findByPk(req.sessionAccount.id);

  if (account.two_factor_enabled)
    return next(new AppError('La verificación en dos pasos ya está activa', 400));

  if (!account.two_factor_secret || !verifyTotp(decryptSecret(account.two_factor_secret), code))
    return next(new AppError('Código incorrecto', 401));

  const { codes, hashes } = generateBackupCodes();
  await account.update({ two_factor_enabled: true, two_factor_backup_codes: hashes });

  return res.status(200).json({ status: 'success', backupCodes: codes });
});

// Desactivar exige la contraseña y un código vigente (app o respaldo)
exports.twoFactorDisable = catchAsync(async (req, res, next) => {
  const { password, code } = req.body;
  const account = await User.Accounts.unscoped().findByPk(req.sessionAccount.id);

  if (!account.two_factor_enabled)
    return next(new AppError('La verificación en dos pasos no está activa', 400));

  if (!password || !(await comparePassword(password, account.password)))
    return next(new AppError('Contraseña incorrecta', 401));

  if (!(await checkSecondFactor(account, code)))
    return next(new AppError('Código incorrecto', 401));

  await account.update({
    two_factor_enabled: false,
    two_factor_secret: null,
    two_factor_backup_codes: null,
  });
  await TrustedDevice.destroy({ where: { accountId: account.id } });

  return res.status(200).json({ status: 'success', message: 'Verificación en dos pasos desactivada' });
});

exports.getAccountData = catchAsync(async (req, res) => {
  const { sessionAccount } = req;

  const [account, accountBalances, activeLoans] = await Promise.all([
    User.Accounts.findOne({
      where: { id: sessionAccount.id },
      attributes: ["id", "email", "username", "picture", "role", "currency", "country", "interest_rate", "two_factor_enabled"],
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

// Región del usuario: país y/o moneda por defecto, validados y guardados en un solo paso
exports.updateRegion = catchAsync(async (req, res, next) => {
  const { country, currency } = req.body;
  const { sessionAccount } = req;

  if (country === undefined && currency === undefined)
    return next(new AppError('Nada que actualizar', 400));

  const updates = {};
  if (country !== undefined) {
    if (!(await isAllowedCountry(country))) return next(new AppError('País no válido', 400));
    updates.country = country;
  }
  if (currency !== undefined) {
    if (!(await isAllowedCurrency(currency))) return next(new AppError('Moneda no válida', 400));
    updates.currency = currency;
  }

  await sessionAccount.update(updates);

  return res.status(200).json({ status: 'success', message: 'Región actualizada' });
});

exports.updateCurrency = catchAsync(async (req, res, next) => {
  const { currency } = req.body;
  const { sessionAccount } = req;

  if (!(await isAllowedCurrency(currency)))
    return next(new AppError('Moneda no válida', 400));

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
  // Cambiar la contraseña cierra el resto de sesiones y retira los dispositivos de confianza
  await revokeAll(sessionAccount.id, { exceptSessionId: req.sessionId });

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

// GET /admin/users?page=1&limit=10&search=texto
// Paginación y búsqueda en el servidor. Responde { data, total, page, pages, limit }.
exports.getUsers = catchAsync(async (req, res) => {
  const { Op } = require("sequelize");
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const requested = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const search = String(req.query.search ?? '').trim();
  const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`; // % y _ son comodines en LIKE: se escapan

  const where = search
    ? {
        [Op.or]: [
          { username: { [Op.iLike]: like } },
          { email: { [Op.iLike]: like } },
          { '$data.first_name$': { [Op.iLike]: like } },
          { '$data.surname_1$': { [Op.iLike]: like } },
        ],
      }
    : {};

  const query = {
    where,
    attributes: ['id', 'email', 'username', 'role', 'status', 'interest_rate', 'currency', 'country', 'picture', 'createdAt'],
    include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'middle_name', 'surname_1', 'surname_2'] }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    distinct: true,
  };

  const total = await User.Accounts.count({ where, include: query.include, distinct: true });
  const pages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(requested, pages);

  const data = await User.Accounts.findAll({ ...query, limit, offset: (page - 1) * limit, subQuery: false });

  return res.status(200).json({ data, total, page, pages, limit });
});

exports.adminUpdateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { username, email, interest_rate, currency, country, status, first_name, middle_name, surname_1, surname_2 } = req.body;

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
  if (currency !== undefined) {
    if (!(await isAllowedCurrency(currency))) return next(new AppError('Moneda no válida', 400));
    accountUpdates.currency = currency;
  }
  if (country !== undefined) {
    if (!(await isAllowedCountry(country))) return next(new AppError('País no válido', 400));
    accountUpdates.country = country;
  }
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

exports.adminUpdateUserPassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;

  if (typeof password !== 'string' || password.length < 8)
    return next(new AppError('La contraseña debe tener al menos 8 caracteres', 400));

  const user = await User.Accounts.findByPk(req.params.id);
  if (!user) return next(new AppError('Usuario no encontrado', 404));

  await user.update({ password: await hashPassword(password) });
  await revokeAll(user.id);

  return res.status(200).json({ status: 'success', message: 'Contraseña actualizada' });
});

exports.adminUpdateUserPicture =catchAsync(async (req, res, next) => {
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

exports.authRefresh = catchAsync(async (req, res, next) => {
  const { cookies } = req;

  // La firma SÍ se verifica (solo se tolera que haya expirado): decodificar sin verificar
  // permitía fabricar una cookie y obtener una sesión de cualquier cuenta.
  let decoded;
  try {
    decoded = jwt.verify(cookies.token, process.env.JWT_SECRET_SEED, { ignoreExpiration: true });
  } catch {
    return next(new AppError('Invalid token. Please login again', 401));
  }

  const account = await User.Accounts.findOne({ where: { id: decoded.id, status: 'active' }, attributes: ['id'] });
  if (!account) return next(new AppError('The owner of this account is no longer available', 401));

  if (decoded.sid) {
    const session = await Session.findByPk(decoded.sid);
    const abandoned = session && Date.now() - new Date(session.last_seen_at).getTime() > IDLE_MS;

    if (!session || session.accountId !== account.id || abandoned) {
      if (abandoned) await session.destroy();
      return next(new AppError('Session closed. Please login again', 401));
    }

    await session.update({ last_seen_at: new Date() });
    res.cookie('token', await generateJWT(account.id, session.id), cookieOpts);
  } else {
    // Token anterior a las sesiones: se adopta creando la sesión (si no está demasiado vencido)
    if (!decoded.exp || decoded.exp * 1000 < Date.now() - IDLE_MS)
      return next(new AppError('Session expired. Please login again', 401));
    await startSession(req, res, account.id);
  }

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
