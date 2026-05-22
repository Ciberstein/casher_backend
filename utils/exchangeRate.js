let cache = { rate: null, timestamp: null };
const CACHE_TTL = 60 * 60 * 1000;
const FALLBACK_RATE = 4200;

const getExchangeRate = async () => {
  const now = Date.now();
  if (cache.rate && (now - cache.timestamp) < CACHE_TTL) return cache.rate;
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=COP');
    const data = await response.json();
    if (!data?.rates?.COP) throw new Error('Invalid response');
    cache.rate = data.rates.COP;
    cache.timestamp = now;
  } catch {
    if (!cache.rate) cache.rate = FALLBACK_RATE;
  }
  return cache.rate;
};

module.exports = getExchangeRate;
