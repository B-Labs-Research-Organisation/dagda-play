'use client'

import { ReactNode, useMemo } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthKitProvider } from '@farcaster/auth-kit'
import { config } from '@/lib/wagmi'
import { WalletProvider } from '@/components/providers/WalletProvider'
import { FarcasterProvider } from '@/components/providers/FarcasterProvider'

// Create a client
const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Create AuthKit config dynamically on the client
  const authKitConfig = useMemo(() => {
    console.log('🔧 Creating AuthKit config:', {
      domain: window.location.host,
      siweUri: window.location.origin,
    })
    
    return {
      rpcUrl: 'https://mainnet.optimism.io',
      domain: window.location.host,
      siweUri: window.location.origin,
    }
  }, [])

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
