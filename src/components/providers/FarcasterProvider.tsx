'use client'

import { ReactNode, useEffect, useState } from 'react'
import sdk from '@farcaster/frame-sdk'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Add the frame to the user's client
        const context = await sdk.context
        setContext(context)
        
        console.log('Farcaster context:', context)

        // Signal to the frame that it's ready
        sdk.actions.ready()
        setIsReady(true)
        
        console.log('Farcaster Mini App initialized successfully')
      } catch (error) {
        console.error('Error initializing Farcaster:', error)
        // Even on error, call ready to dismiss the splash screen
        sdk.actions.ready()
        setIsReady(true)
        setContext({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    initializeFarcaster()
  }, [])

  // Show loading while initializing
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🏰</div>
          <div className="text-2xl font-bold text-green-100 mb-2">Loading Dagda Play</div>
          <div className="text-green-200">Initializing...</div>
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
          `
        }}
      />
    </>
  )
}
