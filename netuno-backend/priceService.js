const { getBirdeyePrice, getMultipleBirdeyePrices } = require('./birdeyeClient');
const { getCoinMarketCapPrice } = require('./coinmarketcapClient');
const { getReliablePrice, getMultipleReliablePrices } = require('./dexscreenerClient');

// Cache simples em memória
const priceCache = {};
const CACHE_TTL = 60 * 1000; // 60 segundos

/**
 * Busca o preço do token usando Birdeye e CoinMarketCap, com cache
 * @param {string} symbolOrMint - Símbolo ou mint address
 * @returns {Promise<number|null>}
 */
async function getTokenPrice(symbolOrMint) {
  const now = Date.now();
  const cacheKey = symbolOrMint.toLowerCase();
  
  // Verifica cache
  if (priceCache[cacheKey] && now - priceCache[cacheKey].timestamp < CACHE_TTL) {
    return priceCache[cacheKey].price;
  }
  
  // Estratégia multi-fonte: Jupiter -> Birdeye -> CoinMarketCap
  let price = null;
  
  // 1. Tentar DexScreener/CoinGecko primeiro (sem rate limit)
  if (symbolOrMint.length > 20) { // É mint address
    price = await getReliablePrice(symbolOrMint);
  }
  
  // 2. Se falhou, tentar Birdeye
  if (price === null) {
    price = await getBirdeyePrice(symbolOrMint);
  }
  
  // 3. Fallback para CoinMarketCap (apenas símbolos)
  if (price === null && symbolOrMint.length <= 10) {
    price = await getCoinMarketCapPrice(symbolOrMint);
  }
  
  // Atualiza cache
  priceCache[cacheKey] = { price, timestamp: now };
  return price;
}

/**
 * Busca preços de múltiplos tokens
 * @param {string[]} symbolsOrMints - Array de símbolos ou mint addresses
 * @returns {Promise<Map<string, number>>} Map de symbol/mint para preço
 */
async function getMultipleTokenPrices(symbolsOrMints) {
  const now = Date.now();
  const results = new Map();
  const toFetch = [];

  // Verificar cache primeiro
  for (const symbolOrMint of symbolsOrMints) {
    const cacheKey = symbolOrMint.toLowerCase();
    if (priceCache[cacheKey] && now - priceCache[cacheKey].timestamp < CACHE_TTL) {
      results.set(symbolOrMint, priceCache[cacheKey].price);
    } else {
      toFetch.push(symbolOrMint);
    }
  }

  // Buscar preços que não estão em cache
  if (toFetch.length > 0) {
    console.log(`🔍 Fetching prices for ${toFetch.length} tokens using multi-source strategy`);
    
    // Separar mints de símbolos
    const mints = toFetch.filter(item => item.length > 20);
    const symbols = toFetch.filter(item => item.length <= 10);
    
    // 1. Buscar preços via DexScreener/CoinGecko para mints (rápido, sem rate limit)
    if (mints.length > 0) {
      console.log(`📡 DexScreener/CoinGecko API: fetching ${mints.length} token prices`);
      const reliablePrices = await getMultipleReliablePrices(mints);
      
      reliablePrices.forEach((price, mint) => {
        results.set(mint, price);
        priceCache[mint.toLowerCase()] = { price, timestamp: now };
      });
    }
    
    // 2. Para tokens não encontrados, tentar Birdeye (se não atingiu rate limit)
    const notFoundTokens = toFetch.filter(token => !results.has(token));
    if (notFoundTokens.length > 0) {
      console.log(`🐦 Birdeye API: trying ${notFoundTokens.length} remaining tokens`);
      
      for (const token of notFoundTokens.slice(0, 3)) { // Máximo 3 para evitar rate limit
        const price = await getBirdeyePrice(token);
        if (price !== null) {
          results.set(token, price);
          priceCache[token.toLowerCase()] = { price, timestamp: now };
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit protection
      }
    }
    
    // 3. Fallback para símbolos via CoinMarketCap
    for (const symbol of symbols) {
      if (!results.has(symbol)) {
        const fallbackPrice = await getCoinMarketCapPrice(symbol);
        if (fallbackPrice !== null) {
          results.set(symbol, fallbackPrice);
          priceCache[symbol.toLowerCase()] = { price: fallbackPrice, timestamp: now };
        }
      }
    }
  }

  return results;
}

/**
 * Calcula o valor USD de uma posição LP
 * @param {Object} position - Dados da posição LP
 * @returns {Promise<number|null>} Valor em USD ou null
 */
async function calculatePositionValueUSD(position) {
  try {
    if (!position.tokenInfo) {
      return null;
    }

    const { tokenX, tokenY } = position.tokenInfo;
    
    // Buscar preços dos dois tokens
    console.log(`🔍 Fetching prices for: ${tokenX.symbol} (${tokenX.mint.slice(0,8)}) and ${tokenY.symbol} (${tokenY.mint.slice(0,8)})`);
    const prices = await getMultipleTokenPrices([tokenX.mint, tokenY.mint]);
    
    const priceX = prices.get(tokenX.mint);
    const priceY = prices.get(tokenY.mint);

    console.log(`💰 Prices found: ${tokenX.symbol}=$${priceX || 'N/A'}, ${tokenY.symbol}=$${priceY || 'N/A'}`);

    // Se nenhum preço foi encontrado, retornar null
    if (priceX === undefined && priceY === undefined) {
      console.warn(`❌ No prices found for either token`);
      return null;
    }

    // Calcular valor de cada token na posição (converter de wei)
    const adjustedAmountX = tokenX.userAmount / Math.pow(10, tokenX.decimals);
    const adjustedAmountY = tokenY.userAmount / Math.pow(10, tokenY.decimals);
    
    const valueX = adjustedAmountX * (priceX || 0);
    const valueY = adjustedAmountY * (priceY || 0);
    
    const totalValue = valueX + valueY;

    console.log(`💰 Position value calculated: ${tokenX.symbol}=${adjustedAmountX.toFixed(4)} ($${valueX.toFixed(2)}) + ${tokenY.symbol}=${adjustedAmountY.toFixed(4)} ($${valueY.toFixed(2)}) = $${totalValue.toFixed(2)}`);

    return totalValue > 0 ? totalValue : null;
  } catch (error) {
    console.error('Error calculating position value:', error.message);
    return null;
  }
}

/**
 * Enriquece posições LP com valores USD
 * @param {Array} lpPositions - Array de posições LP
 * @returns {Promise<Array>} Posições enriquecidas com valores USD
 */
async function enrichPositionsWithPrices(lpPositions) {
  const enrichedPositions = [];

  for (const position of lpPositions) {
    try {
      const valueUSD = await calculatePositionValueUSD(position);
      
      let tokenXValueUSD = null;
      let tokenYValueUSD = null;
      
      if (position.tokenInfo) {
        // Buscar preços individuais para breakdown (mesmo que valueUSD seja null)
        const { tokenX, tokenY } = position.tokenInfo;
        const prices = await getMultipleTokenPrices([tokenX.mint, tokenY.mint]);
        
        const priceX = prices.get(tokenX.mint);
        const priceY = prices.get(tokenY.mint);
        
        if (priceX !== undefined && priceX !== null) {
          tokenXValueUSD = (tokenX.userAmount / Math.pow(10, tokenX.decimals)) * priceX; // Converter de wei
        }
        if (priceY !== undefined && priceY !== null) {
          tokenYValueUSD = (tokenY.userAmount / Math.pow(10, tokenY.decimals)) * priceY; // Converter de wei
        }
        
        // Se temos pelo menos um preço, calcular o total
        if (tokenXValueUSD !== null || tokenYValueUSD !== null) {
          valueUSD = (tokenXValueUSD || 0) + (tokenYValueUSD || 0);
        }
      }

      enrichedPositions.push({
        ...position,
        valueUSD,
        tokenXValueUSD,
        tokenYValueUSD,
        lastPriceUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error enriching position ${position.mint}:`, error.message);
      enrichedPositions.push({
        ...position,
        valueUSD: null,
        tokenXValueUSD: null,
        tokenYValueUSD: null,
        priceError: error.message
      });
    }
  }

  return enrichedPositions;
}

/**
 * Limpa cache de preços
 */
function clearPriceCache() {
  Object.keys(priceCache).forEach(key => delete priceCache[key]);
}

/**
 * Obtém estatísticas do cache
 */
function getPriceCacheStats() {
  const now = Date.now();
  const validEntries = Object.entries(priceCache).filter(([key, data]) => 
    now - data.timestamp < CACHE_TTL
  );
  
  return {
    totalEntries: Object.keys(priceCache).length,
    validEntries: validEntries.length,
    expiredEntries: Object.keys(priceCache).length - validEntries.length
  };
}

module.exports = { 
  getTokenPrice, 
  getMultipleTokenPrices,
  calculatePositionValueUSD,
  enrichPositionsWithPrices,
  clearPriceCache,
  getPriceCacheStats
}; 