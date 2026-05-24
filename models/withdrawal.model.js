const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Withdrawal = db.define('withdrawals', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  screenshot: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'withdrawals' });

module.exports = Withdrawal;
