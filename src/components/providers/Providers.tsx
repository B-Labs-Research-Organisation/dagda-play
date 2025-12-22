'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthKitProvider } from '@farcaster/auth-kit'
import { config } from '@/lib/wagmi'
import { WalletProvider } from '@/components/providers/WalletProvider'
import { FarcasterProvider } from '@/components/providers/FarcasterProvider'

// Create a client
const queryClient = new QueryClient()

// AuthKit configuration
const authKitConfig = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: typeof window !== 'undefined' ? window.location.host : 'dagda-play.vercel.app',
  siweUri: typeof window !== 'undefined' ? window.location.origin : 'https://dagda-play.vercel.app',
}

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <FarcasterProvider>
      <AuthKitProvider config={authKitConfig}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <WalletProvider>
              {children}
            </WalletProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </AuthKitProvider>
    </FarcasterProvider>
  )
}
