// frontend/src/providers/web3-provider.tsx
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';

// Create a singleton config
let configInstance: ReturnType<typeof getDefaultConfig> | null = null;

const getConfig = () => {
  if (!configInstance) {
    configInstance = getDefaultConfig({
      appName: 'AI Lawsuit Bot',
      projectId: '047251bb52ea479649e88fe590abe365', // Get from https://cloud.walletconnect.com
      chains: [baseSepolia],
      ssr: false,
    });
  }
  return configInstance;
};

// Create a singleton query client
let queryClientInstance: QueryClient | null = null;

const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    });
  }
  return queryClientInstance;
};

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Use useMemo to ensure config and queryClient are stable across renders
  const config = useMemo(() => getConfig(), []);
  const queryClient = useMemo(() => getQueryClient(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#0052ff',
            accentColorForeground: 'white',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}