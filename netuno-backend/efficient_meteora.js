const fetch = require('node-fetch');
const { Connection } = require('@solana/web3.js');

// APIs oficiais Meteora DLMM
const METEORA_POOLS_URL = 'https://dlmm-api.meteora.ag/pair/all';
const METEORA_POSITION_BASE_URL = 'https://dlmm-api.meteora.ag/position';

/**
 * Busca posições do usuário de forma mais eficiente
 * @param {string} userAddress 
 * @param {Connection} connection 
 * @returns {Promise<Array>}
 */
async function fetchMeteoraUserPositionsEfficient(userAddress, connection) {
  try {
    console.log(`Efficiently fetching Meteora positions for: ${userAddress}`);
    
    const startTime = Date.now();
    const allPositions = [];
    
    // Método 1: Buscar diretamente via API de usuário (mais rápido)
    try {
      console.log('Method 1: Direct user API...');
      
      const userEndpoints = [
        `https://dlmm-api.meteora.ag/user/${userAddress}/positions`,
        `https://dlmm-api.meteora.ag/user/${userAddress}/pair_positions`,
        `https://dlmm-api.meteora.ag/positions/user/${userAddress}`,
      ];
      
      for (const endpoint of userEndpoints) {
        try {
          const res = await fetch(endpoint, { timeout: 5000 });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              console.log(`Found ${data.length} positions via ${endpoint}`);
              
              // Processar posições em paralelo
              const positions = await Promise.all(
                data.map(async (pos) => {
                  try {
                    const positionAddress = pos.address || pos.publickey || pos.position_address;
                    if (positionAddress) {
                      return await processPosition(positionAddress);
                    }
                  } catch (e) {
                    return null;
                  }
                })
              );
              
              allPositions.push(...positions.filter(p => p !== null));
              break; // Se encontrou via API direta, para aqui
            }
          }
        } catch (e) {
          console.log(`API ${endpoint} failed: ${e.message}`);
        }
      }
    } catch (e) {
      console.log('Method 1 failed:', e.message);
    }
    
    // Método 2: Se não encontrou via API, buscar via transações (limitado para performance)
    if (allPositions.length === 0) {
      console.log('Method 2: Transaction search (limited)...');
      
      try {
        const publicKey = new (require('@solana/web3.js').PublicKey)(userAddress);
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 }); // Reduzido para performance
        
        const positionCandidates = new Set();
        
        for (const sig of signatures.slice(0, 5)) { // Limitar ainda mais
          try {
            const tx = await connection.getTransaction(sig.signature, {
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0
            });
            
            if (tx && tx.meta && !tx.meta.err) {
              const meteoraInvolved = tx.transaction.message.accountKeys.some(key => 
                key.toBase58() === 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'
              );
              
              if (meteoraInvolved) {
                const hasPositionLogs = tx.meta.logMessages?.some(log => 
                  log.includes('InitializePosition')
                );
                
                if (hasPositionLogs) {
                  for (const account of tx.transaction.message.accountKeys) {
                    const accountStr = account.toBase58();
                    if (accountStr !== userAddress && 
                        !accountStr.includes('1111') && 
                        !accountStr.includes('Token') && 
                        accountStr !== 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo' &&
                        accountStr !== 'So11111111111111111111111111111111111111112') {
                      positionCandidates.add(accountStr);
                    }
                  }
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // Processar candidatos em paralelo
        const candidatePositions = await Promise.all(
          Array.from(positionCandidates).map(candidate => processPosition(candidate))
        );
        
        allPositions.push(...candidatePositions.filter(p => p !== null && p.owner === userAddress));
      } catch (e) {
        console.log('Method 2 failed:', e.message);
      }
    }
    
    const endTime = Date.now();
    console.log(`Found ${allPositions.length} positions in ${endTime - startTime}ms`);
    
    return allPositions;
    
  } catch (error) {
    console.error('Efficient search failed:', error.message);
    return [];
  }
}

/**
 * Processa uma posição individual
 * @param {string} positionAddress 
 * @returns {Promise<Object|null>}
 */
async function processPosition(positionAddress) {
  try {
    const positionRes = await fetch(`${METEORA_POSITION_BASE_URL}/${positionAddress}`, { 
      timeout: 3000 
    });
    
    if (!positionRes.ok) return null;
    
    const positionData = await positionRes.json();
    const poolAddress = positionData.lb_pair || positionData.pair_address;
    
    if (!poolAddress) return null;
    
    // Buscar dados do pool
    const poolRes = await fetch(`https://dlmm-api.meteora.ag/pair/${poolAddress}`, {
      timeout: 3000
    });
    
    let poolData = null;
    if (poolRes.ok) {
      poolData = await poolRes.json();
    }
    
    // Calcular métricas básicas
    const age = calculateAge(positionData.created_at);
    const currentValue = calculatePositionValue(positionData, poolData);
    const collectedFees = calculateCollectedFees(positionData);
    const unCollectedFees = calculateUnCollectedFees(positionData);
    const upnl = calculateUPnL(positionData, poolData);
    
    return {
      positionAddress,
      poolAddress: poolAddress,
      poolName: poolData?.name || `Pool ${poolAddress?.slice(0, 8)}`,
      mintX: poolData?.mint_x || 'Unknown',
      mintY: poolData?.mint_y || 'Unknown',
      age: age,
      totalXAmount: positionData.total_x_amount || '0',
      totalYAmount: positionData.total_y_amount || '0',
      currentPrice: poolData?.current_price || 0,
      liquidity: poolData?.liquidity || '0',
      apr: poolData?.apr || 0,
      apy: poolData?.apy || 0,
      fees24h: poolData?.fees_24h || 0,
      volume24h: poolData?.trade_volume_24h || 0,
      binStep: poolData?.bin_step || 0,
      valueUSD: currentValue,
      collectedFeeX: collectedFees.x,
      collectedFeeY: collectedFees.y,
      uncolFeeX: unCollectedFees.x,
      uncolFeeY: unCollectedFees.y,
      upnlValue: upnl.value,
      upnlPercentage: upnl.percentage,
      range: calculateDynamicRange(positionData, poolData),
      owner: positionData.owner,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    return null;
  }
}

// Funções auxiliares (mesmas do arquivo anterior)
function calculateAge(createdAt) {
  if (!createdAt) return '-';
  
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} d`;
  } else {
    return `${diffHours} hrs`;
  }
}

function calculatePositionValue(positionData, poolData) {
  if (!positionData || !poolData) return 0;
  
  if (positionData.position_value_usd) {
    return parseFloat(positionData.position_value_usd);
  }
  
  const totalX = parseFloat(positionData.total_x_amount || '0');
  const totalY = parseFloat(positionData.total_y_amount || '0');
  const currentPrice = parseFloat(poolData.current_price || '0');
  
  if (totalX === 0 && totalY === 0) return 0;
  
  const valueX = totalX * currentPrice;
  const valueY = totalY;
  
  return valueX + valueY;
}

function calculateCollectedFees(positionData) {
  if (!positionData) return { x: '0 SOL', y: '$0.0000' };
  
  const feeXClaimed = parseFloat(positionData.total_fee_x_claimed || '0');
  const feeUsdClaimed = parseFloat(positionData.total_fee_usd_claimed || '0');
  
  return {
    x: feeXClaimed > 0 ? `${feeXClaimed.toFixed(6)} SOL` : '0 SOL',
    y: feeUsdClaimed > 0 ? `$${feeUsdClaimed.toFixed(4)}` : '$0.0000'
  };
}

function calculateUnCollectedFees(positionData) {
  if (!positionData) return { x: '< 0.01 SOL', y: '0%' };
  
  const dailyYield = parseFloat(positionData.daily_fee_yield || '0');
  const feeApy = parseFloat(positionData.fee_apy_24h || '0');
  
  return {
    x: dailyYield > 0 ? `${dailyYield.toFixed(6)} SOL` : '< 0.01 SOL',
    y: feeApy > 0 ? `${feeApy.toFixed(2)}%` : '0%'
  };
}

function calculateUPnL(positionData, poolData) {
  if (!positionData || !poolData) return { value: '< 0.01', percentage: '0%' };
  
  const currentValue = calculatePositionValue(positionData, poolData);
  const initialValue = parseFloat(positionData.initial_value || currentValue);
  const pnl = currentValue - initialValue;
  const pnlPercentage = initialValue > 0 ? (pnl / initialValue) * 100 : 0;
  
  return {
    value: Math.abs(pnl) > 0.001 ? `${Math.abs(pnl).toFixed(3)}` : '< 0.01',
    percentage: `${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%`
  };
}

function calculateDynamicRange(positionData, poolData) {
  if (!positionData || !poolData) return '$0.0000 - $0.0000';
  
  const binStep = parseFloat(poolData.bin_step || '25');
  const currentPrice = parseFloat(poolData.current_price || '0');
  const lowerBinId = parseInt(positionData.lower_bin_id || '0');
  const upperBinId = parseInt(positionData.upper_bin_id || '0');
  
  const priceDiff = binStep / 10000;
  const lowerPrice = currentPrice * (1 + (lowerBinId * priceDiff));
  const upperPrice = currentPrice * (1 + (upperBinId * priceDiff));
  
  return `$${Math.max(lowerPrice, 0).toFixed(4)} - $${Math.max(upperPrice, 0).toFixed(4)}`;
}

module.exports = { fetchMeteoraUserPositionsEfficient };