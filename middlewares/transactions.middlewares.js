const User = require("../models/accounts.model");
const Transaction = require("../models/transactions.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const getExchangeRate = require("../utils/exchangeRate");

exports.validUser = catchAsync(async (req, res, next) => {
    const { type, user, amount } = req.body;
    const { sessionAccount } = req;
    const query = { status: "active" };

    if (type === 1 || type === '1')
        query.email = user.toLowerCase();
    else if (type === 2 || type === '2')
        query.username = user;
  
    const account = await User.Accounts.findOne({
        where: query,
        attributes: ["id", "username", "email", "balance_available"],
        include: [{
            attributes: ["first_name", "middle_name", "surname_1", "surname_2"],
            model: User.Data,
            as: 'data'
        }]
    });
  
    if (!account) {
        return next(new AppError("Account not found", 404));
    }

    if (account.id === sessionAccount.id) {
        return next(new AppError("The user must not be yourself.", 401));
    }

    if(!amount) {
        return res.status(200).send();
    }
    
    req.account = account;

    next();
});
  
exports.validBalance = catchAsync(async (req, res, next) => {
    const { sessionAccount } = req;
    const { amount, currency } = req.body;

    const rate = await getExchangeRate();
    const amountCOP = currency === 'USD' ? Number(amount) * rate : Number(amount);

    if (sessionAccount.balance_available < amountCOP) {
        return next(new AppError("Insuficient balance", 401));
    }

    req.amountCOP = amountCOP;
    next();
});

exports.validConfirmation = catchAsync(async (req, res, next) => {
    const { account } = req;
    const { amount, confirmation } = req.body;

    if(!confirmation){
        return res.status(201).json({
            ...account.toJSON(),
            amount,
        });
    }

    next();
});
  
exports.txById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
        where: { id },
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
    });

    if(!transaction) {
        return next(new AppError("Transaction not found", 404));
    }

    req.transaction = transaction;

    next();
});

exports.manageTx = catchAsync(async (req, res, next) => {
    const { transaction, sessionAccount } = req;
    const { status } = req.body;

    if(transaction.status !== "pending") {
        return next(new AppError("The transaction has already been resolved.", 401));
    }

    if(status && transaction.owner.id !== sessionAccount.id) {
        return next(new AppError("Only the owner can do this.", 401));
    }

    if(status) {
        const rate = await getExchangeRate();
        const currency = transaction.data.currency || 'COP';
        const amountCOP = currency === 'USD' ? transaction.data.amount * rate : transaction.data.amount;

        if(sessionAccount.balance_available < amountCOP) {
            return next(new AppError("Insuficient balance", 401));
        }

        req.amountCOP = amountCOP;
    }

    next();
});