const fetch = require('node-fetch');

// Cache em memória para tokens conhecidos
const tokenCache = new Map();

// Lista oficial de tokens Solana (subset dos mais importantes)
const KNOWN_TOKENS = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL', decimals: 9 },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH', name: 'Ethereum (Wormhole)', decimals: 8 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', decimals: 5 },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'JitoSOL', name: 'Jito Staked SOL', decimals: 9 },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', name: 'BlazeStake Staked SOL', decimals: 9 },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3npM8RyJBAATW7': { symbol: 'PYTH', name: 'Pyth Network', decimals: 6 },
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux': { symbol: 'HNT', name: 'Helium', decimals: 8 },
  // Tokens específicos das posições do usuário (baseado na Meteora)
  '1zJX5gRnjLgmTpq5sVwkq69mNDQkCemqoasyjaPW6jm': { symbol: 'KLED', name: 'KLED', decimals: 9 },
  '8NNXWrWVctNw1UFeaBypffimTdcLCcD8XJzHvYsmgwpF': { symbol: 'GOR', name: 'GOR', decimals: 9 },
  'DtR4D9FtVoTX2569gaL837ZgrB6wNjj6tkmnX9Rdk9B2': { symbol: 'aura', name: 'aura', decimals: 6 }
};

// URLs das APIs de token metadata
const TOKEN_LIST_URLS = [
  'https://token.jup.ag/strict', // Jupiter token list (mais atualizada)
  'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json' // Oficial Solana
];

/**
 * Busca informações de um token pela mint address
 * @param {string} mint - Endereço da mint do token
 * @returns {Promise<{symbol: string, name: string, decimals: number} | null>}
 */
async function getTokenInfo(mint) {
  // Verificar cache primeiro
  if (tokenCache.has(mint)) {
    return tokenCache.get(mint);
  }

  // Verificar tokens conhecidos
  if (KNOWN_TOKENS[mint]) {
    const tokenInfo = KNOWN_TOKENS[mint];
    tokenCache.set(mint, tokenInfo);
    return tokenInfo;
  }

  // Buscar em APIs externas
  try {
    // Tentar Jupiter API primeiro (mais rápida)
    const jupiterInfo = await fetchFromJupiter(mint);
    if (jupiterInfo) {
      tokenCache.set(mint, jupiterInfo);
      return jupiterInfo;
    }

    // Fallback para Solana Token List
    const solanaInfo = await fetchFromSolanaTokenList(mint);
    if (solanaInfo) {
      tokenCache.set(mint, solanaInfo);
      return solanaInfo;
    }

    // Se não encontrou, criar entrada genérica
    const fallbackInfo = {
      symbol: mint.slice(0, 6).toUpperCase(),
      name: `Token ${mint.slice(0, 8)}`,
      decimals: 9
    };
    
    tokenCache.set(mint, fallbackInfo);
    return fallbackInfo;

  } catch (error) {
    console.error(`Error fetching token info for ${mint}:`, error.message);
    
    // Retorna informação básica em caso de erro
    const errorInfo = {
      symbol: mint.slice(0, 6).toUpperCase(),
      name: `Token ${mint.slice(0, 8)}`,
      decimals: 9
    };
    
    tokenCache.set(mint, errorInfo);
    return errorInfo;
  }
}

/**
 * Busca token info na API do Jupiter
 */
async function fetchFromJupiter(mint) {
  try {
    const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${mint}&outputMint=So11111111111111111111111111111111111111112&amount=1000000`, {
      timeout: 5000
    });
    
    if (response.ok) {
      // Se a API do Jupiter responde, o token existe
      // Buscar na token list do Jupiter
      const tokenListResponse = await fetch('https://token.jup.ag/strict', { timeout: 5000 });
      if (tokenListResponse.ok) {
        const tokenList = await tokenListResponse.json();
        const token = tokenList.find(t => t.address === mint);
        if (token) {
          return {
            symbol: token.symbol || mint.slice(0, 6).toUpperCase(),
            name: token.name || `Token ${mint.slice(0, 8)}`,
            decimals: token.decimals || 9
          };
        }
      }
    }
  } catch (error) {
    // Ignorar erro e tentar próximo método
  }
  return null;
}

/**
 * Busca token info na Solana Token List oficial
 */
async function fetchFromSolanaTokenList(mint) {
  try {
    const response = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json', {
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      const token = data.tokens.find(t => t.address === mint);
      if (token) {
        return {
          symbol: token.symbol || mint.slice(0, 6).toUpperCase(),
          name: token.name || `Token ${mint.slice(0, 8)}`,
          decimals: token.decimals || 9
        };
      }
    }
  } catch (error) {
    // Ignorar erro
  }
  return null;
}

/**
 * Busca informações de múltiplos tokens em batch
 * @param {string[]} mints - Array de mint addresses
 * @returns {Promise<Map<string, {symbol: string, name: string, decimals: number}>>}
 */
async function getMultipleTokenInfo(mints) {
  const results = new Map();
  
  // Processar em paralelo com limite de concorrência
  const batchSize = 5;
  for (let i = 0; i < mints.length; i += batchSize) {
    const batch = mints.slice(i, i + batchSize);
    const promises = batch.map(async (mint) => {
      const info = await getTokenInfo(mint);
      return [mint, info];
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(([mint, info]) => {
      if (info) results.set(mint, info);
    });
  }
  
  return results;
}

/**
 * Limpa o cache de tokens (útil para testes)
 */
function clearCache() {
  tokenCache.clear();
}

/**
 * Obtém estatísticas do cache
 */
function getCacheStats() {
  return {
    size: tokenCache.size,
    tokens: Array.from(tokenCache.keys()).slice(0, 10) // Primeiros 10 para debug
  };
}

module.exports = {
  getTokenInfo,
  getMultipleTokenInfo,
  clearCache,
  getCacheStats
};