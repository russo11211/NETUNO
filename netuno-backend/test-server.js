const express = require('express');
const cors = require('cors');

const app = express();

// CORS super permissivo para contornar Kaspersky
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['*']
}));

app.use(express.json());

// Middleware adicional CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Test endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'NETUNO Test Server Running'
  });
});

// Mock LP positions endpoint
app.get('/lp-positions', (req, res) => {
  const { address } = req.query;
  
  // Mock data for testing
  const mockPositions = [
    {
      mint: 'test123',
      protocol: 'Meteora',
      amount: '100.5',
      pool: { name: 'KLED/SOL Test Pool' },
      tokenInfo: {
        tokenX: { symbol: 'KLED', userAmount: 241199498625, decimals: 6 },
        tokenY: { symbol: 'SOL', userAmount: 0, decimals: 9 }
      },
      valueUSD: 2.82,
      metrics: {
        valorDepositado: 2.82,
        pnlTotal: { value: 0, percentage: 0 },
        fees: { coletadas: 0, naoColetadas: 0 }
      }
    }
  ];
  
  res.json({
    lpPositions: mockPositions,
    summary: {
      totalPositions: 1,
      totalValueUSD: 2.82,
      protocols: ['Meteora']
    }
  });
});

const PORT = 3001; // Use different port to avoid conflicts
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 NETUNO Test Server running on port ${PORT}`);
  console.log(`🌐 Open access CORS enabled`);
  console.log(`✅ Ready for frontend testing`);
});