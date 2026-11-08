const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP = 30;
const DIGITS = 6;
const ISSUER = "Casher";

const base32Encode = (buf) => {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
};

const base32Decode = (str) => {
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of str.replace(/=+$/, "").toUpperCase()) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};

const hotp = (secret, counter) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(bin % 10 ** DIGITS).padStart(DIGITS, "0");
};

const safeEqual = (a, b) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

exports.generateSecret = () => base32Encode(crypto.randomBytes(20));

// Acepta el código actual y el de la ventana anterior/siguiente para tolerar desfase de reloj
exports.verifyTotp = (secret, code) => {
  if (!secret || !/^\d{6}$/.test(String(code))) return false;
  const counter = Math.floor(Date.now() / 1000 / STEP);
  return [-1, 0, 1].some((w) => safeEqual(hotp(secret, counter + w), String(code)));
};

exports.otpauthUrl = (email, secret) =>
  `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(email)}` +
  `?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&digits=${DIGITS}&period=${STEP}`;

// El secreto se guarda cifrado (AES-256-GCM) para que un volcado de la DB no lo exponga
const key = () =>
  crypto
    .createHash("sha256")
    .update(process.env.TWO_FACTOR_SECRET_KEY || process.env.JWT_SECRET_SEED)
    .digest();

exports.encryptSecret = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
};

exports.decryptSecret = (stored) => {
  const [iv, tag, enc] = stored.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
};

// Códigos de respaldo: se muestran una sola vez y se guardan solo como hash
const hashBackup = (code) => crypto.createHash("sha256").update(code).digest("hex");

exports.generateBackupCodes = () => {
  const codes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(5).toString("hex").replace(/(.{5})(.{5})/, "$1-$2")
  );
  return { codes, hashes: codes.map(hashBackup) };
};

// Devuelve los hashes restantes si el código es válido y lo consume; null si no
exports.consumeBackupCode = (hashes, code) => {
  const hash = hashBackup(String(code).trim().toLowerCase());
  const idx = (hashes || []).indexOf(hash);
  if (idx === -1) return null;
  return hashes.filter((_, i) => i !== idx);
};

// Token corto emitido tras validar la contraseña. Usa otro secreto: nunca sirve como sesión.
const challengeSecret = () => `${process.env.JWT_SECRET_SEED}:2fa`;

exports.signChallenge = (id) =>
  jwt.sign({ id, purpose: "2fa" }, challengeSecret(), { expiresIn: "5m" });

exports.verifyChallenge = (token) => {
  const decoded = jwt.verify(token, challengeSecret());
  if (decoded.purpose !== "2fa") throw new Error("Invalid challenge");
  return decoded;
};
