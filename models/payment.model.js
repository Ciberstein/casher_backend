const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Payment = db.define('payments', {
  id:       { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  amount:   { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.ENUM('COP', 'USD'), allowNull: false, defaultValue: 'COP' },
}, { tableName: 'payments' });

module.exports = Payment;
