const Account = require("../models/accounts.model");
const Codes = require("../models/auth.codes.model");

const initModel = () => {

  Account.hasMany(Codes);
  Codes.belongsTo(Account, { foreignKey: 'accountId' });

};

module.exports = initModel;
