const fetch = require('node-fetch');

// Fonte oficial da lista de pools Raydium (contém LP mints)
const RAYDIUM_POOLS_URL = 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';

// LP mints conhecidos do Raydium como fallback (principais pools)
const KNOWN_RAYDIUM_LP_MINTS = [
  '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2', // SOL/USDC
  'C9JcQhMB3LJVn6JJlbVP6w8aAV2R3eP2Z4FhJMpWJxZw', // RAY/SOL
  'DDpFKtYYCPBV5jMrbGD8GWLW8w7xgTqeNT3XQN3Vfgfh', // ETH/SOL
  'HSY6ZFNWA4qnBvdDJFkn5kEP1HaYnFjBVhV2nGLhhAqP', // mSOL/SOL
  '3vXKCZWoRaX3PV45JgZXrG2DPQCaRjqDk8Gm1i7hJrqY', // USDT/USDC
];

// Cache simples para evitar requests frequentes
let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Busca a lista de LP mint addresses do Raydium com fallback e cache
 * @returns {Promise<string[]>}
 */
async function fetchRaydiumLpMints() {
  const now = Date.now();
  
  // Usar cache se disponível e válido
  if (cachedData && (now - lastFetch) < CACHE_TTL) {
    return cachedData.lpMints;
  }
  
  try {
    console.log('Fetching Raydium pools from API...');
    const res = await fetch(RAYDIUM_POOLS_URL, { 
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    if (!data.pools || !Array.isArray(data.pools)) {
      throw new Error('Invalid response format');
    }
    
    const lpMints = data.pools
      .filter(pool => pool && pool.lpMint) // Filtrar pools válidos
      .map(pool => pool.lpMint);
    
    // Atualizar cache
    cachedData = { pools: data.pools, lpMints };
    lastFetch = now;
    
    console.log(`Successfully fetched ${lpMints.length} Raydium LP mints`);
    return lpMints;
    
  } catch (error) {
    console.warn('Raydium API error, using fallback:', error.message);
    return KNOWN_RAYDIUM_LP_MINTS;
  }
}

/**
 * Busca todos os pools Raydium com dados completos
 * @returns {Promise<Array>}
 */
async function fetchRaydiumPools() {
  const now = Date.now();
  
  // Usar cache se disponível e válido
  if (cachedData && (now - lastFetch) < CACHE_TTL) {
    return cachedData.pools;
  }
  
  try {
    console.log('Fetching Raydium pools data from API...');
    const res = await fetch(RAYDIUM_POOLS_URL, { 
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    if (!data.pools || !Array.isArray(data.pools)) {
      throw new Error('Invalid response format');
    }
    
    // Atualizar cache
    cachedData = { pools: data.pools, lpMints: data.pools.map(p => p.lpMint) };
    lastFetch = now;
    
    console.log(`Successfully fetched ${data.pools.length} Raydium pools`);
    return data.pools;
    
  } catch (error) {
    console.warn('Raydium pools API error, using fallback:', error.message);
    return KNOWN_RAYDIUM_LP_MINTS.map(mint => ({
      lpMint: mint,
      name: `Raydium Pool ${mint.slice(0, 8)}`,
      tokenAMint: 'So11111111111111111111111111111111111111112', // SOL
      tokenBMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    }));
  }
}

module.exports = { fetchRaydiumLpMints, fetchRaydiumPools }; 