const { db } = require('../database/config');
const { DataTypes } = require('sequelize');

const Bank = db.define('banks', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  logo: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING(2), allowNull: false, defaultValue: 'CO' },
}, { tableName: 'banks', timestamps: false });

module.exports = Bank;
