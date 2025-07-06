require('dotenv').config();
const fetch = require('node-fetch');

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const BASE_URL = 'https://public-api.birdeye.so/defi';

// Mapa de símbolos para endereços de mint
const SYMBOL_TO_MINT = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'mSOL': 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  'ETH': '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
};

/**
 * Busca o preço de um token pelo símbolo ou mint address
 * @param {string} symbolOrMint - Ex: 'SOL', 'USDC' ou endereço da mint
 * @returns {Promise<number|null>} Preço do token ou null se não encontrado
 */
async function getBirdeyePrice(symbolOrMint) {
  try {
    // Determinar se é símbolo ou mint address
    let mint = symbolOrMint;
    if (SYMBOL_TO_MINT[symbolOrMint.toUpperCase()]) {
      mint = SYMBOL_TO_MINT[symbolOrMint.toUpperCase()];
    }

    // Se não temos API key, usar método alternativo
    if (!BIRDEYE_API_KEY) {
      return await getBirdeyePricePublic(mint);
    }

    const url = `${BASE_URL}/price?address=${mint}`;
    const res = await fetch(url, {
      headers: { 
        'X-API-KEY': BIRDEYE_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn('Birdeye rate limit reached, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      throw new Error(`Birdeye API error: ${res.status}`);
    }

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

/**
 * Busca preço usando endpoint público (sem API key)
 */
async function getBirdeyePricePublic(mint) {
  try {
    // Usar CoinGecko como alternativa para tokens principais
    if (mint === 'So11111111111111111111111111111111111111112') {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
        timeout: 5000
      });
      if (response.ok) {
        const data = await response.json();
        return data.solana?.usd || null;
      }
    }

    if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      return 1.0; // USDC sempre ~$1
    }

    if (mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
      return 1.0; // USDT sempre ~$1
    }

    // Para outros tokens, retornar null (será tratado pelo fallback)
    return null;
  } catch (error) {
    console.error('Public price fetch error:', error.message);
    return null;
  }
}

/**
 * Busca preços de múltiplos tokens
 * @param {string[]} symbolsOrMints - Array de símbolos ou mint addresses
 * @returns {Promise<Map<string, number>>} Map de symbol/mint para preço
 */
async function getMultipleBirdeyePrices(symbolsOrMints) {
  const results = new Map();
  
  // Processar sequencialmente para evitar rate limiting
  for (let i = 0; i < symbolsOrMints.length; i++) {
    const symbolOrMint = symbolsOrMints[i];
    
    try {
      const price = await getBirdeyePrice(symbolOrMint);
      if (price !== null) {
        results.set(symbolOrMint, price);
      }
    } catch (error) {
      console.warn(`Failed to get price for ${symbolOrMint}: ${error.message}`);
    }
    
    // Aguardar entre cada chamada para evitar rate limiting (reduzido)
    if (i < symbolsOrMints.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

module.exports = { 
  getBirdeyePrice, 
  getMultipleBirdeyePrices 
}; 