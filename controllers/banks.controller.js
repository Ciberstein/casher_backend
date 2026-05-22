const catchAsync = require('../utils/catchAsync');
const Bank = require('../models/bank.model');

exports.getBanks = catchAsync(async (req, res) => {
  const { country = 'CO' } = req.query;
  const banks = await Bank.findAll({ where: { country }, order: [['name', 'ASC']] });
  return res.status(200).json(banks);
});
