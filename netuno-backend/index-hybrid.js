require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { getTokenPrice, enrichPositionsWithPrices } = require('./priceService');
const { enrichPositionsWithPricesFast, getCacheStats, clearAllCaches } = require('./highPerformancePriceService');
const { enrichPositionsWithMetrics } = require('./defiMetricsService');
const { enrichPositionsWithUserMetrics, calculatePortfolioSummary, clearAllMetricsCache, getMetricsCacheStats } = require('./userPositionMetricsService');
const { identifyLpTokens, getLpPoolDataByMint } = require('./lpTokenIdentifier');
const { rpcManager } = require('./rpcManager');
const { getTokenInfo, getMultipleTokenInfo } = require('./tokenRegistry');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Additional CORS headers for security software compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Rate limiting simplificado para desenvolvimento
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Cache em memória das posições LP ativas por usuário
const activePositionsCache = {};

function nowISO() {
  return new Date().toISOString();
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'NETUNO Backend - Complete Version',
    timestamp: new Date().toISOString(),
    version: '2.1',
    features: ['Multi-protocol LP detection', 'Real-time data', 'Price integration']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint para buscar contas de token de uma carteira Solana
app.get('/token-accounts', async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=43f8597b-7300-4273-beb2-93e0e6bd1c8b',
      { commitment: 'confirmed' }
    );
    const publicKey = new PublicKey(address);
    const response = await connection.getParsedTokenAccountsByOwner(publicKey, { 
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') 
    });
    const accounts = response.value.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      mint: account.data.parsed.info.mint,
      amount: account.data.parsed.info.tokenAmount.uiAmountString,
      decimals: account.data.parsed.info.tokenAmount.decimals,
      owner: account.data.parsed.info.owner,
      isNative: account.data.parsed.info.isNative,
    }));
    res.json({ accounts });
  } catch (err) {
    console.error('Token accounts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para buscar preço de token
app.get('/price', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol query parameter.' });
  try {
    const price = await getTokenPrice(symbol);
    if (price == null) return res.status(404).json({ error: 'Price not found.' });
    res.json({ symbol, price });
  } catch (err) {
    console.error('Price error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint principal para buscar posições LP do usuário
app.get('/lp-positions', async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  
  try {
    console.log(`🔍 Fetching LP positions for address: ${address}`);
    
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=43f8597b-7300-4273-beb2-93e0e6bd1c8b',
      { commitment: 'confirmed' }
    );
    const publicKey = new PublicKey(address);
    
    // Buscar token accounts
    const response = await connection.getParsedTokenAccountsByOwner(publicKey, { 
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') 
    });
    
    const accounts = response.value.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      mint: account.data.parsed.info.mint,
      amount: account.data.parsed.info.tokenAmount.uiAmountString,
      decimals: account.data.parsed.info.tokenAmount.decimals,
      owner: account.data.parsed.info.owner,
      isNative: account.data.parsed.info.isNative,
    }));

    console.log(`📊 Found ${accounts.length} token accounts`);

    // Identificar LP tokens usando nosso sistema multi-protocolo
    const lpTokens = await identifyLpTokens(accounts, address, connection);
    console.log(`🎯 Identified ${lpTokens.length} LP positions`);

    // Coletar todos os token mints únicos para buscar informações
    const allTokenMints = new Set();
    lpTokens.forEach(({ positionData }) => {
      if (positionData) {
        allTokenMints.add(positionData.mintX);
        allTokenMints.add(positionData.mintY);
      }
    });

    // Buscar informações de todos os tokens em batch
    console.log(`🔍 Fetching token info for ${allTokenMints.size} unique tokens`);
    const tokenInfoMap = await getMultipleTokenInfo(Array.from(allTokenMints));

    // Para cada token LP, buscar dados do pool e enriquecer com token info
    const lpPositions = await Promise.all(lpTokens.map(async ({ mint, protocol, positionData, amount, decimals }) => {
      try {
        const pool = await getLpPoolDataByMint(mint, protocol);
        const userAccount = accounts.find(acc => acc.mint === mint);
        
        // Para Meteora, calcular a posição real do usuário baseada no token balance atual
        if (protocol === 'Meteora' && positionData) {
          // CORREÇÃO CRÍTICA: Usar o saldo atual de LP tokens do usuário, não dados cached
          const userLpBalance = userAccount ? parseFloat(userAccount.amount) : 0;
          const userLpBalanceWei = userLpBalance; // Valor já está em formato UI, não converter
          
          // Buscar saldos atuais dos tokens individuais na carteira do usuário
          const tokenXAccount = accounts.find(acc => acc.mint === positionData.mintX);
          const tokenYAccount = accounts.find(acc => acc.mint === positionData.mintY);
          
          // For DLMM positions, get actual token balances from user's wallet
          // accounts.amount is already in UI format (divided by decimals)
          const userXAmountUI = tokenXAccount ? parseFloat(tokenXAccount.amount) : 0;
          const userYAmountUI = tokenYAccount ? parseFloat(tokenYAccount.amount) : 0;
          
          // Convert to wei for internal calculations (userAmount field expects wei values)
          const tokenXDecimals = tokenXAccount ? tokenXAccount.decimals : (tokenInfoMap.get(positionData.mintX)?.decimals || 9);
          const tokenYDecimals = tokenYAccount ? tokenYAccount.decimals : (tokenInfoMap.get(positionData.mintY)?.decimals || 9);
          
          const userXAmount = userXAmountUI * Math.pow(10, tokenXDecimals);
          const userYAmount = userYAmountUI * Math.pow(10, tokenYDecimals);
          
          // Buscar informações dos tokens
          const tokenX = tokenInfoMap.get(positionData.mintX) || { 
            symbol: positionData.mintX.slice(0, 6), 
            name: `Token ${positionData.mintX.slice(0, 8)}`,
            decimals: tokenXDecimals 
          };
          const tokenY = tokenInfoMap.get(positionData.mintY) || { 
            symbol: positionData.mintY.slice(0, 6), 
            name: `Token ${positionData.mintY.slice(0, 8)}`,
            decimals: tokenYDecimals 
          };

          // Para DLMM, usar valores UI para cálculos de preço
          // tokenInfo.userAmount será usado pelo priceService que espera valores em wei
          const userShareX = userXAmount; // Em wei para tokenInfo
          const userShareY = userYAmount; // Em wei para tokenInfo
          
          // Para reservas do pool, vamos buscar dados do pool ou usar aproximação
          const poolReserveX = userXAmount * 100; // Aproximação - normalmente seria pool.reserveX
          const poolReserveY = userYAmount * 100; // Aproximação - normalmente seria pool.reserveY

          return {
            mint,
            protocol,
            amount: (userXAmount + userYAmount).toFixed(6),
            decimals: 9,
            pool: {
              name: `${tokenX.symbol}/${tokenY.symbol} DLMM`,
              address: positionData.poolAddress,
              lp_mint: positionData.positionAddress,
              token_a_mint: positionData.mintX,
              token_b_mint: positionData.mintY,
              reserve_a: poolReserveX.toString(),
              reserve_b: poolReserveY.toString(),
              bin_step: positionData.binStep
            },
            positionData,
            tokenInfo: {
              tokenX: {
                ...tokenX,
                mint: positionData.mintX,
                userAmount: userShareX, // Em wei - será convertido no price service
                reserveAmount: poolReserveX
              },
              tokenY: {
                ...tokenY,
                mint: positionData.mintY,
                userAmount: userShareY, // Em wei - será convertido no price service
                reserveAmount: poolReserveY
              }
            },
            valueUSD: null // Será calculado depois com preços
          };
        }
        
        // Para outros protocolos (Raydium, Orca)
        return {
          mint,
          protocol,
          amount: userAccount ? userAccount.amount : (amount || '0'),
          decimals: userAccount ? userAccount.decimals : (decimals || 9),
          pool: pool || {
            name: `${protocol} Pool`,
            lp_mint: mint,
            token_a_mint: 'So11111111111111111111111111111111111111112', // SOL
            token_b_mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // USDC
          },
          tokenInfo: null // Para implementar depois
        };
      } catch (error) {
        console.error(`Error processing LP position ${mint}:`, error.message);
        return {
          mint,
          protocol,
          amount: '0',
          decimals: 9,
          pool: { name: 'Error loading pool', lp_mint: mint },
          error: error.message
        };
      }
    }));

    // Enriquecer posições com preços usando o serviço de alta performance
    console.log(`🚀 Fast enriching ${lpPositions.length} positions with price data...`);
    const priceEnrichedPositions = await enrichPositionsWithPricesFast(lpPositions);
    
    // Enriquecer com métricas específicas do usuário (novo sistema otimizado)
    console.log(`🎯 Adding optimized user-specific metrics...`);
    const enrichedPositions = await enrichPositionsWithUserMetrics(priceEnrichedPositions, address);

    // Cache das posições (sem SQLite por enquanto)
    const now = nowISO();
    activePositionsCache[address] = enrichedPositions.map(p => ({
      ...p,
      openDate: now
    }));

    // Calcular resumo otimizado do portfolio
    const portfolioSummary = calculatePortfolioSummary(enrichedPositions);
    const totalValueUSD = enrichedPositions.reduce((sum, pos) => sum + (pos.valueUSD || 0), 0);

    console.log(`✅ Returning ${enrichedPositions.length} LP positions for ${address}`);
    console.log(`💰 Portfolio Summary: Deposited=$${portfolioSummary.totalDeposited}, Current=$${totalValueUSD.toFixed(2)}, P&L=$${portfolioSummary.totalPnL}`);

    res.json({ 
      lpPositions: enrichedPositions,
      summary: {
        // Métricas básicas
        totalPositions: enrichedPositions.length,
        protocols: [...new Set(enrichedPositions.map(p => p.protocol))],
        totalAccounts: accounts.length,
        totalValueUSD: totalValueUSD,
        positionsWithPrices: enrichedPositions.filter(p => p.valueUSD !== null).length,
        
        // Métricas avançadas do usuário
        portfolio: portfolioSummary
      }
    });
    
  } catch (err) {
    console.error('LP positions error:', err.message);
    res.status(500).json({ 
      error: err.message,
      lpPositions: [],
      summary: { totalPositions: 0, protocols: [], totalAccounts: 0 }
    });
  }
});

// Endpoint para histórico (simplificado por enquanto)
app.get('/lp-history', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'Missing address query parameter.' });
  
  // Por enquanto retorna vazio (sem SQLite)
  res.json({ 
    history: [],
    message: 'Historical data will be available after SQLite integration'
  });
});

// Endpoint de teste rápido para token info
app.get('/test-tokens', async (req, res) => {
  const { getMultipleTokenInfo } = require('./tokenRegistry');
  
  const testMints = [
    '1zJX5gRnjLgmTpq5sVwkq69mNDQkCemqoasyjaPW6jm',
    '8NNXWrWVctNw1UFeaBypffimTdcLCcD8XJzHvYsmgwpF',
    'DtR4D9FtVoTX2569gaL837ZgrB6wNjj6tkmnX9Rdk9B2',
    'So11111111111111111111111111111111111111112'
  ];
  
  try {
    const tokenInfoMap = await getMultipleTokenInfo(testMints);
    const results = {};
    
    testMints.forEach(mint => {
      const info = tokenInfoMap.get(mint);
      results[mint.slice(0,8)] = info ? info.symbol : 'NOT_FOUND';
    });
    
    res.json({ 
      status: 'success',
      tokens: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cache management endpoints
app.get('/cache-stats', (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      status: 'success',
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clear-cache', (req, res) => {
  try {
    clearAllCaches();
    clearAllMetricsCache();
    res.json({
      status: 'success',
      message: 'All caches cleared (price + metrics)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Metrics cache management
app.get('/metrics-cache-stats', (req, res) => {
  try {
    const stats = getMetricsCacheStats();
    res.json({
      status: 'success',
      metricsCache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clear-metrics-cache', (req, res) => {
  try {
    clearAllMetricsCache();
    res.json({
      status: 'success',
      message: 'Metrics cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 NETUNO Complete Backend running on port ${PORT}`);
  console.log(`🌐 CORS enabled for localhost:3000`);
  console.log(`🎯 Multi-protocol LP detection: Raydium, Orca, Meteora`);
  console.log(`💰 Price service integration ready`);
  console.log(`🔗 Accessible at: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});