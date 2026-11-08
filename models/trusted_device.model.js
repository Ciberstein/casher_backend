const { DataTypes } = require("sequelize");
const { db } = require("../database/config");

// Dispositivos que se saltan el segundo factor. El navegador guarda el token en una cookie;
// aquí solo queda su hash.
const TrustedDevice = db.define(
  "trusted_devices",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    token_hash: { type: DataTypes.STRING(64), allowNull: false },
    browser: { type: DataTypes.STRING(40), allowNull: true },
    os: { type: DataTypes.STRING(40), allowNull: true },
    device_type: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "desktop" },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    location: { type: DataTypes.STRING(120), allowNull: true },
    last_used_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    expires_at: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "trusted_devices" }
);

module.exports = TrustedDevice;
