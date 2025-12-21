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

  const handleFarcasterAuth = async () => {
    console.log('Opening Farcaster mini app...')
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

      // For web access, direct to Farcaster web app
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://dagda-play.vercel.app').replace(/\/$/, '')
      const farcasterWebUrl = `https://warpcast.com/~/frames/frame?url=${encodeURIComponent(baseUrl)}`
      console.log('Farcaster web URL:', farcasterWebUrl)

      // Open Farcaster web app in new tab
      window.open(farcasterWebUrl, '_blank')

      // Simulate successful connection (user will be authenticated in Farcaster)
      setTimeout(() => {
        onAuth({
          fid: 12345,
          username: 'farcaster-user',
          displayName: 'Farcaster User'
        })
        setIsAuthenticating(false)
      }, 2000)

    } catch (error) {
      console.error('Farcaster connection failed:', error)
      alert(`Failed to open Farcaster: ${error}`)
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
            Opening Farcaster...
          </>
        ) : (
          <>
            <span className="text-xl">🟣</span>
            Open in Farcaster
          </>
        )}
      </button>

      <div className="mt-3 text-xs text-green-400">
        Get +5 bonus PIE and 5 plays/day!
      </div>
    </div>
  )
}
