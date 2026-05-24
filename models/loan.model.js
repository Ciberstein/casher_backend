const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Loan = db.define('loans', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'COP' },
  interest_rate: { type: DataTypes.FLOAT, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'paid', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  accepted_at: { type: DataTypes.DATE, allowNull: true },
  paid_amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
}, { tableName: 'loans' });

module.exports = Loan;
