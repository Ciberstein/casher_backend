const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Currency = db.define('currencies', {
  code: { primaryKey: true, type: DataTypes.STRING(10), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'currencies', timestamps: false });

module.exports = Currency;
