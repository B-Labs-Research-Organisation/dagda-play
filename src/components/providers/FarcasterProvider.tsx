'use client'

import { ReactNode, useEffect, useState } from 'react'
import sdk from '@farcaster/miniapp-sdk'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    // Call ready() IMMEDIATELY and synchronously
    sdk.actions.ready()
    console.log('Farcaster ready() called synchronously')

    const loadContext = async () => {
      try {
        const farcasterContext = await sdk.context
        setContext(farcasterContext)
        console.log('Farcaster context loaded:', farcasterContext)
      } catch (error) {
        console.error('Error fetching Farcaster context:', error)
        setContext({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    loadContext()
  }, [])

  // Don't block rendering - let the app load immediately
  return (
    <>
      {children}
      {/* Make context available globally */}
      {context && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.farcasterContext = ${JSON.stringify(context)};
            `
          }}
        />
      )}
    </>
  )
}
