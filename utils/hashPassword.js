const crypto = require("crypto");

const hashPassword = (password) => {
  const hash = crypto.createHash("sha512");
  hash.update(password);
  const hashedPass = hash.digest("hex");

  return hashedPass;
};

module.exports = hashPassword;
