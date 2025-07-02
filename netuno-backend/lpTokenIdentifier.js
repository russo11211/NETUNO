const { fetchRaydiumLpMints, fetchRaydiumPools } = require('./raydiumLpMints');
const { fetchOrcaLpMints, fetchOrcaPools } = require('./orcaLpMints');
const { fetchMeteoraLpMints, fetchMeteoraPools, fetchMeteoraUserPositions } = require('./meteoraLpMints');
const DLMM = require('@meteora-ag/dlmm');
const { PublicKey } = require('@solana/web3.js');
const { rpcManager } = require('./rpcManager');
const { meteoraCache } = require('./meteoraPositionCache');

/**
 * Identifica quais token accounts do usuário são LP tokens de Raydium, Orca ou Meteora
 * Para Meteora DLMM, usa SDK oficial já que não há LP tokens tradicionais
 * @param {Array<{mint: string}>} userTokenAccounts - Array de objetos com pelo menos a propriedade 'mint'
 * @param {string} userAddress - Endereço da carteira do usuário
 * @param {Connection} connection - Conexão Solana RPC
 * @returns {Promise<Array<{mint: string, protocol: string}>>}
 */
async function identifyLpTokens(userTokenAccounts, userAddress, connection) {
  console.log('🔍 Starting multi-protocol LP token identification...');
  const allLpPositions = [];

  // 1. RAYDIUM LP Token Detection
  console.log('🟡 Checking Raydium LP tokens...');
  try {
    const raydiumLpMints = await fetchRaydiumLpMints();
    const raydiumSet = new Set(raydiumLpMints);
    
    const raydiumPositions = userTokenAccounts
      .filter(account => raydiumSet.has(account.mint))
      .map(account => ({
        mint: account.mint,
        protocol: 'Raydium',
        amount: account.amount,
        decimals: account.decimals
      }));
    
    console.log(`📊 Found ${raydiumPositions.length} Raydium LP positions`);
    allLpPositions.push(...raydiumPositions);
  } catch (error) {
    console.error('❌ Error fetching Raydium LP tokens:', error.message);
  }

  // 2. ORCA LP Token Detection
  console.log('🔵 Checking Orca LP tokens...');
  try {
    const orcaLpMints = await fetchOrcaLpMints();
    const orcaSet = new Set(orcaLpMints);
    
    const orcaPositions = userTokenAccounts
      .filter(account => orcaSet.has(account.mint))
      .map(account => ({
        mint: account.mint,
        protocol: 'Orca',
        amount: account.amount,
        decimals: account.decimals
      }));
    
    console.log(`📊 Found ${orcaPositions.length} Orca LP positions`);
    allLpPositions.push(...orcaPositions);
  } catch (error) {
    console.error('❌ Error fetching Orca LP tokens:', error.message);
  }

  // 3. METEORA DLMM Position Detection (existing logic)
  console.log('🟣 Fetching Meteora DLMM positions with robust fallback system...');
  
  // Função para tentar SDK com RPC robusto
  const trySDK = async () => {
    return await rpcManager.executeWithFallback(async (robustConnection) => {
      const userWallet = new PublicKey(userAddress);
      const positionsMap = await DLMM.default.getAllLbPairPositionsByUser(robustConnection, userWallet);
      
      console.log(`📊 Found ${positionsMap.size} DLMM positions from SDK`);
      
      const meteoraResults = [];
      
      // Converter Map para array de posições
      for (const [positionKey, positionData] of positionsMap) {
        console.log(`📋 Processing position: ${positionKey}`);
        
        const tokenXMint = positionData.tokenX.publicKey.toString();
        const tokenYMint = positionData.tokenY.publicKey.toString();
        const tokenXAmount = positionData.tokenX.amount.toString();
        const tokenYAmount = positionData.tokenY.amount.toString();
        
        const lpPosition = {
          mint: positionKey,
          protocol: 'Meteora',
          positionData: {
            poolName: `${tokenXMint.slice(0, 6)}/SOL DLMM`,
            poolAddress: positionData.lbPair.toString?.() || positionKey,
            positionAddress: positionKey,
            mintX: tokenXMint,
            mintY: tokenYMint,
            totalXAmount: tokenXAmount,
            totalYAmount: tokenYAmount,
            activeId: positionData.lbPair.activeId,
            binStep: positionData.lbPair.binStep,
            pairType: positionData.lbPair.pairType,
            valueUSD: null
          }
        };
        
        meteoraResults.push(lpPosition);
      }
      
      console.log(`✅ Successfully processed ${meteoraResults.length} Meteora DLMM positions`);
      return meteoraResults;
      
    }, 'Meteora DLMM Position Fetch');
  };

  // Usar cache com fallback inteligente para Meteora
  try {
    const meteoraPositions = await meteoraCache.getPositions(userAddress, trySDK);
    allLpPositions.push(...meteoraPositions);
  } catch (error) {
    console.error('❌ Erro no sistema de cache/fallback Meteora:', error.message);
  }

  console.log(`🎯 Total LP positions found across all protocols: ${allLpPositions.length}`);
  return allLpPositions;
}

/**
 * Dado um mint e protocolo, retorna os dados completos do pool correspondente
 * @param {string} mint
 * @param {string} protocol - 'Raydium' | 'Orca' | 'Meteora'
 * @returns {Promise<Object|null>} Dados do pool ou null se não encontrado
 */
async function getLpPoolDataByMint(mint, protocol) {
  console.log(`🔍 Fetching pool data for ${protocol} mint: ${mint}`);
  
  try {
    if (protocol === 'Raydium') {
      const pools = await fetchRaydiumPools();
      const pool = pools.find(pool => pool.lpMint === mint);
      console.log(`Found Raydium pool data:`, pool ? 'Yes' : 'No');
      return pool || null;
    }
    
    if (protocol === 'Orca') {
      const pools = await fetchOrcaPools();
      const pool = pools.find(pool => pool.lpMint === mint);
      console.log(`Found Orca pool data:`, pool ? 'Yes' : 'No');
      return pool || null;
    }
    
    if (protocol === 'Meteora') {
      const pools = await fetchMeteoraPools();
      const pool = pools.find(pool => pool.lp_mint === mint);
      console.log(`Found Meteora pool data:`, pool ? 'Yes' : 'No');
      return pool || null;
    }
    
    console.warn(`❌ Unknown protocol: ${protocol}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error fetching ${protocol} pool data:`, error.message);
    return null;
  }
}

module.exports = { identifyLpTokens, getLpPoolDataByMint }; 