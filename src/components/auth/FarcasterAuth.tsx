'use client'

import React, { useState, useEffect } from 'react'

interface FarcasterAuthProps {
  onAuth: (profile: { fid: number; username: string; displayName: string }) => void
}

export function FarcasterAuth({ onAuth }: FarcasterAuthProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)

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

  // Already authenticated in mini app
  if (isMiniApp) {
    return (
      <div className="text-center">
        <div className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2">
          <span className="text-xl">🟣</span>
          Connected to Farrrrcaster
        </div>
        <div className="mt-3 text-xs text-green-600">
          Playing as Farrrrcaster user - 5 plays/day!
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-purple-700 mb-2">Play in Farrrrcaster</h3>
        <p className="text-sm text-gray-600 mb-4">Get exclusive benefits when you play through Farrrrcaster!</p>
      </div>

      <div className="bg-white/80 rounded-xl border border-purple-200 shadow-lg p-6 mb-4">
        <div className="text-xl mb-3">🟣</div>
        <h4 className="text-lg font-bold text-purple-800 mb-3">Farrrrcaster Player Benefits</h4>
        <ul className="text-left text-sm text-gray-700 space-y-2 mb-4">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Start with 25 PIE (instead of 15)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>5 plays per day (instead of 3)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Automatic authentication</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Seamless gameplay</span>
          </li>
        </ul>

        <a 
          href="https://farcaster.xyz/miniapps/awTRIJ40JIaG/dagda-play"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🚀</span>
            <span>Open Dagda Play in Farrrrcaster</span>
          </div>
        </a>

        <p className="text-xs text-gray-500 mt-3">
          Opens as a Farrrrcaster mini-app • Instant access with your Farrrrcaster account
        </p>
      </div>

      <div className="text-xs text-gray-500">
        Or connect with a wallet above to play with standard benefits
      </div>
    </div>
  )
}
