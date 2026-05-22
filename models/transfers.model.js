const { DataTypes } = require("sequelize");
const { db } = require("../database/config");

const Transfer = db.define(
  "transfers",
  {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id",
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "hash",
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "data",
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "receiverId",
    },
    status: {
      type: DataTypes.ENUM("completed", "pending", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
      field: "status",
    },
  },
  {
    tableName: "transfers",
  }
);

module.exports = Transfer;
