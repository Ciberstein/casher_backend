const catchAsync = require('../utils/catchAsync');
const Country = require('../models/country.model');

// Países disponibles para elegir (solo los activos)
exports.getCountries = catchAsync(async (req, res) => {
  const countries = await Country.findAll({ where: { active: true }, order: [['name', 'ASC']] });
  return res.status(200).json(countries);
});
