const fetch = require('node-fetch');
const { Connection, PublicKey } = require('@solana/web3.js');

// APIs para buscar metadados de tokens
const TOKEN_LIST_URL = 'https://token.jup.ag/all';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/token_price/solana';

async function getRealTokenData(userAddress) {
  try {
    console.log('Buscando dados reais dos tokens...');
    
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(userAddress);
    
    // 1. Buscar todos os tokens da carteira
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    // 2. Buscar lista de tokens conhecidos do Jupiter
    console.log('Buscando lista de tokens do Jupiter...');
    let tokenList = [];
    try {
      const tokenRes = await fetch(TOKEN_LIST_URL, { timeout: 10000 });
      if (tokenRes.ok) {
        tokenList = await tokenRes.json();
        console.log(`Lista de tokens carregada: ${tokenList.length} tokens`);
      }
    } catch (e) {
      console.log('Erro ao buscar lista de tokens:', e.message);
    }
    
    // 3. Analisar tokens com saldo
    const tokensWithBalance = tokenAccounts.value.filter(account => {
      const amount = parseFloat(account.account.data.parsed.info.tokenAmount.uiAmountString || '0');
      return amount > 0;
    });
    
    console.log(`Analisando ${tokensWithBalance.length} tokens com saldo...`);
    
    const realTokens = [];
    
    for (const account of tokensWithBalance.slice(0, 20)) {
      const mint = account.account.data.parsed.info.mint;
      const amount = account.account.data.parsed.info.tokenAmount.uiAmountString;
      const decimals = account.account.data.parsed.info.tokenAmount.decimals;
      
      // Buscar nome do token na lista do Jupiter
      const tokenInfo = tokenList.find(token => token.address === mint);
      const tokenName = tokenInfo ? tokenInfo.symbol : 'Unknown';
      
      // Verificar se é uma posição Meteora
      let isMeteoraPosition = false;
      let positionValue = 0;
      
      try {
        const posRes = await fetch(`https://dlmm-api.meteora.ag/position/${mint}`, { timeout: 3000 });
        if (posRes.ok) {
          const posData = await posRes.json();
          if (posData.owner === userAddress) {
            isMeteoraPosition = true;
            positionValue = parseFloat(posData.position_value_usd || '0');
            console.log(`✅ Posição Meteora encontrada: ${mint} - Valor: $${positionValue}`);
          }
        }
      } catch (e) {
        // Não é uma posição Meteora
      }
      
      realTokens.push({
        mint,
        amount,
        decimals,
        tokenName,
        isMeteoraPosition,
        positionValue
      });
    }
    
    // 4. Filtrar apenas posições Meteora
    const meteoraPositions = realTokens.filter(token => token.isMeteoraPosition);
    
    console.log(`\n=== POSIÇÕES METEORA REAIS ===`);
    console.log(`Total: ${meteoraPositions.length} posições`);
    
    for (const pos of meteoraPositions) {
      console.log(`Token: ${pos.tokenName}`);
      console.log(`Mint: ${pos.mint}`);
      console.log(`Amount: ${pos.amount}`);
      console.log(`Valor USD: $${pos.positionValue}`);
      console.log('---');
    }
    
    return meteoraPositions;
    
  } catch (error) {
    console.error('Erro ao buscar dados reais:', error.message);
    return [];
  }
}

// Buscar preços em tempo real via CoinGecko
async function getTokenPrices(mints) {
  try {
    const mintList = mints.join(',');
    const priceRes = await fetch(`${COINGECKO_API}?contract_addresses=${mintList}&vs_currencies=usd,sol`, {
      timeout: 5000
    });
    
    if (priceRes.ok) {
      const prices = await priceRes.json();
      console.log('Preços obtidos via CoinGecko:', Object.keys(prices).length);
      return prices;
    }
  } catch (e) {
    console.log('Erro ao buscar preços:', e.message);
  }
  
  return {};
}

async function testRealData() {
  const userAddress = 'ANoP4oDmG3pNCrTkS49bjCbbMK5mxAwdST8wBLKD5wsa';
  const positions = await getRealTokenData(userAddress);
  
  if (positions.length > 0) {
    const mints = positions.map(p => p.mint);
    const prices = await getTokenPrices(mints);
    
    console.log('\n=== DADOS COMPLETOS ===');
    positions.forEach((pos, i) => {
      const price = prices[pos.mint];
      console.log(`Posição ${i + 1}:`);
      console.log(`  Token: ${pos.tokenName}`);
      console.log(`  Valor USD: $${pos.positionValue}`);
      console.log(`  Preço USD: $${price?.usd || 'N/A'}`);
      console.log(`  Preço SOL: ${price?.sol || 'N/A'} SOL`);
      console.log('');
    });
  }
}

if (require.main === module) {
  testRealData();
}

module.exports = { getRealTokenData, getTokenPrices };