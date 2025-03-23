const Account = require("../models/accounts.model");
const Codes = require("../models/auth.codes.model");
const Transaction = require("./transactions.model");

const initModel = () => {

  Account.hasMany(Codes);
  Codes.belongsTo(Account, { foreignKey: 'accountId' });

  Account.hasMany(Transaction);

  Transaction.belongsTo(Account, { foreignKey: 'accountId', as: "owner" });
  Transaction.belongsTo(Account, { foreignKey: 'receiverId', as: "receiver" });

};

module.exports = initModel;
