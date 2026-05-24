const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const AccountBalance = db.define('account_balances', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  accountId: { type: DataTypes.INTEGER, allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false },
  amount: { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'account_balances',
  indexes: [{ unique: true, fields: ['accountId', 'currency'] }],
});

module.exports = AccountBalance;
