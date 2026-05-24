const AccountBalance = require('../models/account_balance.model');

const getBalance = async (accountId, currency) => {
  const [balance] = await AccountBalance.findOrCreate({
    where: { accountId, currency },
    defaults: { amount: 0 },
  });
  return balance;
};

module.exports = getBalance;
