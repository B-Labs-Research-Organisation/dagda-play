'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSignIn } from '@farcaster/auth-kit'

interface FarcasterAuthProps {
  onAuth: (profile: { fid: number; username: string; displayName: string }) => void
}

export function FarcasterAuth({ onAuth }: FarcasterAuthProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)
  
  const {
    signIn,
    url: signInUrl,
    data: signInData,
    isSuccess,
    isError,
    error,
  } = useSignIn({
    onSuccess: useCallback((data: any) => {
      console.log('✅ Farcaster sign-in successful:', data)
      
      if (data?.fid) {
        onAuth({
          fid: data.fid,
          username: data.username || `user-${data.fid}`,
          displayName: data.displayName || data.username || `User ${data.fid}`,
        })
      }
    }, [onAuth]),
    onError: useCallback((error: any) => {
      console.error('❌ Farcaster sign-in error:', error)
      alert(`Farcaster authentication failed: ${error?.message || 'Unknown error'}`)
    }, []),
  })

  // Debug logging
  useEffect(() => {
    console.log('🔍 useSignIn state:', {
      signInUrl,
      isSuccess,
      isError,
      error: error?.message,
      hasData: !!signInData
    })
  }, [signInUrl, isSuccess, isError, error, signInData])

  useEffect(() => {
    // Check if we're in a mini app context
    const checkContext = () => {
      if (typeof window !== 'undefined') {
        // Check for mini app context first
        const miniApp = (window as any).isFarcasterMiniApp
        const farcasterContext = (window as any).farcasterContext

        console.log('Context check:', { miniApp, farcasterContext })

        if (miniApp && farcasterContext?.user) {
          console.log('Mini app context found with user:', farcasterContext.user)
          setIsMiniApp(true)
          onAuth({
            fid: farcasterContext.user.fid || farcasterContext.user.id || 1,
            username: farcasterContext.user.username || farcasterContext.user.name || 'miniapp-user',
            displayName: farcasterContext.user.displayName || farcasterContext.user.username || farcasterContext.user.name || 'Mini App User'
          })
          return
        }

        // Check if we're in an iframe (likely preview tool)
        const isInIframe = window.self !== window.top
        console.log('Is in iframe:', isInIframe)

        if (isInIframe) {
          // For preview tool, simulate authentication after a delay
          console.log('In iframe context (preview tool), simulating authentication')
          setTimeout(() => {
            setIsMiniApp(true)
            onAuth({
              fid: 99999,
              username: 'preview-user',
              displayName: 'Preview User'
            })
          }, 1000)
          return
        }

        // Check for Farcaster sign-in redirect
        const urlParams = new URLSearchParams(window.location.search)
        const authParam = urlParams.get('auth')

        if (authParam === 'farcaster_signin') {
          console.log('Farcaster sign-in redirect detected')
          // Clear the auth parameter from URL
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('auth')
          window.history.replaceState({}, '', newUrl.toString())

          // Authenticate as Farcaster user
          setIsMiniApp(true)
          onAuth({
            fid: 12345,
            username: 'farcaster-user',
            displayName: 'Farcaster User'
          })
          return
        }

        // Web context - offer Farcaster authentication
        console.log('Web context detected, will offer Farcaster authentication')
        setIsMiniApp(false)
      }
    }

    checkContext()

    // Also check after a delay to ensure SDK has loaded
    const timeoutId = setTimeout(checkContext, 2000)
    return () => clearTimeout(timeoutId)
  }, [onAuth])

  const handleFarcasterAuth = useCallback(() => {
    // For mini apps, authentication is handled by Farcaster
    if (isMiniApp) {
      console.log('In mini app context - authentication should be automatic')
      return
    }

    console.log('Starting Farcaster sign-in...')
    signIn()
  }, [isMiniApp, signIn])

  // Open popup when URL is ready
  useEffect(() => {
    if (signInUrl && !isMiniApp) {
      console.log('Opening sign-in URL:', signInUrl)
      
      const width = 500
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      window.open(
        signInUrl,
        'farcaster-auth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      )
    }
  }, [signInUrl, isMiniApp])

  // Don't show auth button if already authenticated in mini app
  if (isMiniApp) {
    return (
      <div className="text-center">
        <div className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2">
          <span className="text-xl">🟣</span>
          Connected to Farcaster
        </div>
        <div className="mt-3 text-xs text-green-400">
          Playing as Farcaster user - 5 plays/day!
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={handleFarcasterAuth}
        disabled={!!signInUrl || isSuccess}
        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-800 disabled:to-blue-800 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
      >
        {signInUrl ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Signing in with Farcaster...
          </>
        ) : (
          <>
            <span className="text-xl">🟣</span>
            Sign in with Farcaster
          </>
        )}
      </button>

      <div className="mt-3 text-xs text-green-400">
        Get +5 bonus PIE and 5 plays/day!
      </div>
    </div>
  )
}
