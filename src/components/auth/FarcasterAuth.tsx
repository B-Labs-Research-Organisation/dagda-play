'use client'

import React, { useState, useEffect } from 'react'

interface FarcasterAuthProps {
  onAuth: (profile: { fid: number; username: string; displayName: string }) => void
}

export function FarcasterAuth({ onAuth }: FarcasterAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isMiniApp, setIsMiniApp] = useState(false)

  useEffect(() => {
    // Check if we're in a mini app context
    const checkContext = () => {
      if (typeof window !== 'undefined') {
        const miniApp = (window as any).isFarcasterMiniApp
        setIsMiniApp(miniApp)

        // If we're in a mini app, user is already authenticated
        if (miniApp && (window as any).farcasterContext) {
          const context = (window as any).farcasterContext
          console.log('Mini app context found:', context)

          if (context.user) {
            onAuth({
              fid: context.user.fid || context.user.id || 1,
              username: context.user.username || context.user.name || 'miniapp-user',
              displayName: context.user.displayName || context.user.username || context.user.name || 'Mini App User'
            })
          }
        }
      }
    }

    checkContext()
  }, [onAuth])

  const handleFarcasterAuth = async () => {
    console.log('Starting Farcaster authentication...')
    setIsAuthenticating(true)

    try {
      // For mini apps, authentication is handled by Farcaster
      if (isMiniApp) {
        console.log('In mini app context - authentication should be automatic')
        // The useEffect above should handle authentication
        setTimeout(() => {
          setIsAuthenticating(false)
        }, 2000)
        return
      }

      // For web apps, try to open Farcaster auth
      console.log('In web context - attempting OAuth flow')

      // Try to open Farcaster auth popup
      const authUrl = `https://warpcast.com/~/sign-in-with-farcaster?client_id=${process.env.NEXT_PUBLIC_FARCASTER_APP_URL || 'http://localhost:3000'}`
      const popup = window.open(
        authUrl,
        'farcaster-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        alert('Please allow popups for Farcaster authentication')
        setIsAuthenticating(false)
        return
      }

      // Listen for auth completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          console.log('Auth popup closed')
          // In a real implementation, you'd check for auth tokens/callbacks
          setIsAuthenticating(false)
        }
      }, 1000)

    } catch (error) {
      console.error('Farcaster authentication failed:', error)
      alert(`Farcaster authentication failed: ${error}`)
      setIsAuthenticating(false)
    }
  }

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
        disabled={isAuthenticating}
        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-800 disabled:to-blue-800 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
      >
        {isAuthenticating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Connecting to Farcaster...
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
