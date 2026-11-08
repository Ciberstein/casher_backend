const { DataTypes } = require("sequelize");
const { db } = require("../database/config");

const Accounts = db.define(
  "users_accounts",
  {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "email",
      unique: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "username",
      unique: true
    },
    picture: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "picture",
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "password",
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
      field: "role",
    },
    status: {
      type: DataTypes.ENUM("active", "pending", "disabled"),
      defaultValue: "pending",
      allowNull: false,
      field: "status",
    },
    interest_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7,
      field: "interest_rate",
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "COP",
      field: "currency",
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: "CO",
      field: "country",
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "two_factor_enabled",
    },
    // Secreto TOTP cifrado; mientras two_factor_enabled sea false es solo un alta pendiente
    two_factor_secret: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "two_factor_secret",
    },
    // Hashes sha256 de los códigos de respaldo que aún no se han usado
    two_factor_backup_codes: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "two_factor_backup_codes",
    },
  },
  {
    tableName: "users_accounts",
    schema: "users",
    // Los datos de 2FA nunca salen en consultas normales; se piden con .unscoped()
    defaultScope: {
      attributes: { exclude: ["two_factor_secret", "two_factor_backup_codes"] },
    },
  }
);

const Data = db.define(
  "users_data",
  {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id",
    },
    first_name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "first_name",
    },
    middle_name: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "middle_name",
    },
    surname_1: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "surname_1",
    },
    surname_2: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "surname_2",
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "birthday",
    },
  },
  {
    tableName: "users_data",
    schema: "users",
  }
);

const User = {
  Accounts,
  Data,
}

module.exports = User;
