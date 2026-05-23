const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Recipient = db.define('recipients', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'recipients' });

module.exports = Recipient;
