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
        <div 
          className="w-full py-3 px-6 text-white font-bold rounded-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to right, var(--accent-green), #16a34a)' }}
        >
          <span className="text-xl">🟣</span>
          Connected to Farcaster
        </div>
        <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          Playing as Farcaster user - 5 plays/day!
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--accent-purple)' }}>Play in Farcaster</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Get exclusive benefits when you play through Farcaster!
        </p>
      </div>

      <div 
        className="rounded-xl border p-6 mb-4"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          boxShadow: '0 4px 6px var(--shadow)'
        }}
      >
        <div className="text-xl mb-3">🟣</div>
        <h4 className="text-lg font-bold mb-3" style={{ color: 'var(--card-text)' }}>Farcaster Player Benefits</h4>
        <ul className="text-left text-sm space-y-2 mb-4" style={{ color: 'var(--text-muted)' }}>
          <li className="flex items-center gap-2">
            <span style={{ color: 'var(--accent-green)' }}>✓</span>
            <span>Start with 25 PIE (instead of 15)</span>
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: 'var(--accent-green)' }}>✓</span>
            <span>5 plays per day (instead of 3)</span>
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: 'var(--accent-green)' }}>✓</span>
            <span>Automatic authentication</span>
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: 'var(--accent-green)' }}>✓</span>
            <span>Seamless gameplay</span>
          </li>
        </ul>

        <a 
          href="https://farcaster.xyz/miniapps/awTRIJ40JIaG/dagda-play"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full py-3 px-6 text-white font-bold rounded-lg transition-all transform hover:scale-105"
          style={{ background: 'linear-gradient(to right, var(--accent-purple), #7c3aed)' }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🚀</span>
            <span>Open Dagda Play in Farcaster</span>
          </div>
        </a>

        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
          Opens as a Farcaster mini-app • Instant access with your Farcaster account
        </p>
      </div>

      <div className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        Or connect with a wallet above to play with standard benefits
      </div>
    </div>
  )
}
