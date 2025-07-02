const { getBirdeyePrice } = require('./birdeyeClient');
const { getCoinMarketCapPrice } = require('./coinmarketcapClient');

// Cache simples em memória
const priceCache = {};
const CACHE_TTL = 60 * 1000; // 60 segundos

/**
 * Busca o preço do token usando Birdeye e CoinMarketCap, com cache
 * @param {string} symbol
 * @returns {Promise<number|null>}
 */
async function getTokenPrice(symbol) {
  const now = Date.now();
  // Verifica cache
  if (priceCache[symbol] && now - priceCache[symbol].timestamp < CACHE_TTL) {
    return priceCache[symbol].price;
  }
  // Tenta Birdeye primeiro
  let price = await getBirdeyePrice(symbol);
  if (price == null) {
    // Fallback para CoinMarketCap
    price = await getCoinMarketCapPrice(symbol);
  }
  // Atualiza cache
  priceCache[symbol] = { price, timestamp: now };
  return price;
}

module.exports = { getTokenPrice }; 