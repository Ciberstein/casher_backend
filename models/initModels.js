const User = require('../models/accounts.model');
const Bank = require('./bank.model');
const Codes = require('../models/auth.codes.model');
const Transfer = require('./transfers.model');
const Loan = require('./loan.model');
const BankAccount = require('./bank_account.model');
const Withdrawal = require('./withdrawal.model');
const DocumentType = require('./document_type.model');
const Payment = require('./payment.model');
const Recipient = require('./recipient.model');
const AppBankAccount = require('./app_bank_account.model');
const DepositRequest = require('./deposit_request.model');

const initModel = () => {

  User.Accounts.hasMany(Codes, { onDelete: 'CASCADE', foreignKey: 'accountId', as: 'codes' });
  Codes.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'account' });

  User.Accounts.hasMany(Transfer);
  Transfer.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'owner' });
  Transfer.belongsTo(User.Accounts, { foreignKey: 'receiverId', as: 'receiver' });

  User.Accounts.hasOne(User.Data, { onDelete: 'CASCADE', foreignKey: 'accountId', as: 'data' });
  User.Data.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'account' });

  User.Accounts.hasMany(Loan, { foreignKey: 'accountId', as: 'loans' });
  Loan.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'account' });

  User.Accounts.hasMany(BankAccount, { onDelete: 'CASCADE', foreignKey: 'accountId', as: 'bankAccounts' });
  BankAccount.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'account' });

  User.Accounts.hasMany(Withdrawal, { foreignKey: 'accountId', as: 'withdrawals' });
  Withdrawal.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'account' });
  BankAccount.hasMany(Withdrawal, { foreignKey: 'bankAccountId', as: 'withdrawals' });
  Withdrawal.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

  DocumentType.hasMany(BankAccount, { foreignKey: 'documentTypeId', as: 'bankAccounts' });
  BankAccount.belongsTo(DocumentType, { foreignKey: 'documentTypeId', as: 'documentType' });

  User.Accounts.hasMany(Payment, { foreignKey: 'accountId', as: 'payments' });
  Payment.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'account' });

  User.Accounts.hasMany(Recipient, { foreignKey: 'accountId', as: 'recipients' });
  Recipient.belongsTo(User.Accounts, { foreignKey: 'accountId' });
  Recipient.belongsTo(User.Accounts, { foreignKey: 'recipientId', as: 'recipient' });

  DocumentType.hasMany(AppBankAccount, { foreignKey: 'documentTypeId', as: 'appBankAccounts' });
  AppBankAccount.belongsTo(DocumentType, { foreignKey: 'documentTypeId', as: 'documentType' });

  User.Accounts.hasMany(DepositRequest, { foreignKey: 'accountId', as: 'depositRequests' });
  DepositRequest.belongsTo(User.Accounts, { foreignKey: 'accountId', as: 'account' });
  AppBankAccount.hasMany(DepositRequest, { foreignKey: 'appBankAccountId', as: 'depositRequests' });
  DepositRequest.belongsTo(AppBankAccount, { foreignKey: 'appBankAccountId', as: 'appBankAccount' });

};

module.exports = initModel;
