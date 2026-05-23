const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const DepositRequest = db.define('deposit_requests', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.ENUM('COP', 'USD'), allowNull: false },
  deposit_cop: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  screenshot: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, { tableName: 'deposit_requests' });

module.exports = DepositRequest;
