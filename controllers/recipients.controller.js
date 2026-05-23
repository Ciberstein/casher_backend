const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Recipient = require('../models/recipient.model');
const User = require('../models/accounts.model');
const { Op } = require('sequelize');

exports.getRecipients = catchAsync(async (req, res) => {
  const { sessionAccount } = req;

  const recipients = await Recipient.findAll({
    where: { accountId: sessionAccount.id },
    include: [{
      model: User.Accounts,
      as: 'recipient',
      attributes: ['id', 'username', 'email', 'picture'],
      include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'surname_1'] }],
    }],
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(recipients);
});

exports.addRecipient = catchAsync(async (req, res, next) => {
  const { user } = req.body;
  const { sessionAccount } = req;

  if (!user) return next(new AppError('Usuario requerido', 400));

  const isEmail = user.includes('@');
  const target = await User.Accounts.findOne({
    where: isEmail ? { email: user } : { username: user },
    attributes: ['id', 'username', 'email', 'picture'],
    include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'surname_1'] }],
  });

  if (!target) return next(new AppError('Usuario no encontrado', 404));
  if (target.id === sessionAccount.id) return next(new AppError('No puedes agregarte a ti mismo', 400));

  const existing = await Recipient.findOne({ where: { accountId: sessionAccount.id, recipientId: target.id } });
  if (existing) return next(new AppError('Ya está en tu lista de destinatarios', 409));

  const recipient = await Recipient.create({ accountId: sessionAccount.id, recipientId: target.id });

  return res.status(201).json({ ...recipient.toJSON(), recipient: target });
});

exports.deleteRecipient = catchAsync(async (req, res, next) => {
  const { sessionAccount } = req;

  const recipient = await Recipient.findOne({ where: { id: req.params.id, accountId: sessionAccount.id } });
  if (!recipient) return next(new AppError('Destinatario no encontrado', 404));

  await recipient.destroy();
  return res.status(200).json({ status: 'success' });
});
