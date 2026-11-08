const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Country = db.define('countries', {
  code: { primaryKey: true, type: DataTypes.STRING(2), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'countries', timestamps: false });

module.exports = Country;
