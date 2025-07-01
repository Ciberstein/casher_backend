const Account = require("../models/accounts.model");
const Transaction = require("../models/transactions.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.validUser = catchAsync(async (req, res, next) => {
    const { type, user, amount } = req.body;
    const { sessionAccount } = req;
    const query = { status: "active" };

    if(type == 1) 
        query.email = user.toLowerCase();
    else if (type == 2)
        query.username = user;
  
    const account = await Account.findOne({
        where: query,
        attributes: ["id", "first_name", "last_name", "username", "email", "balance_available"]
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
    const { amount } = req.body;
  
    if (sessionAccount.balance_available < Number(amount)) {
        return next(new AppError("Insuficient balance", 401));
    }

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
                model: Account,
                attributes: ["id", "email", "username", "first_name", "last_name"],
                as: "owner"
            },
            {
                model: Account,
                attributes: ["id", "email", "username", "first_name", "last_name"],
                as: "receiver"
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

    if(status && sessionAccount.balance_available < transaction.data.amount) {
        return next(new AppError("Insuficient balance", 401));
    }

    next();
});