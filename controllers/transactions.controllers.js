const { Op } = require("sequelize");
const Transaction = require("../models/transactions.model");
const catchAsync = require("../utils/catchAsync");
const generateHash = require("../utils/generateUUID");
const Account = require("../models/accounts.model");

exports.sendPayment = catchAsync(async (req, res) => {
    const { account, sessionAccount } = req;
    const { amount } = req.body;

    let webHash;
    let hash;
  
    do {
      hash = generateHash(20);
  
      webHash = await Transaction.findOne({
        where: { hash },
      });
    } while (webHash);

    const data = {
        type: 10,
        amount: Number(amount)
    };

    await sessionAccount.update({
        balance_available: 
            sessionAccount.balance_available - Number(amount),
    });

    await account.update({
        balance_available: 
            account.balance_available + Number(amount),
    });

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


exports.getTransactions = catchAsync(async (req, res) => {
    const { sessionAccount } = req;
    const { hash } = req.params;

    const query = { 
        [Op.or]: [{ 
            accounntId: sessionAccount.id,
            receiverId: sessionAccount.id,
        }],
        order: [['id', 'DESC']],
        
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
    };
    
    if(hash) {
        query.hash = hash;
        const transaction = await Transaction.findOne(query);

        return res.status(200).send(transaction);
    };

    const transactions = await Transaction.findAll(query);
    return res.status(200).send(transactions);
});
  