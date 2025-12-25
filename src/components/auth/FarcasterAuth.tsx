'use client'

import React, { useState, useEffect } from 'react'
import { useSignIn, StatusAPIResponse } from '@farcaster/auth-kit'

interface FarcasterAuthProps {
  onAuth: (profile: { fid: number; username: string; displayName: string }) => void
}

export function FarcasterAuth({ onAuth }: FarcasterAuthProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)

  const {
    signIn,
    signOut,
    connect,
    reconnect,
    isSuccess,
    isError,
    error,
    channelToken,
    url,
    data,
    validSignature,
  } = useSignIn({
    onSuccess: (res: StatusAPIResponse) => {
      console.log('✅ Farcaster sign-in successful:', res)
      
      // Extract user data from response
      if (res.fid) {
        onAuth({
          fid: res.fid,
          username: res.username || `user-${res.fid}`,
          displayName: res.displayName || res.username || `User ${res.fid}`,
        })
      }
    },
    onError: (err?: Error) => {
      console.error('❌ Farcaster sign-in error:', err)
    },
  })

  // Check for mini app context
  useEffect(() => {
    const checkContext = () => {
      if (typeof window !== 'undefined') {
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
        }
      }
    }

    checkContext()
    const timeoutId = setTimeout(checkContext, 2000)
    return () => clearTimeout(timeoutId)
  }, [onAuth])

  // Trigger sign-in flow on mount for web users
  useEffect(() => {
    if (!isMiniApp && !url && !isSuccess && !channelToken) {
      console.log('🔄 Initiating Farcaster sign-in...')
      signIn()
    }
  }, [isMiniApp, url, isSuccess, channelToken, signIn])

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

  if (isSuccess && data) {
    return (
      <div className="text-center">
        <div className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2">
          <span className="text-xl">🟣</span>
          Connected as {data.username || `User ${data.fid}`}
        </div>
        <button
          onClick={signOut}
          className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-purple-300 mb-2">Sign in with Farcaster</h3>
        {url ? (
          <p className="text-sm text-gray-400 mb-4">Scan this QR code with your phone</p>
        ) : (
          <p className="text-sm text-gray-400 mb-4">Generating sign-in QR code...</p>
        )}
      </div>

      {url ? (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            {/* Use QR code API service to generate QR code from URL */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`}
              alt="Farcaster Sign-In QR Code" 
              className="w-64 h-64"
            />
          </div>
          <p className="text-xs text-gray-400 mb-2">
            Open Warpcast and scan this code to sign in
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
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-gray-400">Loading...</p>
          {isError && (
            <p className="text-xs text-red-400 mt-2">
              Error: {error?.message || 'Failed to initialize sign-in'}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-green-400">
        Get +10 bonus PIE and 5 plays/day with Farcaster!
      </div>

      {channelToken && (
        <div className="mt-2 text-xs text-gray-500">
          Waiting for authentication...
        </div>
      )}
    </div>
  )
}
