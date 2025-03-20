const { DataTypes } = require("sequelize");
const { db } = require("../database/config");

const Account = db.define(
  "accounts",
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
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "password",
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name",
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
    },
    balance_available: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      field: "balance_available",
    },
    balance_pending: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      field: "balance_pending",
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
  },
  {
    tableName: "accounts",
  }
);

module.exports = Account;
