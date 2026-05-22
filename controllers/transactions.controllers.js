const { Op } = require("sequelize");
const Transaction = require("../models/transactions.model");
const catchAsync = require("../utils/catchAsync");
const generateHash = require("../utils/generateUUID");
const User = require("../models/accounts.model");

exports.sendPayment = catchAsync(async (req, res) => {
    const { account, sessionAccount, amountCOP } = req;
    const { amount, currency } = req.body;

    let webHash;
    let hash;

    do {
      hash = generateHash(20);
      webHash = await Transaction.findOne({ where: { hash } });
    } while (webHash);

    const data = {
        type: 10,
        amount: Number(amount),
        currency: currency || 'COP',
    };

    await Promise.all([
        sessionAccount.decrement("balance_available", { by: amountCOP }),
        account.increment("balance_available", { by: amountCOP }),
    ]);

    await Transaction.create({
        accountId: sessionAccount.id,
        receiverId: account.id,
        status: "completed",
        hash,
        data
    });

    return res.status(202).json({
        status: "success",
        message: "Founds send successfully"
    });
});

exports.requestPayment = catchAsync(async (req, res) => {
    const { account, sessionAccount } = req;
    const { amount, currency } = req.body;

    let webHash;
    let hash;

    do {
      hash = generateHash(20);
      webHash = await Transaction.findOne({ where: { hash } });
    } while (webHash);

    const data = {
        type: 10,
        amount: Number(amount),
        currency: currency || 'COP',
    };

    await Transaction.create({
        accountId: account.id,
        receiverId: sessionAccount.id,
        status: "pending",
        hash,
        data
    });
  
    return res.status(202).json({
        status: "success",
        message: "Request send successfully"
    });
});


exports.getTransactions = catchAsync(async (req, res) => {
    const { sessionAccount } = req;
    const { hash } = req.params;

    const query = { 
        [Op.or]: [{ 
            accounntId: sessionAccount.id,
            receiverId: sessionAccount.id,
        }],
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
                }]
            },
            {
                model: User.Accounts,
                attributes: ["id", "email", "username"],
                as: "receiver",
                include: [{
                    model: User.Data,
                    attributes: ["first_name", "middle_name", "surname_1", "surname_2"],
                    as: "data",
                }]
            }
        ]
    };
    
    if(hash) {
        query.hash = hash;
        const transaction = await Transaction.findOne(query);

        return res.status(200).send(transaction);
    };

    const transactions = await Transaction.findAll(query);
    return res.status(200).send(transactions);
});

exports.getPublicTransaction = catchAsync(async (req, res, next) => {
  const { hash } = req.params;
  const AppError = require('../utils/appError');

  const transaction = await Transaction.findOne({
    where: { hash },
    attributes: ['hash', 'status', 'data', 'createdAt'],
    include: [
      {
        model: User.Accounts, as: 'owner', attributes: [],
        include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'surname_1'] }],
      },
      {
        model: User.Accounts, as: 'receiver', attributes: [],
        include: [{ model: User.Data, as: 'data', attributes: ['first_name', 'surname_1'] }],
      },
    ],
  });

  if (!transaction) return next(new AppError('Transacción no encontrada', 404));

  return res.status(200).json({
    hash: transaction.hash,
    status: transaction.status,
    amount: transaction.data.amount,
    currency: transaction.data.currency || 'COP',
    createdAt: transaction.createdAt,
    sender: `${transaction.owner.data.first_name} ${transaction.owner.data.surname_1}`,
    receiver: `${transaction.receiver.data.first_name} ${transaction.receiver.data.surname_1}`,
  });
});

exports.updateTx = catchAsync(async (req, res) => {
    const { transaction, amountCOP } = req;
    const { status } = req.body;

    if(status) {
        await Promise.all([
            transaction.owner.decrement("balance_available", { by: amountCOP }),
            transaction.receiver.increment("balance_available", { by: amountCOP }),
        ]);
    }

    await transaction.update({
        status: status ? 'completed' : 'cancelled'
    });

    return res.status(200).json({
        status: "success",
        message: `Transaction ${status ? 'completed' : 'cancelled'}`
    });
});