const jwt = require("jsonwebtoken");

// `sid` liga el token a una fila de auth_sessions: si la sesión se cierra, el token deja de servir
const generateJWT = (id, sid) => {
  return new Promise((resolve, reject) => {
    const payload = sid ? { id, sid } : { id };

    jwt.sign(
      payload,
      process.env.JWT_SECRET_SEED,
      {
        expiresIn: process.env.JWT_EXPIRE_IN,
      },
      (err, token) => {
        if (err) {
          reject(err);
        }
        resolve(token);
      }
    );
  });
};

const recoveryJWT = (id) => {
  return new Promise((resolve, reject) => {
    const payload = { id };

    jwt.sign(
      payload,
      process.env.RECOVERY_SECRET_JWT_SEED,
      {
        expiresIn: process.env.RECOVERY_JWT_EXPIRE_IN,
      },
      (err, token) => {
        if (err) {
          reject(err);
        }
        resolve(token);
      }
    );
  });
};

module.exports = { generateJWT, recoveryJWT };
