'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'
import { WalletProvider } from '@/components/providers/WalletProvider'
import { FarcasterProvider } from '@/components/providers/FarcasterProvider'

// Create a client
const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <FarcasterProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            {children}
          </WalletProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </FarcasterProvider>
  )
}
