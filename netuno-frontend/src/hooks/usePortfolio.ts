'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { RedisCache, portfolioCache, cacheKeys, cacheTTL } from '../lib/redis-cache';
import { PerformanceMonitor, withCachePerformance, withApiPerformance } from '../lib/performance-monitor';

// 🎯 Types
interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  mint: string;
  userAmount: number;
  reserveAmount: number;
}

interface Position {
  mint: string;
  protocol: string;
  amount: string;
  pool?: {
    name?: string;
    bin_step?: number;
  };
  tokenInfo?: {
    tokenX: TokenInfo;
    tokenY: TokenInfo;
  };
  valueUSD?: number | null;
  tokenXValueUSD?: number | null;
  tokenYValueUSD?: number | null;
  lastPriceUpdate?: string;
  metrics?: any;
}

interface PortfolioData {
  lpPositions: Position[];
  summary?: {
    totalPositions: number;
    protocols: string[];
    totalValueUSD: number;
    positionsWithPrices: number;
  };
}

// 🚀 Query Keys Factory (for better cache management)
export const portfolioKeys = {
  all: ['portfolio'] as const,
  addresses: () => [...portfolioKeys.all, 'addresses'] as const,
  address: (address: string) => [...portfolioKeys.addresses(), address] as const,
  positions: (address: string) => [...portfolioKeys.address(address), 'positions'] as const,
} as const;

// 🌐 API URLs with fallback strategy
const API_URLS = [
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://netuno-backend.onrender.com',
  'https://netuno-backend.onrender.com',
  'http://127.0.0.1:4000',
  'http://localhost:4000',
  'http://127.0.0.1:3001',
  'http://localhost:3001',
  'http://127.0.0.1:8080',
  'http://localhost:8080',
] as const;

// 🔄 Optimized fetch function with Redis cache + fallback strategy + Performance monitoring
const fetchPortfolioData = async (address: string): Promise<PortfolioData> => {
  const endTotalTimer = PerformanceMonitor.startTimer('portfolio-fetch-total');
  
  try {
    // 🎯 STEP 1: Check Redis cache first (with timeout)
    try {
      const cachedData = await Promise.race([
        withCachePerformance(
          'redis-portfolio',
          `portfolio:${address}`,
          async () => {
            const cached = await portfolioCache.getPortfolio(address);
            if (cached) {
              console.log(`🎯 Redis Cache HIT for ${address}`);
              PerformanceMonitor.recordMetric('cache-hit', 1);
              return cached as PortfolioData;
            }
            PerformanceMonitor.recordMetric('cache-miss', 1);
            return null;
          }
        ),
        // Timeout after 2 seconds for cache
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cache timeout')), 2000)
        )
      ]);
      
      if (cachedData) {
        return cachedData as PortfolioData;
      }
    } catch (error) {
      console.warn('Redis cache failed/timeout, proceeding to API:', error);
      PerformanceMonitor.recordMetric('cache-error', 1);
    }

    // 🔍 STEP 2: Cache miss - fetch from API with fallback
    let lastError: Error | null = null;
    let freshData: PortfolioData | null = null;

    console.log(`🎯 DEBUGGING: Fetching portfolio for address: "${address}"`);
    console.log(`🎯 Address length: ${address?.length}, type: ${typeof address}`);
    
    for (const baseUrl of API_URLS) {
      try {
        const fullUrl = `${baseUrl}/lp-positions?address=${address}`;
        console.log(`🔍 API Trying: ${fullUrl}`);
        
        freshData = await withApiPerformance(
          `lp-positions-${baseUrl.split('//')[1]?.split('.')[0] || 'api'}`,
          async () => {
            const response = await fetch(`${baseUrl}/lp-positions?address=${address}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
              },
              cache: 'no-cache',
              mode: 'cors',
              // Add timeout for faster fallback
              signal: AbortSignal.timeout(5000), // Reduced to 5s for even faster fallback
            });

            console.log(`🔍 Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ API Error Response: ${errorText}`);
              throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ API Response data:`, data);
            
            // ✅ Validate response structure
            if (!data.lpPositions || !Array.isArray(data.lpPositions)) {
              throw new Error('Invalid response format: missing lpPositions array');
            }

            console.log(`✅ API Success: Found ${data.lpPositions.length} positions`);
            PerformanceMonitor.recordMetric('api-success', 1);
            return data;
          }
        );
        
        break; // Success, stop trying other URLs

      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ API Failed ${baseUrl}:`, error);
        PerformanceMonitor.recordMetric('api-failure', 1);
        continue;
      }
    }

    // If all APIs failed, return empty data instead of throwing
    if (!freshData) {
      console.warn('All API endpoints failed, returning empty portfolio');
      PerformanceMonitor.recordMetric('api-total-failure', 1);
      
      // Return empty portfolio to avoid breaking the UI
      return {
        lpPositions: [],
        summary: {
          totalPositions: 0,
          protocols: [],
          totalValueUSD: 0,
          positionsWithPrices: 0,
        }
      };
    }

    // 💾 STEP 3: Store in Redis cache for next time (async, don't wait)
    portfolioCache.setPortfolio(address, freshData).catch(error => {
      console.warn('Failed to cache portfolio data:', error);
    });

    return freshData;
    
  } finally {
    endTotalTimer();
  }
};

// 🎯 Main usePortfolio hook
export function usePortfolio(address: string | null) {
  const queryClient = useQueryClient();

  // 🚀 Main portfolio query with React Query
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: portfolioKeys.positions(address || ''),
    queryFn: () => fetchPortfolioData(address!),
    enabled: Boolean(address), // Only fetch when address is provided
    
    // 🔥 PERFORMANCE SETTINGS
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    
    // 🔄 Refetch strategy
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    refetchIntervalInBackground: false,
    
    // 🎯 Error handling
    retry: (failureCount, error) => {
      // Don't retry client errors (4xx)
      if (error?.message?.includes('40')) return false;
      return failureCount < 2; // Retry network errors up to 2 times
    },
    
    // 📊 Metadata
    meta: {
      errorMessage: 'Failed to fetch portfolio data',
    },
  });

  // 📊 Computed values (memoized for performance)
  const portfolioMetrics = useMemo(() => {
    if (!data?.lpPositions) {
      return {
        totalValue: 0,
        totalPositions: 0,
        activeProtocols: 0,
        avgAPY: 0,
        positionsWithPrices: 0,
      };
    }

    const positions = data.lpPositions;
    const totalValue = positions.reduce((sum, pos) => sum + (pos.valueUSD || 0), 0);
    const totalPositions = positions.length;
    const activeProtocols = new Set(positions.map(p => p.protocol)).size;
    const avgAPY = positions.reduce((sum, pos) => sum + (pos.metrics?.apy || 0), 0) / (totalPositions || 1);
    const positionsWithPrices = positions.filter(p => p.valueUSD !== null && p.valueUSD !== undefined).length;

    return {
      totalValue,
      totalPositions,
      activeProtocols,
      avgAPY,
      positionsWithPrices,
    };
  }, [data?.lpPositions]);

  // 🔄 Manual refresh function
  const refresh = useCallback(async () => {
    return await refetch();
  }, [refetch]);

  // 🗑️ Cache invalidation function
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: portfolioKeys.address(address || ''),
    });
  }, [queryClient, address]);

  // 🎯 Prefetch function for next address
  const prefetchAddress = useCallback((nextAddress: string) => {
    queryClient.prefetchQuery({
      queryKey: portfolioKeys.positions(nextAddress),
      queryFn: () => fetchPortfolioData(nextAddress),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    // 📊 Data
    positions: data?.lpPositions || [],
    summary: data?.summary,
    metrics: portfolioMetrics,
    
    // 🔄 Status
    isLoading, // Initial loading
    isError,
    error,
    isFetching, // Background fetching
    isRefetching, // Manual refetch
    isEmpty: data?.lpPositions?.length === 0,
    
    // 🎯 Actions
    refresh,
    invalidateCache,
    prefetchAddress,
    
    // 📅 Metadata
    lastUpdated: dataUpdatedAt,
    isStale: Date.now() - dataUpdatedAt > 2 * 60 * 1000,
  };
}

// 🎯 Hook for global portfolio summary (across all addresses)
export function usePortfolioSummary() {
  const queryClient = useQueryClient();
  
  const allPortfolioData = queryClient.getQueriesData({
    queryKey: portfolioKeys.addresses(),
  });

  const globalSummary = useMemo(() => {
    let totalValue = 0;
    let totalPositions = 0;
    const allProtocols = new Set<string>();

    allPortfolioData.forEach(([, data]) => {
      if (data?.lpPositions) {
        totalValue += data.lpPositions.reduce((sum: number, pos: Position) => sum + (pos.valueUSD || 0), 0);
        totalPositions += data.lpPositions.length;
        data.lpPositions.forEach((pos: Position) => allProtocols.add(pos.protocol));
      }
    });

    return {
      totalValue,
      totalPositions,
      totalProtocols: allProtocols.size,
      totalAddresses: allPortfolioData.length,
    };
  }, [allPortfolioData]);

  return globalSummary;
}