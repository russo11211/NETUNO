'use client';

import { Redis } from '@upstash/redis';

// 🔥 Upstash Redis Configuration (Free tier)
const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || 'https://noted-warthog-17085.upstash.io',
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || 'AUK9AAIjcDE1YmQwZmE2YmY2NjA0NGE0YjYyMTIyNjJjNmFkZWMwY3AxMA',
});

// 🎯 Cache Keys
export const cacheKeys = {
  portfolio: (address: string) => `portfolio:${address}`,
  positions: (address: string) => `positions:${address}`,
  prices: (symbols: string[]) => `prices:${symbols.sort().join(',')}`,
  pools: (protocol: string) => `pools:${protocol}`,
} as const;

// ⏱️ Cache TTL (Time To Live) in seconds
export const cacheTTL = {
  portfolio: 300, // 5 minutes
  positions: 180, // 3 minutes  
  prices: 120, // 2 minutes
  pools: 600, // 10 minutes
  realtime: 30, // 30 seconds for real-time data
} as const;

// 🚀 Redis Cache Service
export class RedisCache {
  
  // 📊 Get cached data
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      
      console.log(`🎯 Cache HIT: ${key}`);
      return data as T;
    } catch (error) {
      console.warn(`❌ Cache GET error for ${key}:`, error);
      return null;
    }
  }

  // 💾 Set cached data with TTL
  static async set<T>(key: string, data: T, ttlSeconds: number = cacheTTL.portfolio): Promise<boolean> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      console.log(`✅ Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      console.warn(`❌ Cache SET error for ${key}:`, error);
      return false;
    }
  }

  // 🔄 Get or Set pattern (cache-aside)
  static async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlSeconds: number = cacheTTL.portfolio
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached) return cached;

    // If not in cache, fetch fresh data
    console.log(`🔍 Cache MISS: ${key} - fetching fresh data`);
    const freshData = await fetchFn();
    
    // Store in cache for next time
    await this.set(key, freshData, ttlSeconds);
    
    return freshData;
  }

  // 🗑️ Delete cached data
  static async delete(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      console.log(`🗑️ Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      console.warn(`❌ Cache DELETE error for ${key}:`, error);
      return false;
    }
  }

  // 🔥 Batch operations for multiple keys
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const results = await redis.mget(...keys);
      console.log(`🎯 Cache MGET: ${keys.length} keys`);
      return results as (T | null)[];
    } catch (error) {
      console.warn(`❌ Cache MGET error:`, error);
      return keys.map(() => null);
    }
  }

  // 💾 Batch set operations
  static async mset(keyValuePairs: Array<{key: string, value: any, ttl?: number}>): Promise<boolean> {
    try {
      const pipeline = redis.pipeline();
      
      keyValuePairs.forEach(({key, value, ttl = cacheTTL.portfolio}) => {
        pipeline.setex(key, ttl, JSON.stringify(value));
      });
      
      await pipeline.exec();
      console.log(`✅ Cache MSET: ${keyValuePairs.length} keys`);
      return true;
    } catch (error) {
      console.warn(`❌ Cache MSET error:`, error);
      return false;
    }
  }

  // 🔍 Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.warn(`❌ Cache EXISTS error for ${key}:`, error);
      return false;
    }
  }

  // ⏱️ Get TTL for a key
  static async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.warn(`❌ Cache TTL error for ${key}:`, error);
      return -1;
    }
  }

  // 🧹 Clear all cache (use with caution)
  static async flush(): Promise<boolean> {
    try {
      await redis.flushall();
      console.log(`🧹 Cache FLUSHED`);
      return true;
    } catch (error) {
      console.warn(`❌ Cache FLUSH error:`, error);
      return false;
    }
  }

  // 📊 Cache statistics
  static async getStats(): Promise<{
    connected: boolean;
    memoryUsage?: string;
    keyCount?: number;
  }> {
    try {
      const info = await redis.info();
      return {
        connected: true,
        memoryUsage: 'Available in Redis info',
        keyCount: await redis.dbsize(),
      };
    } catch (error) {
      return {
        connected: false
      };
    }
  }
}

// 🎯 Portfolio-specific cache functions
export const portfolioCache = {
  
  // Get portfolio with positions
  async getPortfolio(address: string) {
    return RedisCache.get(cacheKeys.portfolio(address));
  },

  // Set portfolio with positions
  async setPortfolio(address: string, data: any) {
    return RedisCache.set(cacheKeys.portfolio(address), data, cacheTTL.portfolio);
  },

  // Invalidate portfolio cache
  async invalidatePortfolio(address: string) {
    await RedisCache.delete(cacheKeys.portfolio(address));
    await RedisCache.delete(cacheKeys.positions(address));
  },

  // Batch get multiple portfolios
  async getMultiplePortfolios(addresses: string[]) {
    const keys = addresses.map(addr => cacheKeys.portfolio(addr));
    return RedisCache.mget(keys);
  },
};

// 🎯 Price cache functions
export const priceCache = {
  
  // Get token prices
  async getPrices(symbols: string[]) {
    const key = cacheKeys.prices(symbols);
    return RedisCache.get(key);
  },

  // Set token prices
  async setPrices(symbols: string[], data: any) {
    const key = cacheKeys.prices(symbols);
    return RedisCache.set(key, data, cacheTTL.prices);
  },
};

export default RedisCache;