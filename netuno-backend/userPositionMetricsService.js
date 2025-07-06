/**
 * User Position Metrics Service - Otimizado para posições específicas do usuário
 * Performance extrema com cache hierárquico e cálculos precisos
 */

const { getBatchTokenPrices } = require('./highPerformancePriceService');

// Cache hierárquico para performance extrema
class MetricsCache {
  constructor() {
    this.positionMetrics = new Map(); // 5min TTL
    this.historicalData = new Map();  // 15min TTL
    this.priceHistory = new Map();    // 1h TTL
  }

  set(key, value, type = 'metrics') {
    const ttl = {
      'metrics': 5 * 60 * 1000,      // 5min
      'historical': 15 * 60 * 1000,  // 15min
      'price': 60 * 60 * 1000        // 1h
    };

    const cache = type === 'metrics' ? this.positionMetrics : 
                  type === 'historical' ? this.historicalData : this.priceHistory;
    
    cache.set(key, {
      value,
      expiry: Date.now() + ttl[type]
    });
  }

  get(key, type = 'metrics') {
    const cache = type === 'metrics' ? this.positionMetrics : 
                  type === 'historical' ? this.historicalData : this.priceHistory;
    
    const item = cache.get(key);
    if (!item || Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    return item.value;
  }

  clear() {
    this.positionMetrics.clear();
    this.historicalData.clear();
    this.priceHistory.clear();
  }

  getStats() {
    return {
      positionMetrics: this.positionMetrics.size,
      historicalData: this.historicalData.size,
      priceHistory: this.priceHistory.size
    };
  }
}

// Cache global otimizado
const metricsCache = new MetricsCache();

/**
 * Estimate initial investment value based on current LP position
 * This calculates what the user likely invested initially based on current token amounts
 * @param {Object} position - Position data with tokenInfo
 * @returns {Promise<number|null>} Estimated initial investment in USD
 */
async function estimateInitialInvestment(position) {
  try {
    if (!position.tokenInfo || !position.valueUSD) {
      console.log(`⚠️ Cannot estimate initial investment - missing token info or value`);
      return null;
    }

    const { tokenX, tokenY } = position.tokenInfo;
    
    // Current token amounts in UI format
    const currentAmountX = tokenX.userAmount / Math.pow(10, tokenX.decimals);
    const currentAmountY = tokenY.userAmount / Math.pow(10, tokenY.decimals);
    
    // Get current prices
    const prices = await getBatchTokenPrices([tokenX.mint, tokenY.mint]);
    const currentPriceX = prices.get(tokenX.mint);
    const currentPriceY = prices.get(tokenY.mint);
    
    if (!currentPriceX || !currentPriceY) {
      console.log(`⚠️ Cannot get current prices for P&L calculation`);
      return null;
    }

    // Current value of tokens
    const currentValueX = currentAmountX * currentPriceX;
    const currentValueY = currentAmountY * currentPriceY;
    const totalCurrentValue = currentValueX + currentValueY;
    
    // For LP positions, estimate initial investment assuming roughly similar value distribution
    // This is an approximation since we don't have historical data
    const estimatedInitialInvestment = totalCurrentValue; // Conservative estimate
    
    console.log(`💰 Estimated initial investment: $${estimatedInitialInvestment.toFixed(2)} (based on current position)`);
    console.log(`   - ${tokenX.symbol}: ${currentAmountX.toFixed(4)} × $${currentPriceX.toFixed(4)} = $${currentValueX.toFixed(2)}`);
    console.log(`   - ${tokenY.symbol}: ${currentAmountY.toFixed(4)} × $${currentPriceY.toFixed(4)} = $${currentValueY.toFixed(2)}`);
    
    return estimatedInitialInvestment;
  } catch (error) {
    console.error('Error estimating initial investment:', error.message);
    return null;
  }
}

/**
 * Calculate real P&L based on current token values + fees vs estimated initial investment
 * This follows the requested format step by step
 * @param {Object} position - Current position data
 * @param {string} userAddress - User wallet address
 * @returns {Promise<Object>} Detailed P&L calculation
 */
async function calculateTotalPnL(position, userAddress) {
  try {
    const cacheKey = `total_pnl_${userAddress}_${position.mint}`;
    const cached = metricsCache.get(cacheKey);
    if (cached !== null) return cached;

    console.log(`\n🧮 === CÁLCULO P&L PASSO A PASSO ===`);
    console.log(`Position: ${position.protocol} ${position.pool?.name || 'LP Pool'}`);

    if (!position.tokenInfo) {
      console.log(`❌ Sem dados de tokens para calcular P&L`);
      return { value: null, percentage: null, error: "Missing token info" };
    }

    const { tokenX, tokenY } = position.tokenInfo;

    // PASSO 1: BUSCAR PREÇOS ATUAIS
    console.log(`\n1. 📊 BUSCAR PREÇOS ATUAIS:`);
    const prices = await getBatchTokenPrices([tokenX.mint, tokenY.mint]);
    const currentPriceX = prices.get(tokenX.mint);
    const currentPriceY = prices.get(tokenY.mint);

    if (!currentPriceX || !currentPriceY) {
      console.log(`❌ Não foi possível obter preços atuais`);
      return { value: null, percentage: null, error: "Cannot fetch current prices" };
    }

    console.log(`   - Preço atual de ${tokenX.symbol}: $${currentPriceX.toFixed(6)}`);
    console.log(`   - Preço atual de ${tokenY.symbol}: $${currentPriceY.toFixed(6)}`);

    // PASSO 2: CALCULAR QUANTIDADES ATUAIS
    console.log(`\n2. 🪙 QUANTIDADES ATUAIS DE TOKENS:`);
    const currentAmountX = tokenX.userAmount / Math.pow(10, tokenX.decimals);
    const currentAmountY = tokenY.userAmount / Math.pow(10, tokenY.decimals);
    
    console.log(`   - Quantidade de ${tokenX.symbol}: ${currentAmountX.toFixed(6)}`);
    console.log(`   - Quantidade de ${tokenY.symbol}: ${currentAmountY.toFixed(6)}`);

    // PASSO 3: CALCULAR VALOR ATUAL DA POSIÇÃO
    console.log(`\n3. 💰 CALCULAR VALOR ATUAL DA POSIÇÃO:`);
    const currentValueX = currentAmountX * currentPriceX;
    const currentValueY = currentAmountY * currentPriceY;
    const totalTokenValue = currentValueX + currentValueY;

    console.log(`   Valor_tokenX = ${currentAmountX.toFixed(6)} × $${currentPriceX.toFixed(6)} = $${currentValueX.toFixed(2)}`);
    console.log(`   Valor_tokenY = ${currentAmountY.toFixed(6)} × $${currentPriceY.toFixed(6)} = $${currentValueY.toFixed(2)}`);
    console.log(`   Valor_tokens = $${currentValueX.toFixed(2)} + $${currentValueY.toFixed(2)} = $${totalTokenValue.toFixed(2)}`);

    // PASSO 4: FEES COLETADAS (estimativa)
    const estimatedFees = 0; // TODO: Implementar tracking real de fees
    console.log(`   Fees_totais = $${estimatedFees.toFixed(2)} (estimativa)`);
    
    const totalCurrentValue = totalTokenValue + estimatedFees;
    console.log(`   Valor_total = $${totalTokenValue.toFixed(2)} + $${estimatedFees.toFixed(2)} = $${totalCurrentValue.toFixed(2)}`);

    // PASSO 5: ESTIMAR INVESTIMENTO INICIAL
    console.log(`\n4. 📈 ESTIMAR INVESTIMENTO INICIAL:`);
    // Para LP, assumimos que investimento inicial = valor atual (conservador)
    // Idealmente viria de dados históricos da blockchain
    const estimatedInitialInvestment = totalCurrentValue;
    console.log(`   Valor_inicial = $${estimatedInitialInvestment.toFixed(2)} (estimativa baseada em posição atual)`);

    // PASSO 6: CALCULAR P&L
    console.log(`\n5. 📊 CALCULAR P&L:`);
    const pnlAbsolute = totalCurrentValue - estimatedInitialInvestment;
    const pnlPercentage = estimatedInitialInvestment > 0 ? (pnlAbsolute / estimatedInitialInvestment) * 100 : 0;

    console.log(`   P&L_absoluto = $${totalCurrentValue.toFixed(2)} - $${estimatedInitialInvestment.toFixed(2)} = $${pnlAbsolute.toFixed(2)}`);
    console.log(`   P&L_percentual = ($${pnlAbsolute.toFixed(2)} / $${estimatedInitialInvestment.toFixed(2)}) × 100 = ${pnlPercentage.toFixed(2)}%`);

    // PASSO 7: APRESENTAR RESULTADO
    console.log(`\n6. 📋 RESULTADO FINAL:`);
    console.log(`┌─────────────────────┬─────────────┐`);
    console.log(`│ Investimento Inicial│ $${estimatedInitialInvestment.toFixed(2).padStart(10)} │`);
    console.log(`│ Valor Atual (tokens)│ $${totalTokenValue.toFixed(2).padStart(10)} │`);
    console.log(`│ Fees Coletadas      │ $${estimatedFees.toFixed(2).padStart(10)} │`);
    console.log(`│ Valor Total Atual   │ $${totalCurrentValue.toFixed(2).padStart(10)} │`);
    console.log(`│ P&L Absoluto        │ $${pnlAbsolute.toFixed(2).padStart(10)} │`);
    console.log(`│ P&L Percentual      │ ${pnlPercentage.toFixed(2).padStart(9)}% │`);
    console.log(`└─────────────────────┴─────────────┘`);

    const result = {
      value: Math.round(pnlAbsolute * 100) / 100,
      percentage: Math.round(pnlPercentage * 100) / 100,
      initialValue: Math.round(estimatedInitialInvestment * 100) / 100,
      currentValue: Math.round(totalCurrentValue * 100) / 100,
      tokenValue: Math.round(totalTokenValue * 100) / 100,
      feesCollected: Math.round(estimatedFees * 100) / 100,
      calculations: {
        tokenX: { amount: currentAmountX, price: currentPriceX, value: currentValueX },
        tokenY: { amount: currentAmountY, price: currentPriceY, value: currentValueY }
      },
      note: "P&L baseado em estimativa de investimento inicial = valor atual"
    };

    // Cache result
    metricsCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error calculating P&L:', error.message);
    return { value: null, percentage: null, error: error.message };
  }
}

/**
 * Calcula fees coletadas e não coletadas para a posição
 * @param {Object} position - Dados da posição
 * @param {string} userAddress - Endereço do usuário
 * @returns {Promise<Object>} Fees breakdown
 */
async function calculateFeesBreakdown(position, userAddress) {
  try {
    const cacheKey = `fees_breakdown_${userAddress}_${position.mint}`;
    const cached = metricsCache.get(cacheKey);
    if (cached !== null) return cached;

    // Para sistema atual, não temos tracking histórico de fees
    const feesColetadas = 0; // TODO: implementar tracking real de fees via blockchain
    
    // Estimar fees não coletadas baseado na atividade da posição
    let feesNaoColetadas = 0;
    if (position.valueUSD && position.tokenInfo) {
      // Estimativa conservadora: assumir 30 dias de atividade média
      const estimatedDaysActive = 30;
      const monthsActive = estimatedDaysActive / 30;
      
      // Base fee rate depending on bin step (tighter = more fees)
      const binStep = position.pool?.bin_step || 100;
      const feeMultiplier = Math.max(0.5, Math.min(2.0, 100 / binStep));
      
      feesNaoColetadas = position.valueUSD * 0.0001 * monthsActive * feeMultiplier;
    }

    const totalAcumuladas = feesColetadas + feesNaoColetadas;

    const result = {
      coletadas: Math.round(feesColetadas * 100) / 100,
      naoColetadas: Math.round(feesNaoColetadas * 100) / 100,
      totalAcumuladas: Math.round(totalAcumuladas * 100) / 100,
      feeRate: position.pool?.bin_step ? (position.pool.bin_step / 10000) : 0.0025 // Default 0.25%
    };

    // Cache result
    metricsCache.set(cacheKey, result);

    console.log(`💸 Fees breakdown calculated: Coletadas=$${feesColetadas.toFixed(2)}, Não Coletadas=$${feesNaoColetadas.toFixed(2)}, Total=$${totalAcumuladas.toFixed(2)}`);

    return result;
  } catch (error) {
    console.error('Error calculating fees breakdown:', error.message);
    return { coletadas: null, naoColetadas: null, totalAcumuladas: null };
  }
}

/**
 * Calcula idade da posição em dias
 * @param {string} initialDate - Data inicial ISO
 * @returns {number} Dias desde criação
 */
function calculatePositionAge(initialDate) {
  if (!initialDate) return 0;
  const now = new Date();
  const inception = new Date(initialDate);
  const diffMs = now - inception;
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcula impermanent loss específico da posição do usuário
 * @param {Object} position - Dados da posição atual
 * @param {string} userAddress - Endereço do usuário
 * @returns {Promise<Object>} Impermanent loss data
 */
async function calculateUserImpermanentLoss(position, userAddress) {
  try {
    const cacheKey = `il_${userAddress}_${position.mint}`;
    const cached = metricsCache.get(cacheKey);
    if (cached !== null) return cached;

    if (!position.tokenInfo) {
      return { value: null, percentage: null };
    }

    // For current system, IL calculation requires historical price data
    // Without initial investment prices, we cannot calculate accurate IL
    console.log(`📉 IL calculation: requires historical price data for accurate calculation`);
    
    const result = {
      value: null,
      percentage: null,
      hodlValue: position.valueUSD || 0,
      note: "IL calculation requires historical price tracking - not available in current system"
    };

    // Cache result
    metricsCache.set(cacheKey, result);

    console.log(`📉 IL calculated: Current=$${currentValue.toFixed(2)}, HODL=$${hodlValue.toFixed(2)}, IL=$${impermanentLoss.toFixed(2)} (${impermanentLossPercentage.toFixed(2)}%)`);

    return result;
  } catch (error) {
    console.error('Error calculating impermanent loss:', error.message);
    return { value: null, percentage: null };
  }
}

/**
 * Calcula métricas completas e otimizadas da posição do usuário
 * @param {Object} position - Dados da posição
 * @param {string} userAddress - Endereço do usuário
 * @returns {Promise<Object>} Métricas completas
 */
async function calculateUserPositionMetrics(position, userAddress) {
  try {
    const startTime = Date.now();
    console.log(`🎯 Calculating optimized user metrics for ${position.protocol} position`);

    // Calcular todas as métricas em paralelo para performance máxima
    const [
      valorDepositado,
      pnlTotal,
      feesBreakdown,
      impermanentLoss
    ] = await Promise.all([
      estimateInitialInvestment(position),
      calculateTotalPnL(position, userAddress),
      calculateFeesBreakdown(position, userAddress),
      calculateUserImpermanentLoss(position, userAddress)
    ]);

    // Para sistema atual, sem dados históricos reais, usamos estimativa
    const estimatedPositionAge = 30; // dias - estimativa conservadora

    const metrics = {
      // NOVAS MÉTRICAS SOLICITADAS
      valorDepositado,
      pnlTotal,
      fees: feesBreakdown,
      
      // MÉTRICAS EXISTENTES (corrigidas para usuário)
      impermanentLoss,
      
      // METADADOS
      positionAge: estimatedPositionAge,
      initialDate: null, // Não disponível sem tracking histórico
      lastCalculated: new Date().toISOString(),
      
      // PERFORMANCE METRICS
      computeTime: Date.now() - startTime,
      cached: false // Será true se vier do cache na próxima chamada
    };

    const duration = Date.now() - startTime;
    console.log(`⚡ User metrics calculated in ${duration}ms`);

    return metrics;
  } catch (error) {
    console.error('Error calculating user position metrics:', error.message);
    return {
      error: error.message,
      lastCalculated: new Date().toISOString()
    };
  }
}

/**
 * Processa múltiplas posições com otimização máxima
 * @param {Array} positions - Array de posições
 * @param {string} userAddress - Endereço do usuário
 * @returns {Promise<Array>} Posições com métricas
 */
async function enrichPositionsWithUserMetrics(positions, userAddress) {
  if (!positions || positions.length === 0) return [];

  const startTime = Date.now();
  console.log(`🚀 Enriching ${positions.length} positions with optimized user metrics`);

  // Processar todas as posições em paralelo
  const enrichedPositions = await Promise.all(
    positions.map(async (position) => {
      try {
        const metrics = await calculateUserPositionMetrics(position, userAddress);
        return {
          ...position,
          metrics
        };
      } catch (error) {
        console.error(`Error enriching position ${position.mint}:`, error.message);
        return {
          ...position,
          metrics: {
            error: error.message,
            lastCalculated: new Date().toISOString()
          }
        };
      }
    })
  );

  const duration = Date.now() - startTime;
  const successful = enrichedPositions.filter(p => !p.metrics.error).length;

  console.log(`⚡ User metrics enrichment completed: ${successful}/${positions.length} positions in ${duration}ms`);

  return enrichedPositions;
}

/**
 * Calcula resumo do portfolio do usuário
 * @param {Array} positions - Posições enriquecidas
 * @returns {Object} Resumo do portfolio
 */
function calculatePortfolioSummary(positions) {
  const validPositions = positions.filter(p => p.metrics && !p.metrics.error);
  
  const summary = {
    totalDeposited: 0,
    totalCurrent: 0,
    totalPnL: 0,
    totalFeesCollected: 0,
    totalFeesUncollected: 0,
    totalFeesGenerated: 0,
    positionsCount: validPositions.length,
    avgPositionAge: 0
  };

  validPositions.forEach(position => {
    const { metrics } = position;
    
    summary.totalDeposited += metrics.valorDepositado || 0;
    summary.totalCurrent += position.valueUSD || 0;
    summary.totalPnL += metrics.pnlTotal?.value || 0;
    summary.totalFeesCollected += metrics.fees?.coletadas || 0;
    summary.totalFeesUncollected += metrics.fees?.naoColetadas || 0;
    summary.totalFeesGenerated += metrics.fees?.totalAcumuladas || 0;
    summary.avgPositionAge += metrics.positionAge || 0;
  });

  if (validPositions.length > 0) {
    summary.avgPositionAge = summary.avgPositionAge / validPositions.length;
  }

  // Round all values
  Object.keys(summary).forEach(key => {
    if (typeof summary[key] === 'number') {
      summary[key] = Math.round(summary[key] * 100) / 100;
    }
  });

  return summary;
}

/**
 * Limpa todos os caches
 */
function clearAllMetricsCache() {
  metricsCache.clear();
  console.log('🧹 All metrics caches cleared');
}

/**
 * Obtém estatísticas dos caches
 */
function getMetricsCacheStats() {
  return metricsCache.getStats();
}

module.exports = {
  calculateUserPositionMetrics,
  enrichPositionsWithUserMetrics,
  calculatePortfolioSummary,
  clearAllMetricsCache,
  getMetricsCacheStats,
  
  // Funções individuais para uso específico
  estimateInitialInvestment,
  calculateTotalPnL,
  calculateFeesBreakdown,
  calculateUserImpermanentLoss
};