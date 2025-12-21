'use client'

import { ReactNode, useEffect, useState } from 'react'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [context, setContext] = useState<any>(null)
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [readyCalled, setReadyCalled] = useState<boolean>(false)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Dynamically import the SDK to avoid SSR issues
    import('@farcaster/miniapp-sdk')
      .then((module) => {
        const sdk = module.default
        
        console.log('Farcaster SDK loaded, calling ready()...')
        
        // Call ready() immediately - this is the critical call
        sdk.actions.ready()
        setReadyCalled(true)
        setSdkLoaded(true)
        console.log('✅ sdk.actions.ready() called successfully')

        // Load context asynchronously
        sdk.context
          .then((ctx: any) => {
            setContext(ctx)
            console.log('Farcaster context loaded:', ctx)
          })
          .catch((err: any) => {
            console.warn('Context not available:', err)
            setContext({ 
              mode: 'loaded', 
              warning: 'Context not available but ready() was called' 
            })
          })
      })
      .catch((err) => {
        // SDK not available - running as regular webapp
        console.log('Farcaster SDK not available - running as regular webapp')
        setContext({ mode: 'webapp', message: 'Running as standard web application' })
      })
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
              timestamp: new Date().toISOString()
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
