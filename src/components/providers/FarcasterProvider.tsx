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

    // Check if ready() was already called by the inline script
    if ((window as any).farcasterEarlyReady) {
      console.log('✅ ready() was already called by inline script')
      setReadyCalled(true)
      setSdkLoaded(true)
    }

    let sdk: any = null

    // Try to get the SDK - prioritize window.farcaster (injected by Farcaster client)
    if ((window as any).farcaster) {
      console.log('Using window.farcaster (injected by Farcaster client)')
      sdk = (window as any).farcaster
      
      // Call ready() if not already called
      if (!((window as any).farcasterEarlyReady) && sdk.actions?.ready) {
        try {
          console.log('Calling sdk.actions.ready() from FarcasterProvider...')
          sdk.actions.ready()
          setReadyCalled(true)
          setSdkLoaded(true)
          console.log('✅ Farcaster ready() called successfully')
        } catch (readyError) {
          console.error('❌ Error calling ready():', readyError)
          setError(`Ready Error: ${readyError instanceof Error ? readyError.message : 'Unknown'}`)
        }
      }
    } else {
      // Not in Farcaster context - this is a regular webapp
      console.log('Not in Farcaster context - running as regular webapp')
      setSdkLoaded(false)
      setContext({ mode: 'webapp', message: 'Running as standard web application' })
      return
    }

    // Load context asynchronously (after ready() is already called)
    if (sdk) {
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
    }
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
