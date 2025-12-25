'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [farcasterUser, setFarcasterUser] = useState<any>(null)

  // Check for Farcaster context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkFarcaster = () => {
        const isMiniApp = (window as any).isFarcasterMiniApp
        const farcasterContext = (window as any).farcasterContext
        
        if (isMiniApp && farcasterContext) {
          setFarcasterUser(farcasterContext.user)
        }
      }
      
      checkFarcaster()
      // Check periodically in case context loads later
      const interval = setInterval(checkFarcaster, 1000)
      return () => clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Wallet Connection Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-green-700/30 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-100">🏰 Dagda Play</h1>

          <div className="flex items-center gap-4">
            {farcasterUser ? (
              // Show Farcaster user (5 plays, 25 PIE)
              <div className="flex items-center gap-3">
                <span className="text-purple-300 text-sm flex items-center gap-2">
                  <span className="text-lg">🟣</span>
                  {farcasterUser.username || farcasterUser.displayName || `User ${farcasterUser.fid}`}
                </span>
              </div>
            ) : isConnected && address ? (
              // Show wallet user (3 plays, 15 PIE)
              <div className="flex items-center gap-3">
                <span className="text-green-200 text-sm">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              // Show connect wallet only if not Farcaster user
              <div className="flex gap-2">
                {connectors.slice(0, 1).map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    disabled={isPending}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
                  >
                    {isPending ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
