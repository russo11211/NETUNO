require('dotenv').config();
const fetch = require('node-fetch');

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

/**
 * Busca o preço de um token pelo símbolo na API CoinMarketCap
 * @param {string} symbol - Ex: 'SOL', 'USDC'
 * @returns {Promise<number|null>} Preço do token ou null se não encontrado
 */
async function getCoinMarketCapPrice(symbol) {
  try {
    const url = `${BASE_URL}/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY }
    });
    if (!res.ok) throw new Error(`CoinMarketCap API error: ${res.status}`);
    const data = await res.json();
    if (data && data.data && data.data[symbol] && data.data[symbol].quote && data.data[symbol].quote.USD && typeof data.data[symbol].quote.USD.price === 'number') {
      return data.data[symbol].quote.USD.price;
    }
    return null;
  } catch (err) {
    console.error('CoinMarketCap price fetch error:', err.message);
    return null;
  }
}

module.exports = { getCoinMarketCapPrice }; 