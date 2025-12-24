'use client'

import { ReactNode, useEffect, useState } from 'react'
import sdk from '@farcaster/miniapp-sdk'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    // Call ready() SYNCHRONOUSLY - this is critical!
    try {
      console.log('� Calling sdk.actions.ready() synchronously...')
      sdk.actions.ready()
      console.log('✅ sdk.actions.ready() called successfully')
    } catch (error) {
      console.error('❌ Error calling ready():', error)
    }

    // Load context asynchronously (after ready() is already called)
    const loadContext = async () => {
      try {
        const ctx = await sdk.context
        console.log('✅ Context loaded:', ctx)
        setContext(ctx)

        // Set global window properties
        if (typeof window !== 'undefined') {
          (window as any).isFarcasterMiniApp = true
          ;(window as any).farcasterContext = ctx
        }
      } catch (error) {
        console.warn('⚠️ Context not available (not in mini-app):', error)
        
        // Not in mini-app environment
        if (typeof window !== 'undefined') {
          (window as any).isFarcasterMiniApp = false
          ;(window as any).farcasterContext = null
        }
      }
    }

    loadContext()
  }, [])

  return <>{children}</>
}
