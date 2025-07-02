/**
 * Servidor de teste simplificado para validar funcionalidades do Netuno
 * Sem dependências problemáticas, focado no teste da lógica principal
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

// CORS para localhost
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Mock database em memória para testes
const mockDatabase = {
  snapshots: [],
  positions: {}
};

// Endpoint principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'Netuno Test Server - Funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0-test'
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

// Test endpoint para verificar carteira real
app.get('/test-wallet', async (req, res) => {
  const testWallet = 'AFFrQHC3mGooiC65vmS9C22oeeVuyd3nCchc8iqWr5Ki';
  
  console.log(`🧪 Testando carteira: ${testWallet}`);
  
  try {
    // Simular busca de token accounts
    const { Connection, PublicKey } = require('@solana/web3.js');
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(testWallet);
    
    console.log('📡 Buscando token accounts...');
    const response = await connection.getParsedTokenAccountsByOwner(
      publicKey, 
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    const accounts = response.value.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      mint: account.data.parsed.info.mint,
      amount: account.data.parsed.info.tokenAmount.uiAmountString,
      decimals: account.data.parsed.info.tokenAmount.decimals
    }));
    
    console.log(`✅ Encontrados ${accounts.length} token accounts`);
    
    res.json({
      wallet: testWallet,
      totalAccounts: accounts.length,
      accounts: accounts.slice(0, 10), // Primeiros 10 para visualizar
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar carteira:', error.message);
    res.status(500).json({ 
      error: error.message,
      wallet: testWallet 
    });
  }
});

// Token accounts endpoint (compatível com frontend)
app.get('/token-accounts', async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  
  try {
    const { Connection, PublicKey } = require('@solana/web3.js');
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
    const publicKey = new PublicKey(address);
    
    console.log(`📡 Buscando token accounts para: ${address}`);
    
    const response = await connection.getParsedTokenAccountsByOwner(
      publicKey, 
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    const accounts = response.value.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      mint: account.data.parsed.info.mint,
      amount: account.data.parsed.info.tokenAmount.uiAmountString,
      decimals: account.data.parsed.info.tokenAmount.decimals,
      owner: account.data.parsed.info.owner,
      isNative: account.data.parsed.info.isNative || false
    }));
    
    console.log(`✅ ${accounts.length} token accounts encontrados`);
    
    res.json({ accounts });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// LP positions endpoint simplificado
app.get('/lp-positions', async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  
  try {
    console.log(`🔍 Analisando LP positions para: ${address}`);
    
    // Primeiro buscar token accounts
    const { Connection, PublicKey } = require('@solana/web3.js');
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
    
    const publicKey = new PublicKey(address);
    const response = await connection.getParsedTokenAccountsByOwner(
      publicKey, 
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    const accounts = response.value.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      mint: account.data.parsed.info.mint,
      amount: account.data.parsed.info.tokenAmount.uiAmountString,
      decimals: account.data.parsed.info.tokenAmount.decimals
    }));
    
    console.log(`📊 Analisando ${accounts.length} tokens para identificar LPs...`);
    
    // Simulação simplificada de identificação LP
    // Na implementação real, isso consultaria as APIs dos protocolos
    const potentialLPs = accounts.filter(acc => 
      parseFloat(acc.amount || '0') > 0 && acc.amount !== '0'
    );
    
    const lpPositions = potentialLPs.slice(0, 5).map((acc, i) => ({
      mint: acc.mint,
      protocol: ['Raydium', 'Orca', 'Meteora'][i % 3],
      amount: acc.amount,
      decimals: acc.decimals,
      pool: {
        name: `LP Pool ${i + 1}`,
        address: acc.pubkey,
        lp_mint: acc.mint,
        token_a_mint: 'So11111111111111111111111111111111111111112', // SOL
        token_b_mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        reserve_a: '1000.5',
        reserve_b: '150000.25'
      },
      valueUSD: (Math.random() * 10000 + 100).toFixed(2)
    }));
    
    console.log(`✅ Identificadas ${lpPositions.length} posições LP potenciais`);
    
    res.json({ 
      lpPositions,
      totalTokens: accounts.length,
      analyzedPositions: lpPositions.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro LP positions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Price endpoint mock
app.get('/price', async (req, res) => {
  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol query parameter.' });
  }
  
  // Mock prices para teste
  const mockPrices = {
    'SOL': 180.50,
    'USDC': 1.00,
    'USDT': 1.00,
    'RAY': 4.25,
    'ORCA': 2.80
  };
  
  const price = mockPrices[symbol.toUpperCase()] || Math.random() * 100;
  
  res.json({ 
    symbol: symbol.toUpperCase(), 
    price,
    source: 'mock',
    timestamp: new Date().toISOString()
  });
});

// LP history mock
app.get('/lp-history', (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  
  // Mock history data
  const history = [
    {
      id: 1,
      address,
      mint: 'Exemplo1LP',
      protocol: 'Raydium',
      openDate: '2024-01-15T10:00:00Z',
      closeDate: '2024-06-30T15:30:00Z',
      initialValue: 5000.00,
      finalValue: 5750.25,
      totalFees: 250.50
    },
    {
      id: 2,
      address,
      mint: 'Exemplo2LP',
      protocol: 'Orca',
      openDate: '2024-03-01T08:00:00Z',
      closeDate: '2024-12-15T12:00:00Z',
      initialValue: 2500.00,
      finalValue: 2890.75,
      totalFees: 145.30
    }
  ];
  
  res.json({ 
    history,
    total: history.length,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Netuno Test Server rodando na porta ${PORT}`);
  console.log(`📡 Ready para testar com carteira: AFFrQHC3mGooiC65vmS9C22oeeVuyd3nCchc8iqWr5Ki`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test-wallet`);
});