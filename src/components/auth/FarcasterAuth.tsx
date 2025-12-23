'use client'

import React, { useState, useEffect } from 'react'
import { useSignIn, useProfile, QRCode } from '@farcaster/auth-kit'

interface FarcasterAuthProps {
  onAuth: (profile: { fid: number; username: string; displayName: string }) => void
}

export function FarcasterAuth({ onAuth }: FarcasterAuthProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const { isAuthenticated, profile } = useProfile()
  
  // Use the signIn hook with callbacks
  const { signIn, url, isSuccess, isError } = useSignIn({
    onSuccess: (data: any) => {
      console.log('✅ Farcaster sign-in successful:', data)
    },
    onError: (error: any) => {
      console.error('❌ Farcaster sign-in error:', error)
      alert(`Farcaster authentication failed: ${error?.message || 'Unknown error'}`)
    }
  })

  // Handle authentication success via useProfile
  useEffect(() => {
    if (isAuthenticated && profile?.fid) {
      console.log('✅ Farcaster authenticated via profile:', profile)
      onAuth({
        fid: profile.fid,
        username: profile.username || `user-${profile.fid}`,
        displayName: profile.displayName || profile.username || `User ${profile.fid}`,
      })
    }
  }, [isAuthenticated, profile, onAuth])

  // Auto-generate sign-in URL when component mounts (for web users)
  useEffect(() => {
    if (!isMiniApp && !url && !isSuccess) {
      console.log('� Auto-generating Farcaster sign-in URL...')
      signIn()
    }
  }, [isMiniApp, url, isSuccess, signIn])

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
      <div className="mb-4">
        <h3 className="text-lg font-bold text-purple-300 mb-2">Sign in with Farcaster</h3>
        <p className="text-sm text-gray-400 mb-4">Scan this QR code with your phone</p>
      </div>

      {url ? (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCode uri={url} size={256} />
          </div>
          <p className="text-xs text-gray-400 mb-2">
            Open your Farcaster app and scan this code
          </p>
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-400 hover:text-purple-300 underline"
          >
            Or click here to sign in on mobile
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-gray-400">Generating QR code...</p>
        </div>
      )}

      <div className="mt-4 text-xs text-green-400">
        Get +5 bonus PIE and 5 plays/day!
      </div>
    </div>
  )
}
