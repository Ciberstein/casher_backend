const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const BankAccount = db.define('bank_accounts', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  bank_name: { type: DataTypes.STRING, allowNull: false },
  account_number: { type: DataTypes.STRING, allowNull: false },
  account_type: { type: DataTypes.ENUM('savings', 'checking'), allowNull: false },
  owner_name: { type: DataTypes.STRING, allowNull: false },
  document_number: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  documentTypeId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
}, { tableName: 'bank_accounts' });

module.exports = BankAccount;
