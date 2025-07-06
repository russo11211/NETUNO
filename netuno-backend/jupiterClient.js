const fetch = require('node-fetch');

/**
 * Jupiter Price API - Alternativa gratuita e confiável
 * Documentação: https://station.jup.ag/docs/apis/price-api-v2
 */

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

/**
 * Busca preço usando Jupiter Price API
 * @param {string} mint - Token mint address
 * @returns {Promise<number|null>}
 */
async function getJupiterPrice(mint) {
  try {
    const url = `${JUPITER_PRICE_API}?ids=${mint}`;
    const response = await fetch(url, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Jupiter API error: ${response.status} for ${mint.slice(0,8)}`);
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data[mint] && data.data[mint].price) {
      return parseFloat(data.data[mint].price);
    }

    return null;
  } catch (error) {
    console.warn(`Jupiter price fetch error for ${mint.slice(0,8)}:`, error.message);
    return null;
  }
}

/**
 * Busca preços de múltiplos tokens usando Jupiter
 * @param {string[]} mints - Array de mint addresses
 * @returns {Promise<Map<string, number>>}
 */
async function getMultipleJupiterPrices(mints) {
  if (mints.length === 0) return new Map();

  try {
    // Jupiter permite até 100 tokens por request
    const batchSize = 50;
    const results = new Map();

    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const ids = batch.join(',');
      
      const url = `${JUPITER_PRICE_API}?ids=${ids}`;
      const response = await fetch(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data) {
          batch.forEach(mint => {
            if (data.data[mint] && data.data[mint].price) {
              results.set(mint, parseFloat(data.data[mint].price));
            }
          });
        }
      }
      
      // Pequeno delay entre batches
      if (i + batchSize < mints.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  } catch (error) {
    console.error('Jupiter batch price fetch error:', error.message);
    return new Map();
  }
}

/**
 * Preços conhecidos como fallback
 */
const FALLBACK_PRICES = {
  'So11111111111111111111111111111111111111112': 150, // SOL ~$150
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.0, // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1.0, // USDT
};

/**
 * Busca preço com fallback
 */
async function getTokenPriceWithFallback(mint) {
  // Tentar Jupiter primeiro
  let price = await getJupiterPrice(mint);
  
  if (price !== null) {
    return price;
  }
  
  // Fallback para preços conhecidos
  if (FALLBACK_PRICES[mint]) {
    return FALLBACK_PRICES[mint];
  }
  
  return null;
}

module.exports = {
  getJupiterPrice,
  getMultipleJupiterPrices,
  getTokenPriceWithFallback
};