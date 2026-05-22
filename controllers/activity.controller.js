const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const Transfer = require('../models/transfers.model');
const Withdrawal = require('../models/withdrawal.model');
const Loan = require('../models/loan.model');
const Payment = require('../models/payment.model');
const BankAccount = require('../models/bank_account.model');
const User = require('../models/accounts.model');

exports.getActivity = catchAsync(async (req, res) => {
  const { sessionAccount } = req;
  const all = req.query.all === 'true';
  const limit = 5;

  const queryLimit = all ? undefined : limit;

  const [transactions, withdrawals, loans, payments] = await Promise.all([
    Transfer.findAll({
      where: { [Op.or]: [{ accountId: sessionAccount.id }, { receiverId: sessionAccount.id }] },
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
      order: [['createdAt', 'DESC']],
      ...(queryLimit && { limit: queryLimit }),
    }),
    Withdrawal.findAll({
      where: { accountId: sessionAccount.id },
      include: [{ model: BankAccount, as: 'bankAccount', attributes: ['bank_name'] }],
      order: [['createdAt', 'DESC']],
      ...(queryLimit && { limit: queryLimit }),
    }),
    Loan.findAll({
      where: { accountId: sessionAccount.id },
      order: [['createdAt', 'DESC']],
      ...(queryLimit && { limit: queryLimit }),
    }),
    Payment.findAll({
      where: { accountId: sessionAccount.id },
      order: [['createdAt', 'DESC']],
      ...(queryLimit && { limit: queryLimit }),
    }),
  ]);

  const items = [
    ...transactions.map((tx) => {
      const sent = tx.accountId === sessionAccount.id;
      const other = sent ? tx.receiver : tx.owner;
      return {
        kind: sent ? 'transfer_sent' : 'transfer_received',
        id: `tx-${tx.id}`,
        amount: tx.data.amount,
        currency: 'COP',
        status: tx.status,
        createdAt: tx.createdAt,
        meta: {
          counterparty: other?.data
            ? `${other.data.first_name} ${other.data.surname_1}`
            : null,
          hash: tx.hash,
        },
      };
    }),
    ...withdrawals.map((w) => ({
      kind: 'withdrawal',
      id: `wd-${w.id}`,
      amount: w.amount,
      currency: w.currency,
      status: w.status,
      createdAt: w.createdAt,
      meta: { bankName: w.bankAccount?.bank_name ?? null },
    })),
    ...loans.map((l) => ({
      kind: 'loan',
      id: `ln-${l.id}`,
      amount: l.amount,
      currency: l.currency,
      status: l.status,
      createdAt: l.createdAt,
      meta: {},
    })),
    ...payments.map((p) => ({
      kind: 'payment',
      id: `pay-${p.id}`,
      amount: p.amount,
      currency: p.currency,
      status: 'completed',
      createdAt: p.createdAt,
      meta: {},
    })),
  ];

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json(all ? items : items.slice(0, limit));
});
