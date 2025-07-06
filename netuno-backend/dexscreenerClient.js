const fetch = require('node-fetch');

/**
 * DexScreener API - Gratuita e confiável para preços de tokens
 * Documentação: https://docs.dexscreener.com/
 */

/**
 * Busca preço usando DexScreener
 * @param {string} mint - Token mint address
 * @returns {Promise<number|null>}
 */
async function getDexScreenerPrice(mint) {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
    const response = await fetch(url, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Pegar o par com maior liquidez
      const bestPair = data.pairs.reduce((best, current) => {
        const currentLiquidity = parseFloat(current.liquidity?.usd || '0');
        const bestLiquidity = parseFloat(best.liquidity?.usd || '0');
        return currentLiquidity > bestLiquidity ? current : best;
      });
      
      return parseFloat(bestPair.priceUsd) || null;
    }

    return null;
  } catch (error) {
    console.warn(`DexScreener price fetch error for ${mint.slice(0,8)}:`, error.message);
    return null;
  }
}

/**
 * Busca preços via CoinGecko (para tokens principais)
 */
async function getCoinGeckoPrice(mint) {
  try {
    const tokenIds = {
      'So11111111111111111111111111111111111111112': 'solana',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether'
    };
    
    const coinId = tokenIds[mint];
    if (!coinId) return null;
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const response = await fetch(url, { timeout: 5000 });
    
    if (response.ok) {
      const data = await response.json();
      return data[coinId]?.usd || null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Estratégia de múltiplas fontes para preços
 */
async function getReliablePrice(mint) {
  // 1. Tentar CoinGecko para tokens principais (SOL, USDC, USDT)
  const coinGeckoPrice = await getCoinGeckoPrice(mint);
  if (coinGeckoPrice !== null) {
    return coinGeckoPrice;
  }
  
  // 2. Tentar DexScreener para outros tokens
  const dexScreenerPrice = await getDexScreenerPrice(mint);
  if (dexScreenerPrice !== null) {
    return dexScreenerPrice;
  }
  
  // 3. Fallbacks conhecidos
  const fallbacks = {
    'So11111111111111111111111111111111111111112': 152, // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.0, // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1.0, // USDT
  };
  
  return fallbacks[mint] || null;
}

/**
 * Busca preços de múltiplos tokens
 */
async function getMultipleReliablePrices(mints) {
  const results = new Map();
  
  // Processar sequencialmente para evitar rate limiting
  for (const mint of mints) {
    const price = await getReliablePrice(mint);
    if (price !== null) {
      results.set(mint, price);
    }
    
    // Pequeno delay para ser respeitoso com as APIs
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

module.exports = {
  getDexScreenerPrice,
  getCoinGeckoPrice,
  getReliablePrice,
  getMultipleReliablePrices
};