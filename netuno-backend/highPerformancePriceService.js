const { getReliablePrice, getMultipleReliablePrices } = require('./dexscreenerClient');
const { getBirdeyePrice, getMultipleBirdeyePrices } = require('./birdeyeClient');
const { getCoinMarketCapPrice } = require('./coinmarketcapClient');

// High-performance in-memory cache with TTL
class HighPerformanceCache {
  constructor(defaultTtl = 30000) { // 30 seconds default
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
  }

  set(key, value, ttl = this.defaultTtl) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const [key, item] of this.cache) {
      if (now > item.expiry) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return { total: this.cache.size, valid, expired };
  }
}

// Global cache instance
const priceCache = new HighPerformanceCache(30000); // 30 second TTL
const batchCache = new HighPerformanceCache(60000); // 1 minute TTL for batch results

// Rate limiting for external APIs
const rateLimiter = {
  birdeye: { lastCall: 0, minInterval: 200 }, // 5 calls per second max
  coinmarket: { lastCall: 0, minInterval: 1000 } // 1 call per second max
};

async function waitForRateLimit(service) {
  const limiter = rateLimiter[service];
  if (!limiter) return;
  
  const timeSinceLastCall = Date.now() - limiter.lastCall;
  if (timeSinceLastCall < limiter.minInterval) {
    await new Promise(resolve => setTimeout(resolve, limiter.minInterval - timeSinceLastCall));
  }
  limiter.lastCall = Date.now();
}

/**
 * Ultra-fast single token price with intelligent caching
 * @param {string} mintOrSymbol - Token mint address or symbol
 * @returns {Promise<number|null>}
 */
async function getFastTokenPrice(mintOrSymbol) {
  const cacheKey = mintOrSymbol.toLowerCase();
  
  // Check cache first
  const cached = priceCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  const startTime = Date.now();
  let price = null;
  
  try {
    // Strategy 1: DexScreener/CoinGecko (fastest, no rate limit)
    if (mintOrSymbol.length > 20) { // Is mint address
      price = await Promise.race([
        getReliablePrice(mintOrSymbol),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    }
    
    // Strategy 2: Birdeye (if needed and not rate limited)
    if (price === null) {
      await waitForRateLimit('birdeye');
      price = await Promise.race([
        getBirdeyePrice(mintOrSymbol),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
      ]);
    }
    
    // Strategy 3: CoinMarketCap fallback for symbols
    if (price === null && mintOrSymbol.length <= 10) {
      await waitForRateLimit('coinmarket');
      price = await Promise.race([
        getCoinMarketCapPrice(mintOrSymbol),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]);
    }
    
  } catch (error) {
    console.warn(`Price fetch timeout/error for ${mintOrSymbol}:`, error.message);
  }
  
  // Cache result (even if null) to prevent repeated failures
  const cacheTtl = price !== null ? 30000 : 10000; // Cache failures for shorter time
  priceCache.set(cacheKey, price, cacheTtl);
  
  const duration = Date.now() - startTime;
  console.log(`⚡ Price fetch for ${mintOrSymbol}: ${price ? '$' + price.toFixed(4) : 'NULL'} (${duration}ms)`);
  
  return price;
}

/**
 * Ultra-fast batch price fetching with parallel processing
 * @param {string[]} mintArray - Array of mint addresses or symbols
 * @returns {Promise<Map<string, number>>}
 */
async function getBatchTokenPrices(mintArray) {
  if (!mintArray || mintArray.length === 0) {
    return new Map();
  }
  
  const startTime = Date.now();
  const results = new Map();
  const toFetch = [];
  
  // Check cache for all tokens first
  for (const mint of mintArray) {
    const cached = priceCache.get(mint.toLowerCase());
    if (cached !== null) {
      results.set(mint, cached);
    } else {
      toFetch.push(mint);
    }
  }
  
  console.log(`🚀 Batch price fetch: ${results.size}/${mintArray.length} from cache, fetching ${toFetch.length}`);
  
  if (toFetch.length === 0) {
    console.log(`⚡ All prices from cache (${Date.now() - startTime}ms)`);
    return results;
  }
  
  // Batch fetch strategy
  const batchKey = toFetch.sort().join(',');
  const batchCached = batchCache.get(batchKey);
  if (batchCached) {
    console.log(`🎯 Entire batch from cache (${Date.now() - startTime}ms)`);
    batchCached.forEach((price, mint) => results.set(mint, price));
    return results;
  }
  
  // Separate mints and symbols for optimized fetching
  const mints = toFetch.filter(item => item.length > 20);
  const symbols = toFetch.filter(item => item.length <= 10);
  
  // Parallel fetch with timeout protection
  const fetchPromises = [];
  
  // Batch fetch mints via DexScreener (fastest)
  if (mints.length > 0) {
    fetchPromises.push(
      Promise.race([
        getMultipleReliablePrices(mints).then(priceMap => {
          priceMap.forEach((price, mint) => {
            results.set(mint, price);
            priceCache.set(mint.toLowerCase(), price);
          });
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DexScreener timeout')), 3000))
      ]).catch(err => console.warn('DexScreener batch failed:', err.message))
    );
  }
  
  // Individual symbol fetches (parallel but rate limited)
  for (const symbol of symbols) {
    fetchPromises.push(
      (async () => {
        await waitForRateLimit('coinmarket');
        try {
          const price = await Promise.race([
            getCoinMarketCapPrice(symbol),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
          ]);
          if (price !== null) {
            results.set(symbol, price);
            priceCache.set(symbol.toLowerCase(), price);
          }
        } catch (err) {
          console.warn(`Symbol ${symbol} fetch failed:`, err.message);
        }
      })()
    );
  }
  
  // Wait for all fetches with overall timeout
  try {
    await Promise.race([
      Promise.allSettled(fetchPromises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Overall timeout')), 5000))
    ]);
  } catch (err) {
    console.warn('Batch fetch timeout:', err.message);
  }
  
  // Cache the batch result
  if (results.size > 0) {
    batchCache.set(batchKey, results);
  }
  
  const duration = Date.now() - startTime;
  console.log(`⚡ Batch completed: ${results.size}/${mintArray.length} prices fetched (${duration}ms)`);
  
  return results;
}

/**
 * Calculate position value with ultra-fast price fetching
 * @param {Object} position - Position object with tokenInfo
 * @returns {Promise<{valueUSD: number|null, tokenXValueUSD: number|null, tokenYValueUSD: number|null}>}
 */
async function calculatePositionValueFast(position) {
  if (!position.tokenInfo) {
    return { valueUSD: null, tokenXValueUSD: null, tokenYValueUSD: null };
  }
  
  const { tokenX, tokenY } = position.tokenInfo;
  const mints = [tokenX.mint, tokenY.mint];
  
  console.log(`💨 Fast value calc for: ${tokenX.symbol}/${tokenY.symbol}`);
  
  const startTime = Date.now();
  const prices = await getBatchTokenPrices(mints);
  
  const priceX = prices.get(tokenX.mint);
  const priceY = prices.get(tokenY.mint);
  
  let tokenXValueUSD = null;
  let tokenYValueUSD = null;
  
  if (priceX !== undefined && priceX !== null) {
    // tokenX.userAmount is already in wei, convert to UI amount for price calculation
    tokenXValueUSD = (tokenX.userAmount / Math.pow(10, tokenX.decimals)) * priceX;
  }
  
  if (priceY !== undefined && priceY !== null) {
    // tokenY.userAmount is already in wei, convert to UI amount for price calculation  
    tokenYValueUSD = (tokenY.userAmount / Math.pow(10, tokenY.decimals)) * priceY;
  }
  
  const valueUSD = (tokenXValueUSD || 0) + (tokenYValueUSD || 0);
  const totalValueUSD = valueUSD > 0 ? valueUSD : null;
  
  const duration = Date.now() - startTime;
  console.log(`💰 Position value: $${totalValueUSD?.toFixed(2) || 'N/A'} (${duration}ms)`);
  
  return {
    valueUSD: totalValueUSD,
    tokenXValueUSD,
    tokenYValueUSD
  };
}

/**
 * Enrich multiple positions with prices (ultra-fast parallel processing)
 * @param {Array} lpPositions - Array of LP positions
 * @returns {Promise<Array>} Enriched positions with values
 */
async function enrichPositionsWithPricesFast(lpPositions) {
  if (!lpPositions || lpPositions.length === 0) {
    return [];
  }
  
  console.log(`🚀 Starting fast price enrichment for ${lpPositions.length} positions`);
  const startTime = Date.now();
  
  // Collect all unique mints for batch processing
  const allMints = new Set();
  lpPositions.forEach(position => {
    if (position.tokenInfo) {
      allMints.add(position.tokenInfo.tokenX.mint);
      allMints.add(position.tokenInfo.tokenY.mint);
    }
  });
  
  console.log(`📊 Pre-fetching prices for ${allMints.size} unique tokens`);
  
  // Pre-fetch all prices in one batch
  const priceMap = await getBatchTokenPrices(Array.from(allMints));
  
  // Process all positions in parallel
  const enrichPromises = lpPositions.map(async (position) => {
    try {
      const values = await calculatePositionValueFast(position);
      
      return {
        ...position,
        ...values,
        lastPriceUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error enriching position ${position.mint}:`, error.message);
      return {
        ...position,
        valueUSD: null,
        tokenXValueUSD: null,
        tokenYValueUSD: null,
        priceError: error.message,
        lastPriceUpdate: new Date().toISOString()
      };
    }
  });
  
  const enrichedPositions = await Promise.all(enrichPromises);
  
  const duration = Date.now() - startTime;
  const successful = enrichedPositions.filter(p => p.valueUSD !== null).length;
  
  console.log(`⚡ Fast enrichment completed: ${successful}/${lpPositions.length} positions with prices (${duration}ms)`);
  
  return enrichedPositions;
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  return {
    priceCache: priceCache.getStats(),
    batchCache: batchCache.getStats(),
    rateLimiter: {
      birdeye: {
        timeSinceLastCall: Date.now() - rateLimiter.birdeye.lastCall,
        canCallNow: Date.now() - rateLimiter.birdeye.lastCall >= rateLimiter.birdeye.minInterval
      },
      coinmarket: {
        timeSinceLastCall: Date.now() - rateLimiter.coinmarket.lastCall,
        canCallNow: Date.now() - rateLimiter.coinmarket.lastCall >= rateLimiter.coinmarket.minInterval
      }
    }
  };
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  priceCache.clear();
  batchCache.clear();
  console.log('🧹 All caches cleared');
}

module.exports = {
  getFastTokenPrice,
  getBatchTokenPrices,
  calculatePositionValueFast,
  enrichPositionsWithPricesFast,
  getCacheStats,
  clearAllCaches
};