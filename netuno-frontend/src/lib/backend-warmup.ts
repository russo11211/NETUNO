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

      try {
        console.log(`🔥 Pinging: ${url}`);
        
        // Simple ping to wake up the server
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(5000), // Quick ping
        });

        if (response.ok) {
          console.log(`✅ Server warmed up: ${url}`);
          this.warmedUrls.add(url);
        } else {
          console.warn(`⚠️ Server responded but not healthy: ${url}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to warm up: ${url}`, error);
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

    return this.warmupBackend(productionUrls);
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
  // Warm up after 1 second to avoid blocking initial page load
  setTimeout(() => {
    BackendWarmup.smartWarmup();
  }, 1000);
}

export default BackendWarmup;