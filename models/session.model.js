const { DataTypes } = require("sequelize");
const { db } = require("../database/config");

// Una fila por sesión iniciada (un login = una sesión). Borrarla cierra la sesión al instante.
const Session = db.define(
  "auth_sessions",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    browser: { type: DataTypes.STRING(40), allowNull: true },
    os: { type: DataTypes.STRING(40), allowNull: true },
    device_type: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "desktop" },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    location: { type: DataTypes.STRING(120), allowNull: true },
    last_seen_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: "auth_sessions" }
);

module.exports = Session;
