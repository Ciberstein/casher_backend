const { Op } = require("sequelize");
const Transfer = require("../models/transfers.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const generateHash = require("../utils/generateUUID");
const User = require("../models/accounts.model");
const getBalance = require("../utils/getBalance");
const { send } = require('../services/email.service');
const { transferReceived, transferRequested } = require('../emails/templates');

exports.sendPayment = catchAsync(async (req, res) => {
  const { account, sessionAccount, amount, currency } = req;

  let webHash;
  let hash;

  do {
    hash = generateHash(20);
    webHash = await Transfer.findOne({ where: { hash } });
  } while (webHash);

  await Promise.all([
    getBalance(sessionAccount.id, currency).then(b => b.decrement('amount', { by: amount })),
    getBalance(account.id, currency).then(b => b.increment('amount', { by: amount })),
  ]);

  await Transfer.create({
    accountId: sessionAccount.id,
    receiverId: account.id,
    status: "completed",
    hash,
    data: { type: 10, amount, currency },
  });

  const senderName = `${sessionAccount.data.first_name} ${sessionAccount.data.surname_1}`;
  const { subject, html } = transferReceived({ senderName, amount, currency });
  send(account.email, subject, html);

  return res.status(202).json({
    status: "success",
    message: "Founds send successfully",
    hash,
  });
});

exports.requestPayment = catchAsync(async (req, res) => {
  const { account, sessionAccount } = req;
  const { amount, currency } = req.body;

  let webHash;
  let hash;

  do {
    hash = generateHash(20);
    webHash = await Transfer.findOne({ where: { hash } });
  } while (webHash);

  await Transfer.create({
    accountId: account.id,
    receiverId: sessionAccount.id,
    status: "pending",
    hash,
    data: { type: 10, amount: Number(amount), currency: currency || 'COP' },
  });

  const requesterName = `${sessionAccount.data.first_name} ${sessionAccount.data.surname_1}`;
  const { subject, html } = transferRequested({ requesterName, amount: Number(amount), currency: currency || 'COP' });
  send(account.email, subject, html);

  return res.status(202).json({
    status: "success",
    message: "Request send successfully",
    hash,
  });
});

exports.getTransfers = catchAsync(async (req, res) => {
  const { sessionAccount } = req;
  const { hash } = req.params;

  const options = {
    where: {
      [Op.or]: [
        { accountId: sessionAccount.id },
        { receiverId: sessionAccount.id },
      ],
    },
    attributes: ["id", "hash", "data", "status", "createdAt"],
    order: [['id', 'DESC']],
    include: [
      {
        model: User.Accounts,
        attributes: ["id", "email", "username"],
        as: "owner",
        include: [{
          model: User.Data,
          attributes: ["first_name", "middle_name", "surname_1", "surname_2"],
          as: "data",
        }],
      },
      {
        model: User.Accounts,
        attributes: ["id", "email", "username"],
        as: "receiver",
        include: [{
          model: User.Data,
          attributes: ["first_name", "middle_name", "surname_1", "surname_2"],
          as: "data",
        }],
      },
    ],
  };

  if (hash) {
    options.where.hash = hash;
    const transfer = await Transfer.findOne(options);
    return res.status(200).send(transfer);
  }

  const transfers = await Transfer.findAll(options);
  return res.status(200).send(transfers);
});

exports.getPublicTransfer = catchAsync(async (req, res, next) => {
  const { hash } = req.params;

  const transfer = await Transfer.findOne({
    where: { hash },
    attributes: ['hash', 'status', 'data', 'createdAt'],
    include: [
      {
        model: User.Accounts, as: 'owner', attributes: ['id'],
        include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'surname_1'] }],
      },
      {
        model: User.Accounts, as: 'receiver', attributes: ['id'],
        include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'surname_1'] }],
      },
    ],
  });

  if (!transfer) return next(new AppError('Transacción no encontrada', 404));

  return res.status(200).json({
    hash: transfer.hash,
    status: transfer.status,
    amount: transfer.data.amount,
    currency: transfer.data.currency || 'COP',
    createdAt: transfer.createdAt,
    sender: `${transfer.owner.data.first_name} ${transfer.owner.data.surname_1}`,
    receiver: `${transfer.receiver.data.first_name} ${transfer.receiver.data.surname_1}`,
  });
});

exports.updateTx = catchAsync(async (req, res) => {
  const { transaction, amount, currency } = req;
  const { status } = req.body;

  if (status) {
    await Promise.all([
      getBalance(transaction.owner.id, currency).then(b => b.decrement('amount', { by: amount })),
      getBalance(transaction.receiver.id, currency).then(b => b.increment('amount', { by: amount })),
    ]);
  }

  await transaction.update({
    status: status ? 'completed' : 'cancelled'
  });

  if (status) {
    const payerName = `${transaction.owner.data.first_name} ${transaction.owner.data.surname_1}`;
    const { subject, html } = transferReceived({
      senderName: payerName,
      amount: transaction.data.amount,
      currency: transaction.data.currency || 'COP',
    });
    send(transaction.receiver.email, subject, html);
  }

  return res.status(200).json({
    status: "success",
    message: `Transaction ${status ? 'completed' : 'cancelled'}`
  });
});
