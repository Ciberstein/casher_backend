const User = require("../models/accounts.model");

const Codes = require("../models/auth.codes.model");
const Transaction = require("./transactions.model");

const initModel = () => {

  User.Accounts.hasMany(Codes, {
    onDelete: 'CASCADE',
    foreignKey: 'accountId',
    as: 'codes',
  });
  Codes.belongsTo(User.Accounts, {
    foreignKey: 'accountId',
    as: 'account',
  });

  User.Accounts.hasMany(Transaction);

  Transaction.belongsTo(User.Accounts, {
    foreignKey: 'accountId',
    as: 'owner'
  });
  Transaction.belongsTo(User.Accounts, {
    foreignKey: 'receiverId',
    as: 'receiver'
  });

  User.Accounts.hasOne(User.Data, {
    onDelete: 'CASCADE',
    foreignKey: 'accountId',
    as: 'data'
  });
  User.Data.belongsTo(User.Accounts, {
    foreignKey: 'accountId',
    as: 'account'
  });



};

module.exports = initModel;
