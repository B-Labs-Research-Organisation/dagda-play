'use client'

import { ReactNode, useMemo, useState, useEffect } from 'react'
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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Create AuthKit config dynamically on the client
  const authKitConfig = useMemo(() => {
    if (!isClient) {
      // Return default config for SSR
      return {
        rpcUrl: 'https://mainnet.optimism.io',
        domain: 'dagda-play.vercel.app',
        siweUri: 'https://dagda-play.vercel.app',
        relay: 'https://relay.farcaster.xyz',
      }
    }

    const config = {
      rpcUrl: 'https://mainnet.optimism.io',
      domain: window.location.host,
      siweUri: window.location.origin,
      relay: 'https://relay.farcaster.xyz',
    }

    console.log('🔧 Creating AuthKit config:', config)
    
    return config
  }, [isClient])

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
