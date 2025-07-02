require('dotenv').config();
const fetch = require('node-fetch');

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const BASE_URL = 'https://public-api.birdeye.so/public';

/**
 * Busca o preço de um token pelo símbolo na API Birdeye
 * @param {string} symbol - Ex: 'SOL', 'USDC'
 * @returns {Promise<number|null>} Preço do token ou null se não encontrado
 */
async function getBirdeyePrice(symbol) {
  try {
    const url = `${BASE_URL}/price?symbol=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: { 'X-API-KEY': BIRDEYE_API_KEY }
    });
    if (!res.ok) throw new Error(`Birdeye API error: ${res.status}`);
    const data = await res.json();
    if (data && data.data && typeof data.data.value === 'number') {
      return data.data.value;
    }
    return null;
  } catch (err) {
    console.error('Birdeye price fetch error:', err.message);
    return null;
  }
}

module.exports = { getBirdeyePrice }; 