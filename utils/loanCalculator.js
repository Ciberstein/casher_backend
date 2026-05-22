const MS_PER_DAY = 1000 * 60 * 60 * 24;

const calculateOutstanding = (amount, rate, acceptedAt, paidAmount = 0) => {
  const days = (Date.now() - new Date(acceptedAt).getTime()) / MS_PER_DAY;
  const gross = amount * Math.pow(1 + rate / 100, days);
  return Math.max(0, gross - paidAmount);
};

module.exports = calculateOutstanding;
