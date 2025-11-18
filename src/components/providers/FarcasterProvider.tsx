'use client'

import { ReactNode, useEffect, useState } from 'react'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null)
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    const detectContext = () => {
      try {
        // Check if we're in a Farcaster mini app
        const urlParams = new URLSearchParams(window.location.search)
        const hasFarcasterParams = urlParams.has('farcaster') || urlParams.has('miniapp')
        const isEmbedded = window.parent !== window
        const hasMiniAppSDK = typeof window !== 'undefined' && (window as any).farcaster

        const detectedAsMiniApp = hasFarcasterParams || isEmbedded || hasMiniAppSDK

        console.log('Context detection:', {
          hasFarcasterParams,
          isEmbedded,
          hasMiniAppSDK,
          detectedAsMiniApp
        })

        setIsMiniApp(detectedAsMiniApp)

        if (detectedAsMiniApp) {
          // Try to initialize mini app
          initializeMiniApp()
        } else {
          // Regular web app - ready immediately
          setContext({ type: 'web' })
        }
      } catch (error) {
        console.error('Error detecting context:', error)
        setIsMiniApp(false)
        setContext({ type: 'web' })
      }
    }

    const initializeMiniApp = async () => {
      try {
        // Check if mini app SDK is available
        if (typeof window !== 'undefined' && (window as any).farcaster) {
          const sdk = (window as any).farcaster

          // Initialize if available
          if (sdk.init) await sdk.init()
          if (sdk.context) {
            const miniAppContext = await sdk.context
            setContext({ ...miniAppContext, type: 'miniapp' })
          }

          // Signal ready
          if (sdk.actions && sdk.actions.ready) {
            await sdk.actions.ready()
          }

          console.log('Farcaster Mini App initialized successfully')
        } else {
          // Fallback: simulate mini app context
          console.log('Mini app SDK not available, using fallback')
          setContext({
            type: 'miniapp',
            user: { fid: 1, username: 'miniapp-user' },
            fallback: true
          })
        }
      } catch (error) {
        console.error('Mini app initialization failed:', error)
        // Still set as mini app but with error context
        setContext({
          type: 'miniapp',
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: true
        })
      }
    }

    detectContext()
  }, [])

  // Show loading while detecting context
  if (isMiniApp === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🏰</div>
          <div className="text-2xl font-bold text-green-100 mb-2">Loading Dagda Play</div>
          <div className="text-green-200">Detecting environment...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      {/* Make context available globally */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.farcasterContext = ${JSON.stringify(context)};
            window.isFarcasterMiniApp = ${isMiniApp};
          `
        }}
      />
    </>
  )
}
