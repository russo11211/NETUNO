const fetch = require('node-fetch');

// Cache inteligente com TTL
const tokenCache = new Map();
const cacheTimestamps = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas para tokens conhecidos
const NEW_TOKEN_TTL = 60 * 60 * 1000; // 1 hora para tokens novos

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
  // Tokens específicos das posições do usuário (serão descobertos automaticamente)
  '1zJX5gRnjLgmTpq5sVwkq69mNDQkCemqoasyjaPW6jm': { symbol: 'KLED', name: 'KLED', decimals: 9 },
  'DtR4D9FtVoTX2569gaL837ZgrB6wNjj6tkmnX9Rdk9B2': { symbol: 'aura', name: 'aura', decimals: 6 },
  '71Jvq4Epe2FCJ7JFSF7jLXdNk1Wy4Bhqd9iL6bEFELvg': { symbol: 'Goat', name: 'Goat', decimals: 6 }
};

// APIs de token metadata em ordem de prioridade (velocidade + confiabilidade)
const TOKEN_APIS = {
  jupiter: {
    listUrl: 'https://token.jup.ag/strict',
    timeout: 3000,
    priority: 1
  },
  solscan: {
    baseUrl: 'https://public-api.solscan.io/token/meta?tokenAddress=',
    timeout: 5000,
    priority: 2
  },
  helius: {
    baseUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=43f8597b-7300-4273-beb2-93e0e6bd1c8b',
    timeout: 8000,
    priority: 3
  }
};

/**
 * Verifica se cache está válido (TTL)
 */
function isCacheValid(mint) {
  if (!tokenCache.has(mint) || !cacheTimestamps.has(mint)) return false;
  
  const timestamp = cacheTimestamps.get(mint);
  const now = Date.now();
  const isKnownToken = KNOWN_TOKENS[mint];
  const ttl = isKnownToken ? CACHE_TTL : NEW_TOKEN_TTL;
  
  return (now - timestamp) < ttl;
}

/**
 * Adiciona token ao cache com timestamp
 */
function addToCache(mint, tokenInfo, isKnownToken = false) {
  tokenCache.set(mint, tokenInfo);
  cacheTimestamps.set(mint, Date.now());
  
  // Log para debug
  console.log(`🔄 Token cached: ${tokenInfo.symbol} (${mint.slice(0, 8)}...) - Known: ${isKnownToken}`);
}

/**
 * Busca informações de um token pela mint address com sistema de cache inteligente
 * @param {string} mint - Endereço da mint do token
 * @returns {Promise<{symbol: string, name: string, decimals: number} | null>}
 */
async function getTokenInfo(mint) {
  console.log(`🔍 Looking up token: ${mint.slice(0, 12)}...`);
  
  // 1. Verificar cache com TTL
  if (isCacheValid(mint)) {
    console.log(`💾 Cache hit: ${mint.slice(0, 8)}...`);
    return tokenCache.get(mint);
  }

  // 2. Verificar tokens hardcoded (sempre válidos)
  if (KNOWN_TOKENS[mint]) {
    const tokenInfo = KNOWN_TOKENS[mint];
    addToCache(mint, tokenInfo, true);
    return tokenInfo;
  }

  // 3. Buscar em cascata: Jupiter → Solscan → Helius
  console.log(`🌐 Fetching from external APIs: ${mint.slice(0, 8)}...`);
  
  try {
    // Tentar APIs em ordem de prioridade
    const results = await Promise.allSettled([
      fetchFromJupiter(mint),
      fetchFromSolscan(mint),
      fetchFromHelius(mint)
    ]);

    // Processar resultados em ordem de prioridade
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const tokenInfo = result.value;
        addToCache(mint, tokenInfo, false);
        console.log(`✅ Token found: ${tokenInfo.symbol} - ${tokenInfo.name}`);
        return tokenInfo;
      }
    }

    // 4. Fallback: Informação genérica
    console.log(`⚠️  No metadata found, using fallback for: ${mint.slice(0, 8)}...`);
    const fallbackInfo = {
      symbol: `TOKEN${mint.slice(0, 4).toUpperCase()}`,
      name: `Unknown Token (${mint.slice(0, 8)}...)`,
      decimals: 9,
      source: 'fallback'
    };
    
    addToCache(mint, fallbackInfo, false);
    return fallbackInfo;

  } catch (error) {
    console.error(`❌ Error fetching token info for ${mint}:`, error.message);
    
    // Retorna informação básica em caso de erro
    const errorInfo = {
      symbol: `ERR${mint.slice(0, 3).toUpperCase()}`,
      name: `Error Token (${mint.slice(0, 8)}...)`,
      decimals: 9,
      source: 'error'
    };
    
    addToCache(mint, errorInfo, false);
    return errorInfo;
  }
}

/**
 * Busca token info na API do Jupiter (Tier 1 - Mais rápida)
 */
async function fetchFromJupiter(mint) {
  try {
    console.log(`🟡 Trying Jupiter API for ${mint.slice(0, 8)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TOKEN_APIS.jupiter.timeout);
    
    const response = await fetch(TOKEN_APIS.jupiter.listUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const tokenList = await response.json();
      const token = tokenList.find(t => t.address === mint);
      
      if (token) {
        return {
          symbol: token.symbol || mint.slice(0, 6).toUpperCase(),
          name: token.name || `Jupiter Token`,
          decimals: token.decimals || 9,
          source: 'jupiter',
          verified: true
        };
      }
    }
  } catch (error) {
    console.log(`❌ Jupiter API failed: ${error.message}`);
  }
  return null;
}

/**
 * Busca token info na API do Solscan (Tier 2 - Maior cobertura)
 */
async function fetchFromSolscan(mint) {
  try {
    console.log(`🔵 Trying Solscan API for ${mint.slice(0, 8)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TOKEN_APIS.solscan.timeout);
    
    const response = await fetch(`${TOKEN_APIS.solscan.baseUrl}${mint}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NETUNO-DeFi-App/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.symbol) {
        return {
          symbol: data.symbol || mint.slice(0, 6).toUpperCase(),
          name: data.name || data.symbol || 'Solscan Token',
          decimals: data.decimals || 9,
          source: 'solscan'
        };
      }
    }
  } catch (error) {
    console.log(`❌ Solscan API failed: ${error.message}`);
  }
  return null;
}

/**
 * Busca token info via Helius DAS API (Tier 3 - Backup total)
 */
async function fetchFromHelius(mint) {
  try {
    console.log(`🟢 Trying Helius DAS API for ${mint.slice(0, 8)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TOKEN_APIS.helius.timeout);
    
    const response = await fetch(TOKEN_APIS.helius.baseUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'netuno-token-lookup',
        method: 'getAsset',
        params: {
          id: mint
        }
      })
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.result && data.result.content && data.result.content.metadata) {
        const metadata = data.result.content.metadata;
        return {
          symbol: metadata.symbol || mint.slice(0, 6).toUpperCase(),
          name: metadata.name || 'Helius Token',
          decimals: data.result.token_info?.decimals || 9,
          source: 'helius'
        };
      }
    }
  } catch (error) {
    console.log(`❌ Helius API failed: ${error.message}`);
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