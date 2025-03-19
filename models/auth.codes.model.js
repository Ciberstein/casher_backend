const { DataTypes } = require("sequelize");
const { db } = require("../database/config");

const Account = db.define(
  "auth_codes",
  {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id",
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "code",
    },
  },
  {
    tableName: "auth_codes",
  }
);

module.exports = Account;
