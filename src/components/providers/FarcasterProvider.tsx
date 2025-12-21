'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [context, setContext] = useState<any>(null)
  const readyCalledRef = useRef(false)

  useEffect(() => {
    console.log('🔍 FarcasterProvider useEffect running')
    console.log('🔍 Window exists:', typeof window !== 'undefined')
    
    if (readyCalledRef.current) {
      console.log('⚠️ ready() already called, skipping')
      return
    }

    // Try to dynamically import and call ready
    import('@farcaster/miniapp-sdk')
      .then((module) => {
        console.log('✅ SDK module loaded:', module)
        const sdk = module.default
        console.log('✅ SDK object:', sdk)
        console.log('✅ SDK.actions:', sdk?.actions)
        console.log('✅ SDK.actions.ready:', sdk?.actions?.ready)

        if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
          try {
            console.log('🚀 Calling sdk.actions.ready()...')
            sdk.actions.ready()
            readyCalledRef.current = true
            console.log('✅✅✅ sdk.actions.ready() CALLED SUCCESSFULLY')

            // Load context
            if (sdk.context) {
              sdk.context
                .then((ctx: any) => {
                  console.log('✅ Context loaded:', ctx)
                  setContext(ctx)
                })
                .catch((err: any) => {
                  console.warn('⚠️ Context not available:', err)
                })
            }
          } catch (error) {
            console.error('❌ ERROR calling ready():', error)
            console.error('❌ Error details:', JSON.stringify(error, null, 2))
          }
        } else {
          console.error('❌ SDK or SDK.actions.ready not available')
          console.error('❌ sdk:', sdk)
          console.error('❌ sdk.actions:', sdk?.actions)
        }
      })
      .catch((error) => {
        console.error('❌ Failed to load SDK:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
      })
  }, [])

  return <>{children}</>
}
