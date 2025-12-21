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

        // Web context - use OAuth
        console.log('Web context detected, will use OAuth flow')
        setIsMiniApp(false)
      }
    }

    checkContext()

    // Also check after a delay to ensure SDK has loaded
    const timeoutId = setTimeout(checkContext, 2000)
    return () => clearTimeout(timeoutId)
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
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://dagda-play.vercel.app').replace(/\/$/, '') // Remove trailing slash
      const redirectUri = `${baseUrl}/api/auth/callback`
      const authUrl = `https://warpcast.com/~/sign-in-with-farcaster?client_id=${encodeURIComponent(baseUrl)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`
      console.log('OAuth URL:', authUrl)
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

      // Listen for auth completion via postMessage
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from our own domain
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'oauth_callback') {
          console.log('OAuth callback received:', event.data)
          window.removeEventListener('message', handleMessage)
          clearInterval(checkClosed)

          if (event.data.success) {
            // Simulate authentication success
            onAuth({
              fid: 12345, // This would come from the actual OAuth response
              username: 'oauth-user',
              displayName: 'OAuth User'
            })
          } else {
            console.error('OAuth failed:', event.data.error)
            alert(`Authentication failed: ${event.data.error}`)
          }

          setIsAuthenticating(false)
          popup.close()
        }
      }

      window.addEventListener('message', handleMessage)

      // Fallback: check if popup is closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', handleMessage)
          console.log('Auth popup closed without callback')
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
