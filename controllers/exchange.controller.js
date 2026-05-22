const catchAsync = require('../utils/catchAsync');
const getExchangeRate = require('../utils/exchangeRate');

exports.getExchangeRate = catchAsync(async (req, res) => {
  const rate = await getExchangeRate();
  return res.status(200).json({ rate });
});
