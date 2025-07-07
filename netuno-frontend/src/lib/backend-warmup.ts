'use client';

// 🔥 Backend Warmup Service - Wakes up Render backend
export class BackendWarmup {
  private static isWarming = false;
  private static warmedUrls = new Set<string>();

  // 🔥 Wake up backend servers (ping to wake from hibernation)
  static async warmupBackend(urls: string[]): Promise<void> {
    if (this.isWarming) return;
    this.isWarming = true;

    console.log('🔥 Warming up backend servers...');

    const warmupPromises = urls.map(async (url) => {
      if (this.warmedUrls.has(url)) return;

      // Múltiplos pings paralelos para acordar o servidor mais rápido
      const parallelPings = Array.from({ length: 3 }, async (_, i) => {
        try {
          console.log(`🔥 Ping ${i + 1}/3: ${url}`);
          
          const response = await fetch(`${url}/health`, {
            method: 'GET',
            headers: { 
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            },
            signal: AbortSignal.timeout(10000), // Timeout mais longo
          });

          if (response.ok) {
            console.log(`✅ Server warmed up (ping ${i + 1}): ${url}`);
            this.warmedUrls.add(url);
            return true;
          }
          return false;
        } catch (error) {
          console.warn(`❌ Ping ${i + 1} failed for ${url}:`, error);
          return false;
        }
      });

      // Esperar pelo menos um ping bem-sucedido
      const results = await Promise.allSettled(parallelPings);
      const success = results.some(r => r.status === 'fulfilled' && r.value === true);
      
      if (!success) {
        console.warn(`⚠️ All pings failed for ${url}`);
      }
    });

    await Promise.allSettled(warmupPromises);
    this.isWarming = false;
    console.log('🔥 Backend warmup completed');
  }

  // 🔥 Smart warmup - only for production backend
  static async smartWarmup(): Promise<void> {
    const productionUrls = [
      'https://netuno-backend.onrender.com',
    ];

    // Também fazer warmup preventivo de endpoints importantes
    const warmupEndpoints = [
      '/health',
      '/lp-positions?address=test', // Pre-cache endpoint
    ];

    await this.warmupBackend(productionUrls);
    
    // Fazer warmup adicional dos endpoints após o servidor acordar
    await this.warmupEndpoints(productionUrls[0], warmupEndpoints);
  }
  
  // 🔥 Warmup specific endpoints
  static async warmupEndpoints(baseUrl: string, endpoints: string[]): Promise<void> {
    console.log('🔥 Warming up specific endpoints...');
    
    const endpointPromises = endpoints.map(async (endpoint) => {
      try {
        const url = `${baseUrl}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(8000),
        });
        
        console.log(`🔥 Endpoint warmed: ${endpoint} (${response.status})`);
      } catch (error) {
        console.warn(`⚠️ Endpoint warmup failed: ${endpoint}`, error);
      }
    });
    
    await Promise.allSettled(endpointPromises);
  }

  // 🔥 Check if backend is ready
  static async isBackendReady(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 🔥 Auto-warmup on module load (only in browser)
if (typeof window !== 'undefined') {
  // Warm up imediatamente e depois a cada 5 minutos
  BackendWarmup.smartWarmup();
  
  // Warmup periódico para manter o servidor acordado
  setInterval(() => {
    BackendWarmup.smartWarmup();
  }, 5 * 60 * 1000); // A cada 5 minutos
  
  // Warmup ao focar na janela (usuário voltou)
  window.addEventListener('focus', () => {
    BackendWarmup.smartWarmup();
  });
}

export default BackendWarmup;