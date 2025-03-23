const Account = require("../models/accounts.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");


exports.validReceiver = catchAsync(async (req, res, next) => {
    const { type, receiver, amount } = req.body;
    const { sessionAccount } = req;
    const query = { status: "active" };

    if(type == 1) 
        query.email = receiver.toLowerCase();
    else if (type == 2)
        query.username = receiver;
  
    const account = await Account.findOne({
        where: query,
        attributes: ["id", "first_name", "last_name", "username", "email", "balance_available"]
    });
  
    if (!account) {
        return next(new AppError("Account not found", 404));
    }

    if (account.id === sessionAccount.id) {
        return next(new AppError("Cannot send funds to your own account", 401));
    }

    if(!amount) {
        return res.status(200).send();
    }
    
    req.account = account;

    next();
});
  
exports.validBalance = catchAsync(async (req, res, next) => {
    const { sessionAccount, account } = req;
    const { amount, confirmation } = req.body;
  
    if (sessionAccount.balance_available < Number(amount)) {
        return next(new AppError("Insuficient balance", 401));
    }

    if(!confirmation){
        return res.status(201).json({
            ...account.toJSON(),
            amount,
        });
    }

    next();
});
  