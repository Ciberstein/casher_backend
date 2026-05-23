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
    interest_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7,
      field: "interest_rate",
    },
    currency: {
      type: DataTypes.ENUM("COP", "USD"),
      allowNull: false,
      defaultValue: "COP",
      field: "currency",
    },
  },
  {
    tableName: "users_accounts",
    schema: "users"
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
