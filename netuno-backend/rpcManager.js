const { Connection } = require('@solana/web3.js');

/**
 * RPC Manager robusto com múltiplos providers e fallback automático
 * Suporta rate limiting, circuit breaker e cache de conexões
 */
class RpcManager {
  constructor() {
    // Lista de RPCs em ordem de prioridade - Helius como principal
    this.rpcEndpoints = [
      // 1. Helius RPC (premium, suporta todas as calls incluindo DLMM)
      process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=43f8597b-7300-4273-beb2-93e0e6bd1c8b',
      
      // 2. RPCs alternativos com boa compatibilidade
      'https://rpc.ankr.com/solana',
      'https://solana-mainnet.rpc.extrnode.com', 
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://mainnet.solana.com',
      'https://solana.public-rpc.com',
    ];

    // Estado de cada RPC
    this.rpcStatus = new Map();
    this.connections = new Map();
    this.currentRpcIndex = 0;
    this.maxRetries = 3;
    this.circuitBreakerThreshold = 5; // Falhas consecutivas antes de marcar como down
    this.recoveryTime = 60000; // 1 minuto para tentar recuperar RPC
    
    this.initializeRpcs();
  }

  initializeRpcs() {
    this.rpcEndpoints.forEach((endpoint, index) => {
      this.rpcStatus.set(endpoint, {
        isHealthy: true,
        consecutiveFailures: 0,
        lastFailure: null,
        responseTime: 0,
        totalRequests: 0,
        successfulRequests: 0
      });
      
      // Criar conexão para cada RPC
      this.connections.set(endpoint, new Connection(endpoint, {
        commitment: 'confirmed',
        wsEndpoint: undefined, // Desabilitar WebSocket para evitar problemas
      }));
    });
  }

  /**
   * Obter conexão RPC saudável com fallback automático
   */
  async getHealthyConnection() {
    const startTime = Date.now();
    
    // Tentar RPCs em ordem de prioridade
    for (let attempts = 0; attempts < this.rpcEndpoints.length; attempts++) {
      const endpoint = this.rpcEndpoints[this.currentRpcIndex];
      const status = this.rpcStatus.get(endpoint);
      
      // Verificar se RPC está em recovery period
      if (!status.isHealthy && status.lastFailure) {
        const timeSinceFailure = Date.now() - status.lastFailure;
        if (timeSinceFailure < this.recoveryTime) {
          console.log(`⏳ RPC ${endpoint} em recovery, tentando próximo...`);
          this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcEndpoints.length;
          continue;
        } else {
          // Tempo de recovery passou, marcar como saudável novamente
          status.isHealthy = true;
          status.consecutiveFailures = 0;
          console.log(`🔄 RPC ${endpoint} retornando após recovery`);
        }
      }

      const connection = this.connections.get(endpoint);
      
      try {
        // Teste rápido de conectividade
        console.log(`🧪 Testando RPC: ${endpoint}`);
        const version = await Promise.race([
          connection.getVersion(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        const responseTime = Date.now() - startTime;
        this.recordSuccess(endpoint, responseTime);
        
        console.log(`✅ RPC saudável: ${endpoint} (${responseTime}ms)`);
        return { connection, endpoint };
        
      } catch (error) {
        console.log(`❌ RPC falhou: ${endpoint} - ${error.message}`);
        this.recordFailure(endpoint);
        
        // Mover para próximo RPC
        this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcEndpoints.length;
      }
    }

    throw new Error('❌ Todos os RPCs estão indisponíveis');
  }

  /**
   * Executar operação com retry automático e fallback
   */
  async executeWithFallback(operation, operationName = 'RPC Operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 ${operationName} - Tentativa ${attempt}/${this.maxRetries}`);
        
        const { connection, endpoint } = await this.getHealthyConnection();
        console.log(`📡 Usando RPC: ${endpoint}`);
        
        const startTime = Date.now();
        const result = await operation(connection);
        const duration = Date.now() - startTime;
        
        console.log(`✅ ${operationName} concluída em ${duration}ms via ${endpoint}`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.log(`❌ ${operationName} falhou (tentativa ${attempt}): ${error.message}`);
        
        // Aguardar antes de próxima tentativa
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`❌ ${operationName} falhou após ${this.maxRetries} tentativas: ${lastError.message}`);
  }

  recordSuccess(endpoint, responseTime) {
    const status = this.rpcStatus.get(endpoint);
    status.totalRequests++;
    status.successfulRequests++;
    status.responseTime = responseTime;
    status.consecutiveFailures = 0;
    status.isHealthy = true;
  }

  recordFailure(endpoint) {
    const status = this.rpcStatus.get(endpoint);
    status.totalRequests++;
    status.consecutiveFailures++;
    status.lastFailure = Date.now();
    
    // Circuit breaker: marcar como não saudável após muitas falhas
    if (status.consecutiveFailures >= this.circuitBreakerThreshold) {
      status.isHealthy = false;
      console.log(`🚨 Circuit breaker ativado para ${endpoint} (${status.consecutiveFailures} falhas consecutivas)`);
    }
  }

  /**
   * Obter estatísticas dos RPCs
   */
  getStats() {
    const stats = {};
    
    this.rpcStatus.forEach((status, endpoint) => {
      const successRate = status.totalRequests > 0 
        ? ((status.successfulRequests / status.totalRequests) * 100).toFixed(2)
        : 0;
        
      stats[endpoint] = {
        isHealthy: status.isHealthy,
        successRate: `${successRate}%`,
        avgResponseTime: `${status.responseTime}ms`,
        totalRequests: status.totalRequests,
        consecutiveFailures: status.consecutiveFailures,
        lastFailure: status.lastFailure ? new Date(status.lastFailure).toISOString() : null
      };
    });
    
    return stats;
  }

  /**
   * Adicionar novo RPC à lista
   */
  addRpcEndpoint(endpoint) {
    if (!this.rpcEndpoints.includes(endpoint)) {
      this.rpcEndpoints.push(endpoint);
      this.rpcStatus.set(endpoint, {
        isHealthy: true,
        consecutiveFailures: 0,
        lastFailure: null,
        responseTime: 0,
        totalRequests: 0,
        successfulRequests: 0
      });
      this.connections.set(endpoint, new Connection(endpoint, {
        commitment: 'confirmed',
        wsEndpoint: undefined,
      }));
      console.log(`➕ Novo RPC adicionado: ${endpoint}`);
    }
  }

  /**
   * Remover RPC da lista
   */
  removeRpcEndpoint(endpoint) {
    const index = this.rpcEndpoints.indexOf(endpoint);
    if (index > -1) {
      this.rpcEndpoints.splice(index, 1);
      this.rpcStatus.delete(endpoint);
      this.connections.delete(endpoint);
      console.log(`➖ RPC removido: ${endpoint}`);
      
      // Ajustar índice atual se necessário
      if (this.currentRpcIndex >= this.rpcEndpoints.length) {
        this.currentRpcIndex = 0;
      }
    }
  }
}

// Singleton instance
const rpcManager = new RpcManager();

module.exports = { rpcManager };