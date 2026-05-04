/**
 * Web3Context - 지갑 연동 및 Web3 상태 관리
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Wagmi 설정
const config = getDefaultConfig({
  appName: 'WLD Lotto',
  projectId: process.env.VITE_WALLET_CONNECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// React Query 클라이언트
const queryClient = new QueryClient();

/**
 * Web3 컨텍스트 타입
 */
interface Web3ContextType {
  isConnected: boolean;
  address?: string;
  chainId?: number;
}

/**
 * Web3 컨텍스트 생성
 */
const Web3Context = createContext<Web3ContextType>({
  isConnected: false,
});

/**
 * Web3 Provider 컴포넌트
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Web3ContextProvider>{children}</Web3ContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Web3 컨텍스트 제공자
 */
function Web3ContextProvider({ children }: { children: ReactNode }) {
  return (
    <Web3Context.Provider
      value={{
        isConnected: false,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

/**
 * Web3 컨텍스트 훅
 */
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
}
