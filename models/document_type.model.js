const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const DocumentType = db.define('document_types', {
  id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  abbreviation: { type: DataTypes.STRING(10), allowNull: false },
  country: { type: DataTypes.STRING(2), allowNull: false, defaultValue: 'CO' },
}, { tableName: 'document_types', timestamps: false });

module.exports = DocumentType;
