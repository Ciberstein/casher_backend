const { Op } = require("sequelize");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Session = require("../models/session.model");
const TrustedDevice = require("../models/trusted_device.model");
const { findTrusted, trustDevice, cookieOpts } = require("../utils/sessions");

const sessionDto = (s, currentId) => ({
  id: s.id,
  browser: s.browser,
  os: s.os,
  deviceType: s.device_type,
  ip: s.ip,
  location: s.location,
  createdAt: s.createdAt,
  lastSeenAt: s.last_seen_at,
  current: s.id === currentId,
});

const trustedDto = (d, currentId) => ({
  id: d.id,
  browser: d.browser,
  os: d.os,
  deviceType: d.device_type,
  ip: d.ip,
  location: d.location,
  lastUsedAt: d.last_used_at,
  expiresAt: d.expires_at,
  current: d.id === currentId,
});

exports.listSessions = catchAsync(async (req, res) => {
  const sessions = await Session.findAll({
    where: { accountId: req.sessionAccount.id },
    order: [["last_seen_at", "DESC"]],
  });

  const list = sessions.map((s) => sessionDto(s, req.sessionId));
  // La sesión actual siempre primero
  list.sort((a, b) => Number(b.current) - Number(a.current));

  return res.status(200).json(list);
});

exports.revokeSession = catchAsync(async (req, res, next) => {
  const session = await Session.findOne({ where: { id: req.params.id, accountId: req.sessionAccount.id } });
  if (!session) return next(new AppError("Sesión no encontrada", 404));

  await session.destroy();

  // Si cerró la sesión desde la que está navegando, también se limpia la cookie
  const self = session.id === req.sessionId;
  if (self) res.clearCookie("token");

  return res.status(200).json({ status: "success", self });
});

exports.revokeOtherSessions = catchAsync(async (req, res) => {
  const where = { accountId: req.sessionAccount.id };
  if (req.sessionId) where.id = { [Op.ne]: req.sessionId };

  const count = await Session.destroy({ where });

  return res.status(200).json({ status: "success", closed: count });
});

// ---------- Dispositivos de confianza ----------

exports.listTrustedDevices = catchAsync(async (req, res) => {
  const accountId = req.sessionAccount.id;
  const [devices, current] = await Promise.all([
    TrustedDevice.findAll({
      where: { accountId, expires_at: { [Op.gt]: new Date() } },
      order: [["last_used_at", "DESC"]],
    }),
    findTrusted(req, accountId),
  ]);

  return res.status(200).json(devices.map((d) => trustedDto(d, current?.id)));
});

// Marca el dispositivo actual como de confianza (requiere 2FA activo: si no, no tendría efecto)
exports.addTrustedDevice = catchAsync(async (req, res, next) => {
  if (!req.sessionAccount.two_factor_enabled)
    return next(new AppError("Activa la verificación en dos pasos primero", 400));

  await trustDevice(req, res, req.sessionAccount.id);

  return res.status(201).json({ status: "success" });
});

exports.revokeTrustedDevice = catchAsync(async (req, res, next) => {
  const device = await TrustedDevice.findOne({ where: { id: req.params.id, accountId: req.sessionAccount.id } });
  if (!device) return next(new AppError("Dispositivo no encontrado", 404));

  const current = await findTrusted(req, req.sessionAccount.id);
  await device.destroy();
  if (current?.id === device.id) res.clearCookie(`trusted_${req.sessionAccount.id}`, cookieOpts);

  return res.status(200).json({ status: "success" });
});
