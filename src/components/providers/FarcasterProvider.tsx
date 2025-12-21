'use client'

import { ReactNode, useEffect, useState } from 'react'
import sdk from '@farcaster/miniapp-sdk'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [context, setContext] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Call ready() immediately and synchronously
    sdk.actions.ready()
    setIsReady(true)
    console.log('✅ sdk.actions.ready() called')

    // Load context asynchronously
    sdk.context
      .then((ctx) => {
        setContext(ctx)
        console.log('Farcaster context loaded:', ctx)
      })
      .catch((err) => {
        console.warn('Context not available:', err)
      })
  }, [])

  return <>{children}</>
}
