const crypto = require("crypto");
const Bowser = require("bowser");
const geoip = require("geoip-lite");
const { Op } = require("sequelize");
const Session = require("../models/session.model");
const TrustedDevice = require("../models/trusted_device.model");
const { generateJWT } = require("./jwt");

const DAY = 24 * 60 * 60 * 1000;
// Una sesión sin renovarse este tiempo se considera abandonada
const IDLE_MS = (Number(process.env.SESSION_IDLE_DAYS) || 30) * DAY;
const TRUST_MS = (Number(process.env.TRUSTED_DEVICE_DAYS) || 30) * DAY;

const cookieOpts = { httpOnly: true, secure: true, sameSite: "strict" };

exports.IDLE_MS = IDLE_MS;
exports.cookieOpts = cookieOpts;

const countryNames = new Intl.DisplayNames(["es"], { type: "region" });

// "Bogotá, Colombia" a partir de la IP, con una base local (no se envía la IP a terceros).
// Las IP privadas o no registradas devuelven null. La precisión es aproximada (ciudad).
const locate = (ip) => {
  const geo = ip ? geoip.lookup(ip) : null;
  if (!geo?.country) return null;
  const country = countryNames.of(geo.country);
  return (geo.city ? `${geo.city}, ${country}` : country).slice(0, 120);
};

// Navegador, sistema y tipo de dispositivo a partir del User-Agent (solo informativo)
exports.describeRequest = (req) => {
  // Bowser lanza error con un User-Agent vacío, y un cliente sin cabecera no debe romper el login
  const parser = Bowser.getParser(req.headers["user-agent"] || "unknown");
  const type = parser.getPlatformType(true);

  const browser = parser.getBrowserName() || "Navegador";
  const os = parser.getOSName() || "Desconocido";
  const device_type = type === "mobile" || type === "tablet" ? type : "desktop";

  // Tras el proxy la IP real llega en X-Forwarded-For (dato informativo, no de seguridad)
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = (forwarded || req.ip || "").replace(/^::ffff:/, "").slice(0, 64) || null;

  return { browser, os, device_type, ip, location: locate(ip) };
};

// Crea la sesión, firma el token ligado a ella y lo deja en la cookie
exports.startSession = async (req, res, accountId) => {
  const session = await Session.create({ accountId, ...exports.describeRequest(req), last_seen_at: new Date() });

  // Limpieza oportunista de sesiones abandonadas de esta cuenta
  await Session.destroy({ where: { accountId, last_seen_at: { [Op.lt]: new Date(Date.now() - IDLE_MS) } } });

  res.cookie("token", await generateJWT(accountId, session.id), cookieOpts);
  return session;
};

// Cierra todas las sesiones (y opcionalmente conserva una). También quita los dispositivos de confianza.
exports.revokeAll = async (accountId, { exceptSessionId = null, trusted = true } = {}) => {
  const where = { accountId };
  if (exceptSessionId) where.id = { [Op.ne]: exceptSessionId };
  await Session.destroy({ where });
  if (trusted) await TrustedDevice.destroy({ where: { accountId } });
};

// ---------- Dispositivos de confianza ----------

const trustCookie = (accountId) => `trusted_${accountId}`;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

const findTrusted = (req, accountId) => {
  const raw = req.cookies?.[trustCookie(accountId)];
  if (!raw) return null;
  return TrustedDevice.findOne({
    where: { accountId, token_hash: hash(raw), expires_at: { [Op.gt]: new Date() } },
  });
};

exports.findTrusted = findTrusted;

exports.isTrustedDevice = async (req, accountId) => {
  const device = await findTrusted(req, accountId);
  if (!device) return false;
  await device.update({ last_used_at: new Date(), ip: exports.describeRequest(req).ip });
  return true;
};

exports.trustDevice = async (req, res, accountId) => {
  // Si este navegador ya estaba registrado, se reemplaza en vez de duplicarlo
  const previous = await findTrusted(req, accountId);
  if (previous) await previous.destroy();

  const raw = crypto.randomBytes(32).toString("hex");
  await TrustedDevice.create({
    accountId,
    token_hash: hash(raw),
    ...exports.describeRequest(req),
    last_used_at: new Date(),
    expires_at: new Date(Date.now() + TRUST_MS),
  });

  res.cookie(trustCookie(accountId), raw, { ...cookieOpts, maxAge: TRUST_MS });
};
