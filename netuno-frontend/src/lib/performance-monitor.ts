'use client';

// 🎯 Performance Monitoring Service
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static isEnabled = true;

  // 📊 Start timing an operation
  static startTimer(operation: string): () => void {
    if (!this.isEnabled) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(operation, duration);
    };
  }

  // 📊 Record a metric
  static recordMetric(operation: string, duration: number) {
    if (!this.isEnabled) return;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 50 measurements
    if (metrics.length > 50) {
      metrics.shift();
    }
    
    // Log if over threshold
    if (duration > 500) {
      console.warn(`⚠️ SLOW OPERATION: ${operation} took ${duration.toFixed(2)}ms`);
    } else if (duration < 100) {
      console.log(`⚡ FAST: ${operation} completed in ${duration.toFixed(2)}ms`);
    }
  }

  // 📈 Get performance statistics
  static getStats(operation?: string) {
    if (operation) {
      const metrics = this.metrics.get(operation) || [];
      return this.calculateStats(operation, metrics);
    }
    
    const allStats: Record<string, any> = {};
    this.metrics.forEach((metrics, operation) => {
      allStats[operation] = this.calculateStats(operation, metrics);
    });
    
    return allStats;
  }

  // 🧮 Calculate statistics
  private static calculateStats(operation: string, metrics: number[]) {
    if (metrics.length === 0) {
      return { operation, count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }
    
    const sorted = [...metrics].sort((a, b) => a - b);
    const sum = metrics.reduce((a, b) => a + b, 0);
    
    return {
      operation,
      count: metrics.length,
      avg: sum / metrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
      recent: metrics.slice(-5), // Last 5 measurements
    };
  }

  // 🎯 Performance targets check
  static checkTargets() {
    const targets = {
      'portfolio-fetch': 500,
      'cache-read': 50,
      'component-render': 100,
      'api-call': 3000,
    };
    
    const results: Record<string, { passed: boolean; avg: number; target: number }> = {};
    
    Object.entries(targets).forEach(([operation, target]) => {
      const stats = this.getStats(operation);
      if (stats.count > 0) {
        results[operation] = {
          passed: stats.avg <= target,
          avg: stats.avg,
          target,
        };
      }
    });
    
    return results;
  }

  // 📊 Performance report
  static generateReport() {
    const allStats = this.getStats();
    const targets = this.checkTargets();
    
    console.group('🎯 NETUNO Performance Report');
    
    console.log('📊 Current Performance Stats:');
    Object.values(allStats).forEach((stats: any) => {
      const emoji = stats.avg < 500 ? '⚡' : stats.avg < 1000 ? '⚠️' : '🐌';
      console.log(`${emoji} ${stats.operation}: ${stats.avg.toFixed(2)}ms avg (${stats.count} samples)`);
    });
    
    console.log('\n🎯 Target Performance Check:');
    Object.entries(targets).forEach(([operation, result]) => {
      const emoji = result.passed ? '✅' : '❌';
      console.log(`${emoji} ${operation}: ${result.avg.toFixed(2)}ms (target: ${result.target}ms)`);
    });
    
    console.groupEnd();
    
    return { stats: allStats, targets };
  }

  // 🧹 Clear metrics
  static clear() {
    this.metrics.clear();
  }

  // 🔧 Enable/disable monitoring
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// 🎯 Performance decorators and hooks
export function measurePerformance(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const endTimer = PerformanceMonitor.startTimer(`${operation}-${propertyKey}`);
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        endTimer();
      }
    };
    
    return descriptor;
  };
}

// 🎯 React Performance Hook
export function usePerformanceTimer(operation: string) {
  const startTimer = () => PerformanceMonitor.startTimer(operation);
  const recordMetric = (duration: number) => PerformanceMonitor.recordMetric(operation, duration);
  
  return { startTimer, recordMetric };
}

// 🎯 Cache performance wrapper
export async function withCachePerformance<T>(
  operation: string,
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const endTimer = PerformanceMonitor.startTimer(`cache-${operation}`);
  
  try {
    const result = await fetchFn();
    return result;
  } finally {
    endTimer();
  }
}

// 🎯 API call performance wrapper
export async function withApiPerformance<T>(
  endpoint: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const endTimer = PerformanceMonitor.startTimer(`api-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`);
  
  try {
    const result = await fetchFn();
    return result;
  } finally {
    endTimer();
  }
}

// 🎯 Auto-reporting (every 30 seconds in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    if (PerformanceMonitor.getStats().length > 0) {
      PerformanceMonitor.generateReport();
    }
  }, 30000);
}

export default PerformanceMonitor;