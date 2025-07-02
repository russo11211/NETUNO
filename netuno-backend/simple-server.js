require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { meteoraCache } = require('./meteoraPositionCache');
const { rpcManager } = require('./rpcManager');

const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Netuno Backend API is running with robust RPC and cache system.',
    timestamp: new Date().toISOString(),
    version: '2.0.0-robust',
    features: ['Multi-RPC fallback', 'Position cache', 'Meteora DLMM support']
  });
});

// RPC status monitoring
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

// Cache status monitoring
app.get('/cache-status', (req, res) => {
  try {
    const cacheStats = meteoraCache.getStats();
    const rpcStats = rpcManager.getStats();
    res.json({
      timestamp: new Date().toISOString(),
      cacheStats,
      rpcStats,
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Main LP positions endpoint with robust fallback
app.get('/lp-positions', async (req, res) => {
  const startTime = Date.now();
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ 
      error: 'Missing address query parameter.',
      example: '/lp-positions?address=JAp5oM9Vjt1jzSe3kU73MhNni5ShFtxqwD372URyW5gV'
    });
  }

  try {
    console.log(`🔍 Fetching LP positions for: ${address}`);
    
    // Usar sistema de cache robusto
    const positions = await meteoraCache.getPositions(address);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ LP positions fetched in ${processingTime}ms`);
    
    // Formatar resposta no formato esperado pelo frontend
    const response = {
      lpPositions: positions.map(position => ({
        mint: position.mint,
        protocol: position.protocol,
        amount: position.amount,
        decimals: position.decimals,
        pool: position.pool,
        positionData: position.positionData,
        valueUSD: position.valueUSD,
        lastUpdated: position.lastUpdated
      })),
      metadata: {
        totalPositions: positions.length,
        totalValueUSD: positions.reduce((sum, p) => sum + (p.valueUSD || 0), 0),
        protocols: [...new Set(positions.map(p => p.protocol))],
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        dataSource: positions.length > 0 ? 'cache' : 'none'
      }
    };

    res.json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Error fetching positions (${processingTime}ms):`, error.message);
    
    res.status(500).json({
      error: error.message,
      address,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      suggestion: 'Try again in a few moments or check /rpc-status for RPC health'
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const cacheStats = meteoraCache.getStats();
    const rpcStats = rpcManager.getStats();
    const healthyRpcs = Object.values(rpcStats).filter(stat => stat.isHealthy).length;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cache: {
        totalWallets: cacheStats.totalWallets,
        totalPositions: cacheStats.totalPositions
      },
      rpc: {
        healthyEndpoints: healthyRpcs,
        totalEndpoints: Object.keys(rpcStats).length
      },
      memory: process.memoryUsage()
    };

    // Determine overall health
    if (healthyRpcs === 0 && cacheStats.totalPositions === 0) {
      health.status = 'degraded';
      health.warning = 'No healthy RPCs and no cached data available';
    } else if (healthyRpcs === 0) {
      health.status = 'limited';
      health.warning = 'No healthy RPCs but cache is available';
    }

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'limited' ? 206 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add RPC endpoint
app.post('/rpc-endpoints', (req, res) => {
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

// Clean cache
app.post('/cache/clean', (req, res) => {
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      'GET /',
      'GET /lp-positions?address=WALLET_ADDRESS',
      'GET /rpc-status',
      'GET /cache-status',
      'GET /health',
      'POST /rpc-endpoints',
      'POST /cache/clean'
    ],
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Netuno Backend Server started on port ${PORT}`);
  console.log(`🌐 Available at: http://localhost:${PORT}`);
  console.log(`💾 Cache initialized with ${meteoraCache.getStats().knownWallets} known wallets`);
  console.log(`🔗 RPC Manager initialized with ${rpcManager.rpcEndpoints.length} endpoints`);
  console.log(`⚡ Features: Multi-RPC fallback, Position cache, Robust error handling`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;