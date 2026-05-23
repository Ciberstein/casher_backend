const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const AppBankAccount = require('../models/app_bank_account.model');
const DocumentType = require('../models/document_type.model');

exports.getAppBankAccounts = catchAsync(async (req, res) => {
  const accounts = await AppBankAccount.findAll({
    where: { status: 'active' },
    include: [{ model: DocumentType, as: 'documentType', attributes: ['name', 'abbreviation'] }],
    order: [['createdAt', 'ASC']],
  });
  return res.status(200).json(accounts);
});

exports.createAppBankAccount = catchAsync(async (req, res, next) => {
  const { bank_name, account_number, account_type, owner_name, document_number, documentTypeId } = req.body;

  const docType = await DocumentType.findByPk(documentTypeId);
  if (!docType) return next(new AppError('Document type not found', 404));

  const account = await AppBankAccount.create({
    bank_name, account_number, account_type, owner_name, document_number, documentTypeId,
  });

  return res.status(201).json({ status: 'success', account });
});

exports.updateAppBankAccount = catchAsync(async (req, res, next) => {
  const { bank_name, account_number, account_type, owner_name, document_number, documentTypeId } = req.body;

  const account = await AppBankAccount.findOne({ where: { id: req.params.id, status: 'active' } });
  if (!account) return next(new AppError('Account not found', 404));

  if (documentTypeId) {
    const docType = await DocumentType.findByPk(documentTypeId);
    if (!docType) return next(new AppError('Document type not found', 404));
  }

  await account.update({ bank_name, account_number, account_type, owner_name, document_number, documentTypeId });
  return res.status(200).json({ status: 'success', account });
});

exports.deleteAppBankAccount = catchAsync(async (req, res, next) => {
  const account = await AppBankAccount.findOne({ where: { id: req.params.id } });
  if (!account) return next(new AppError('Account not found', 404));

  await account.update({ status: 'inactive' });
  return res.status(200).json({ status: 'success' });
});
