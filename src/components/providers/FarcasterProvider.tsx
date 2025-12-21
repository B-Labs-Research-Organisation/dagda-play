'use client'

import { ReactNode, useEffect, useState } from 'react'
import sdk from '@farcaster/miniapp-sdk'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [context, setContext] = useState<any>(null)
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [readyCalled, setReadyCalled] = useState<boolean>(false)

  useEffect(() => {
    // Call ready() SYNCHRONOUSLY - this is critical!
    try {
      console.log('Calling sdk.actions.ready() synchronously...')
      sdk.actions.ready()
      setReadyCalled(true)
      setSdkLoaded(true)
      console.log('✅ Farcaster ready() called successfully')
    } catch (readyError) {
      console.error('❌ Error calling ready():', readyError)
      setError(`Ready Error: ${readyError instanceof Error ? readyError.message : 'Unknown'}`)
    }

    // Load context asynchronously (after ready() is already called)
    const loadContext = async () => {
      try {
        const farcasterContext = await sdk.context
        setContext(farcasterContext)
        console.log('Farcaster context loaded:', farcasterContext)
      } catch (contextError) {
        console.error('Error loading Farcaster context:', contextError)
        setContext({ 
          error: contextError instanceof Error ? contextError.message : 'Unknown error',
          warning: 'Context not available, but ready() was called'
        })
      }
    }

    loadContext()
  }, [])

  // Don't block rendering - let the app load immediately
  return (
    <>
      {children}
      {/* Debug information */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.farcasterDebug = {
              sdkLoaded: ${sdkLoaded},
              readyCalled: ${readyCalled},
              contextLoaded: ${!!context},
              error: ${error ? JSON.stringify(error) : 'null'},
              timestamp: new Date().toISOString(),
              windowFarcaster: ${typeof window !== 'undefined' && (window as any).farcaster ? 'true' : 'false'}
            };
            console.log('Farcaster Debug:', window.farcasterDebug);
          `
        }}
      />
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
