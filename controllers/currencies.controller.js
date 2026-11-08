const catchAsync = require('../utils/catchAsync');
const Currency = require('../models/currency.model');

// Monedas disponibles para elegir (solo las activas)
exports.getCurrencies = catchAsync(async (req, res) => {
  const currencies = await Currency.findAll({ where: { active: true }, order: [['code', 'ASC']] });
  return res.status(200).json(currencies);
});
