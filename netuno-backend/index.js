require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { getTokenPrice } = require('./priceService');
const { calculateCurrentValue, calculateUserShare, calculateEstimatedWithdrawal, calculateCollectedFees } = require('./lpMetrics');
const { identifyLpTokens, getLpPoolDataByMint } = require('./lpTokenIdentifier');
const { rpcManager } = require('./rpcManager');
const { meteoraCache } = require('./meteoraPositionCache');
const { monitoring, requestTracker } = require('./monitoring');
const fs = require('fs').promises;
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Rate limiting para API pública
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requests por IP por janela
  message: {
    error: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString(),
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting mais restritivo para endpoints computacionalmente caros
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: {
    error: 'Rate limit exceeded for this endpoint.',
    timestamp: new Date().toISOString(),
    retryAfter: '1 minute'
  }
});

// Slow down para requests frequentes
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // Permitir 50 requests por janela sem delay
  delayMs: () => 500, // Função que retorna delay de 500ms
  validate: { delayMs: false } // Desabilitar warning
});

// Aplicar rate limiting e monitoring
app.use('/api/', apiLimiter);
app.use(speedLimiter);
app.use(requestTracker());

// Middleware de autenticação básica para endpoints administrativos
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY || 'netuno-admin-2025';
  
  if (!adminKey || adminKey !== expectedKey) {
    return res.status(401).json({ 
      error: 'Unauthorized: Admin key required',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

const SNAPSHOT_FILE = path.join(__dirname, 'lp_snapshots.json');
const DB_PATH = path.join(__dirname, 'positions.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS lp_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  mint TEXT NOT NULL,
  protocol TEXT NOT NULL,
  openDate TEXT NOT NULL,
  closeDate TEXT NOT NULL,
  initialValue REAL,
  finalValue REAL,
  totalFees REAL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// Salva um snapshot de posição LP no banco
async function saveLpSnapshot(snapshot) {
  const stmt = db.prepare(`INSERT INTO lp_snapshots (address, mint, protocol, openDate, closeDate, initialValue, finalValue, totalFees) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(
    snapshot.address,
    snapshot.mint,
    snapshot.protocol,
    snapshot.openDate,
    snapshot.closeDate,
    snapshot.initialValue,
    snapshot.finalValue,
    snapshot.totalFees
  );
}

// Busca snapshots históricos de um usuário no banco
async function getLpHistory(address) {
  const stmt = db.prepare(`SELECT * FROM lp_snapshots WHERE address = ? ORDER BY closeDate DESC, createdAt DESC`);
  return stmt.all(address);
}

// Cache em memória das posições LP ativas por usuário
const activePositionsCache = {};

// Função utilitária para obter timestamp ISO atual
function nowISO() {
  return new Date().toISOString();
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'Netuno Backend API is running.',
    timestamp: new Date().toISOString(),
    rpcStatus: 'Using robust RPC manager with multiple fallbacks',
    version: '1.0.0',
    security: 'Rate limiting and authentication enabled'
  });
});

// Endpoint de saúde do sistema
app.get('/health', (req, res) => {
  const health = monitoring.getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 206 : 503;
  res.status(statusCode).json(health);
});

// Endpoint para métricas (protegido)
app.get('/metrics', authenticateAdmin, (req, res) => {
  const health = monitoring.getHealthStatus();
  res.json({
    ...health,
    detailedMetrics: {
      logs: monitoring.logs.slice(-100), // Últimos 100 logs
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      }
    }
  });
});

// Endpoint para monitorar saúde dos RPCs
app.get('/rpc-status', (req, res) => {
  try {
    const stats = rpcManager.getStats();
    res.json({
      timestamp: new Date().toISOString(),
      rpcStats: stats,
      totalEndpoints: Object.keys(stats).length,
      healthyEndpoints: Object.values(stats).filter(stat => stat.isHealthy).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para adicionar novo RPC (protegido)
app.post('/rpc-endpoints', authenticateAdmin, (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint in request body' });
    }
    
    rpcManager.addRpcEndpoint(endpoint);
    res.json({ 
      success: true, 
      message: `RPC endpoint ${endpoint} added successfully`,
      currentEndpoints: rpcManager.rpcEndpoints.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para monitorar cache de posições
app.get('/cache-status', (req, res) => {
  try {
    const stats = meteoraCache.getStats();
    res.json({
      timestamp: new Date().toISOString(),
      cacheStats: stats,
      rpcStats: rpcManager.getStats()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para limpar cache (protegido)
app.post('/cache/clean', authenticateAdmin, (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    const cleaned = meteoraCache.cleanExpiredCache(maxAgeHours);
    res.json({
      success: true,
      message: `Cache cleaned successfully`,
      entriesRemoved: cleaned,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para buscar contas de token de uma carteira Solana
app.get('/token-accounts', async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'));
    const publicKey = new PublicKey(address);
    const response = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
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
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para buscar preço de token (ex: /price?symbol=SOL)
app.get('/price', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol query parameter.' });
  try {
    const price = await getTokenPrice(symbol);
    if (price == null) return res.status(404).json({ error: 'Price not found.' });
    res.json({ symbol, price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para calcular métricas LP
app.post('/lp-metrics', (req, res) => {
  const { userLpTokens, totalLpTokens, poolValueUSD } = req.body;
  if (userLpTokens == null || totalLpTokens == null || poolValueUSD == null) {
    return res.status(400).json({ error: 'Missing required fields: userLpTokens, totalLpTokens, poolValueUSD' });
  }
  const currentValue = calculateCurrentValue(userLpTokens, totalLpTokens, poolValueUSD);
  const userShare = calculateUserShare(userLpTokens, totalLpTokens);
  const estimatedWithdrawal = calculateEstimatedWithdrawal(userLpTokens, totalLpTokens, poolValueUSD);
  const collectedFees = calculateCollectedFees(); // Placeholder
  res.json({ currentValue, userShare, estimatedWithdrawal, collectedFees });
});

// Função para calcular valor estimado de uma posição LP em USD
async function estimateLpValueUSD(position) {
  const { amount, pool } = position;
  if (!amount || !pool) return null;
  const tokenA = pool?.baseMint || pool?.token_a_mint || pool?.token_a || '';
  const tokenB = pool?.quoteMint || pool?.token_b_mint || pool?.token_b || '';
  const reserveA = pool?.baseReserve || pool?.reserve_a || pool?.reserve0 || 0;
  const reserveB = pool?.quoteReserve || pool?.reserve_b || pool?.reserve1 || 0;
  const totalLp = pool?.lpSupply || pool?.lp_total_supply || pool?.lp_supply || 0;
  if (!tokenA || !tokenB || !reserveA || !reserveB || !totalLp) return null;
  try {
    const [resA, resB] = await Promise.all([
      fetch(`${process.env.PRICE_API_URL || ''}/price?symbol=${tokenA}`).then(r => r.json()),
      fetch(`${process.env.PRICE_API_URL || ''}/price?symbol=${tokenB}`).then(r => r.json()),
    ]);
    const priceA = resA.price || 0;
    const priceB = resB.price || 0;
    const userLp = parseFloat(amount);
    const totalLpNum = parseFloat(totalLp);
    const reserveANum = parseFloat(reserveA);
    const reserveBNum = parseFloat(reserveB);
    if (!userLp || !totalLpNum || (!reserveANum && !reserveBNum)) return null;
    const poolValueUSD = (reserveANum * priceA) + (reserveBNum * priceB);
    const userValueUSD = (userLp / totalLpNum) * poolValueUSD;
    return userValueUSD;
  } catch {
    return null;
  }
}

// Endpoint para buscar posições LP do usuário (com detecção de fechamento)
app.get('/lp-positions', strictLimiter, async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'));
    const publicKey = new PublicKey(address);
    const response = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
    const accounts = response.value.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      mint: account.data.parsed.info.mint,
      amount: account.data.parsed.info.tokenAmount.uiAmountString,
      decimals: account.data.parsed.info.tokenAmount.decimals,
      owner: account.data.parsed.info.owner,
      isNative: account.data.parsed.info.isNative,
    }));
    // Identifica tokens LP (passa o endereço do usuário e conexão para Meteora)
    const lpTokens = await identifyLpTokens(accounts, address, connection);
    // Para cada token LP, busca dados do pool
    const lpPositions = await Promise.all(lpTokens.map(async ({ mint, protocol, positionData }) => {
      const pool = await getLpPoolDataByMint(mint, protocol);
      const userAccount = accounts.find(acc => acc.mint === mint);
      
      // Para Meteora, usa dados da posição diretamente
      if (protocol === 'Meteora' && positionData) {
        const totalXAmount = parseFloat(positionData.totalXAmount || '0');
        const totalYAmount = parseFloat(positionData.totalYAmount || '0');
        const totalLiquidity = totalXAmount + totalYAmount;
        
        return {
          mint,
          protocol,
          amount: totalLiquidity.toFixed(6),
          decimals: 9,
          pool: {
            name: positionData.poolName || 'Meteora DLMM Pool',
            address: positionData.poolAddress,
            lp_mint: positionData.positionAddress,
            token_a_mint: positionData.mintX,
            token_b_mint: positionData.mintY,
            reserve_a: positionData.totalXAmount,
            reserve_b: positionData.totalYAmount,
            liquidity: positionData.liquidity,
            current_price: positionData.currentPrice,
            apr: positionData.apr,
            apy: positionData.apy,
            fees_24h: positionData.fees24h,
            volume_24h: positionData.volume24h,
            bin_step: positionData.binStep,
            lower_bin_id: positionData.lowerBinId,
            upper_bin_id: positionData.upperBinId
          },
          positionData,
          valueUSD: positionData.valueUSD || null
        };
      }
      
      // Para outros protocolos (Raydium, Orca)
      return {
        mint,
        protocol,
        amount: userAccount ? userAccount.amount : null,
        decimals: userAccount ? userAccount.decimals : null,
        pool,
      };
    }));

    // --- Detecção automática de fechamento de posição ---
    const prev = activePositionsCache[address] || [];
    const currentMints = new Set(lpPositions.map(p => p.mint));
    const closed = prev.filter(p => !currentMints.has(p.mint));
    for (const pos of closed) {
      // Calcular valor final estimado
      const finalValue = await estimateLpValueUSD(pos);
      // Valor inicial do cache, se disponível
      const initialValue = pos.initialValue || null;
      // Fees estimadas (diferença entre final e inicial, se ambos disponíveis)
      const totalFees = (finalValue != null && initialValue != null) ? (finalValue - initialValue) : null;
      await saveLpSnapshot({
        address,
        mint: pos.mint,
        protocol: pos.protocol,
        openDate: pos.openDate || '',
        closeDate: nowISO(),
        initialValue,
        finalValue,
        totalFees,
      });
    }
    // Atualizar cache: salvar posições atuais com timestamp de abertura se não existir
    const now = nowISO();
    activePositionsCache[address] = lpPositions.map(p => ({
      ...p,
      openDate: (prev.find(x => x.mint === p.mint)?.openDate) || now,
      initialValue: (prev.find(x => x.mint === p.mint)?.initialValue) || null,
      finalValue: null,
      totalFees: null,
    }));
    // --- Fim detecção ---

    res.json({ lpPositions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para registrar snapshot de posição LP (ex: ao remover liquidez)
app.post('/lp-snapshot', async (req, res) => {
  const { address, mint, protocol, openDate, closeDate, initialValue, finalValue, totalFees } = req.body;
  if (!address || !mint || !protocol || !openDate || !closeDate) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  const snapshot = { address, mint, protocol, openDate, closeDate, initialValue, finalValue, totalFees };
  await saveLpSnapshot(snapshot);
  res.json({ success: true });
});

// Endpoint para buscar histórico de posições LP fechadas (com filtros e paginação)
app.get('/lp-history', async (req, res) => {
  const { address, mint, protocol, from, to, limit = 50, offset = 0 } = req.query;
  if (!address) return res.status(400).json({ error: 'Missing address query parameter.' });
  let query = 'SELECT * FROM lp_snapshots WHERE address = ?';
  const params = [address];
  if (mint) { query += ' AND mint = ?'; params.push(mint); }
  if (protocol) { query += ' AND protocol = ?'; params.push(protocol); }
  if (from) { query += ' AND closeDate >= ?'; params.push(from); }
  if (to) { query += ' AND closeDate <= ?'; params.push(to); }
  query += ' ORDER BY closeDate DESC, createdAt DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  try {
    const stmt = db.prepare(query);
    const history = stmt.all(...params);
    res.json({ history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 