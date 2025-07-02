/**
 * TESTE FINAL - VALIDAÇÃO DE DADOS REAIS vs MOCKS
 * Servidor minimalista para testar funcionalidades específicas
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

console.log('🔍 TESTE FINAL: Validando REAL vs MOCK');

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    purpose: 'REAL_DATA_VALIDATION'
  });
});

// REAL: Token accounts da carteira de teste
app.get('/token-accounts', async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter.' });
  }
  
  try {
    console.log(`📡 [REAL DATA] Buscando carteira: ${address}`);
    
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(address);
    
    const response = await connection.getParsedTokenAccountsByOwner(
      publicKey, 
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    const accounts = response.value.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      mint: account.data.parsed.info.mint,
      amount: account.data.parsed.info.tokenAmount.uiAmountString,
      decimals: account.data.parsed.info.tokenAmount.decimals,
      owner: account.data.parsed.info.owner
    }));
    
    console.log(`✅ [REAL DATA] ${accounts.length} tokens encontrados`);
    
    res.json({ 
      accounts,
      totalCount: accounts.length,
      dataSource: 'SOLANA_MAINNET_RPC',
      isMock: false,
      testType: 'REAL_BLOCKCHAIN_DATA'
    });
    
  } catch (error) {
    console.error(`❌ [REAL DATA] Erro:`, error.message);
    res.status(500).json({ 
      error: error.message,
      testType: 'REAL_ERROR'
    });
  }
});

// REAL: Preços via API externa (CoinGecko)
app.get('/price', async (req, res) => {
  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol query parameter.' });
  }
  
  try {
    console.log(`💰 [REAL API] Buscando preço: ${symbol}`);
    
    // Tentar API real do CoinGecko
    const coinGeckoMapping = {
      'SOL': 'solana',
      'solana': 'solana',
      'BTC': 'bitcoin', 
      'bitcoin': 'bitcoin',
      'ETH': 'ethereum',
      'ethereum': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether'
    };
    
    const geckoId = coinGeckoMapping[symbol.toUpperCase()] || coinGeckoMapping[symbol.toLowerCase()];
    
    if (!geckoId) {
      throw new Error(`Symbol ${symbol} not supported for real price lookup`);
    }
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`;
    console.log(`📡 [REAL API] Calling: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data[geckoId]?.usd;
    
    if (!price) {
      throw new Error(`Price not found for ${symbol}`);
    }
    
    console.log(`✅ [REAL API] Preço encontrado: $${price}`);
    
    res.json({ 
      symbol: symbol.toUpperCase(), 
      price,
      source: 'CoinGecko API',
      timestamp: new Date().toISOString(),
      isMock: false,
      testType: 'REAL_EXTERNAL_API'
    });
    
  } catch (error) {
    console.error(`❌ [REAL API] Erro:`, error.message);
    res.status(500).json({ 
      error: error.message,
      symbol,
      testType: 'REAL_API_ERROR'
    });
  }
});

// Mock vs Real comparison endpoint
app.get('/test-comparison', async (req, res) => {
  const { address } = req.query;
  
  try {
    console.log(`🔬 [COMPARISON] Testando REAL vs MOCK para: ${address}`);
    
    // Resultado REAL da carteira
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(address || 'AFFrQHC3mGooiC65vmS9C22oeeVuyd3nCchc8iqWr5Ki');
    
    const response = await connection.getParsedTokenAccountsByOwner(
      publicKey, 
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    const realData = {
      tokenCount: response.value.length,
      hasRealBalance: response.value.filter(acc => 
        parseFloat(acc.account.data.parsed.info.tokenAmount.uiAmountString || '0') > 0
      ).length,
      sampleTokens: response.value.slice(0, 3).map(acc => ({
        mint: acc.account.data.parsed.info.mint,
        amount: acc.account.data.parsed.info.tokenAmount.uiAmountString
      }))
    };
    
    // Comparação hipotética com mock
    const mockData = {
      tokenCount: 5, // Seria fixo no mock
      hasRealBalance: 5,
      sampleTokens: [
        { mint: 'mock1...', amount: '100.0' },
        { mint: 'mock2...', amount: '200.0' },
        { mint: 'mock3...', amount: '300.0' }
      ]
    };
    
    console.log(`✅ [COMPARISON] REAL: ${realData.tokenCount} tokens vs MOCK: ${mockData.tokenCount} tokens`);
    
    res.json({
      comparison: {
        realData,
        mockData,
        differences: {
          tokenCountDiff: realData.tokenCount - mockData.tokenCount,
          isRealDataLarger: realData.tokenCount > mockData.tokenCount,
          realDataAdvantage: 'Real data shows actual blockchain state'
        }
      },
      conclusion: realData.tokenCount > 0 ? 'REAL_DATA_AVAILABLE' : 'EMPTY_WALLET',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [COMPARISON] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 TESTE FINAL servidor na porta ${PORT}`);
  console.log(`🔬 Endpoints para validação:`);
  console.log(`   GET /token-accounts?address=AFFr... - DADOS REAIS blockchain`);
  console.log(`   GET /price?symbol=SOL - PREÇOS REAIS API externa`);
  console.log(`   GET /test-comparison?address=AFFr... - REAL vs MOCK`);
});