const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const BankAccount = require('../models/bank_account.model');
const DocumentType = require('../models/document_type.model');
const Withdrawal = require('../models/withdrawal.model');

exports.createBankAccount = catchAsync(async (req, res, next) => {
  const { bank_name, account_number, account_type, owner_name, document_number, documentTypeId } = req.body;
  const { sessionAccount } = req;

  const docType = await DocumentType.findByPk(documentTypeId);
  if (!docType) return next(new AppError('Document type not found', 404));

  const bankAccount = await BankAccount.create({
    bank_name,
    account_number,
    account_type,
    owner_name,
    document_number,
    documentTypeId,
    accountId: sessionAccount.id,
  });

  return res.status(201).json({ status: 'success', bankAccount });
});

exports.getMyBankAccounts = catchAsync(async (req, res) => {
  const { sessionAccount } = req;

  const accounts = await BankAccount.findAll({
    where: { accountId: sessionAccount.id, status: 'active' },
    include: [{ model: DocumentType, as: 'documentType', attributes: ['name', 'abbreviation'] }],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(accounts);
});

exports.updateBankAccount = catchAsync(async (req, res, next) => {
  const { bank_name, account_number, account_type, owner_name, document_number, documentTypeId } = req.body;
  const { sessionAccount } = req;

  const bankAccount = await BankAccount.findOne({
    where: { id: req.params.id, accountId: sessionAccount.id, status: 'active' },
  });

  if (!bankAccount) return next(new AppError('Bank account not found', 404));

  if (documentTypeId) {
    const docType = await DocumentType.findByPk(documentTypeId);
    if (!docType) return next(new AppError('Document type not found', 404));
  }

  await bankAccount.update({
    bank_name,
    account_number,
    account_type,
    owner_name,
    document_number,
    documentTypeId,
  });

  return res.status(200).json({ status: 'success', bankAccount });
});

exports.deleteBankAccount = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;

  const bankAccount = await BankAccount.findOne({
    where: { id: req.params.id, accountId: sessionAccount.id },
  });

  if (!bankAccount) return next(new AppError('Bank account not found', 404));

  const pendingWithdrawal = await Withdrawal.findOne({
    where: { bankAccountId: bankAccount.id, status: 'pending' },
  });

  if (pendingWithdrawal) {
    return next(new AppError('No puedes eliminar esta cuenta mientras tenga un retiro pendiente', 400));
  }

  await bankAccount.update({ status: 'inactive' });

  return res.status(200).json({ status: 'success', message: 'Bank account removed' });
});
