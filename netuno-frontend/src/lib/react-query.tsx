'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Use useState to ensure QueryClient is created only once per component lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚀 PERFORMANCE: Cache data for 5 minutes
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
            
            // 🔄 Background refetch strategy
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
            
            // 🏃‍♂️ Retry strategy for failed requests
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry up to 3 times for network/server errors
              return failureCount < 3;
            },
            
            // 📊 Network mode
            networkMode: 'online',
          },
          mutations: {
            // 🎯 Mutation defaults
            retry: 1,
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 🔧 Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

// 🎯 Export singleton QueryClient for use in server components
export const getQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });