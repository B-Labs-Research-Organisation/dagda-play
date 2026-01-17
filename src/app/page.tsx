'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { EmeraldFlipGame } from '@/components/games/EmeraldFlipGame'
import { DagdasCauldronGame } from '@/components/games/DagdasCauldronGame'
import { BalanceManager } from '@/lib/BalanceManager'
import { LimitManager } from '@/lib/LimitManager'
import { FarcasterAuth } from '@/components/auth/FarcasterAuth'

type GameType = 'emerald-flip' | 'dagdas-cauldron' | null

export default function Home() {
  const { address, isConnected } = useAccount()
  const [currentGame, setCurrentGame] = useState<GameType>(null)
  const [balance, setBalance] = useState(50) // Starting balance
  const [dailyLimits, setDailyLimits] = useState({
    'emerald-flip': { remaining: 20, resetsIn: '24h 0m' },
    'dagdas-cauldron': { remaining: 20, resetsIn: '24h 0m' }
  })
  const [isFarcasterUser, setIsFarcasterUser] = useState(false)
  const [farcasterProfile, setFarcasterProfile] = useState<{ fid?: number; username?: string; displayName?: string } | null>(null)

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  const loadUserData = useCallback(async () => {
    try {
      // Use wallet address OR FARCaster FID as user ID
      let userId: string
      let username: string

      if (address) {
        userId = address.toLowerCase()
        username = `Player_${address.slice(0, 6)}`
      } else if (farcasterProfile?.fid) {
        userId = `fid-${farcasterProfile.fid}`
        username = farcasterProfile.username || `User-${farcasterProfile.fid}`
      } else {
        return // No user ID available
      }

      const userBalance = await balanceManager.getBalance(userId, username)
      setBalance(userBalance)

      const emeraldFlipLimit = await limitManager.checkLimit(userId, username, 'emerald-flip')
      const dagdasCauldronLimit = await limitManager.checkLimit(userId, username, 'dagdas-cauldron')

      setDailyLimits({
        'emerald-flip': { remaining: emeraldFlipLimit.playsRemaining, resetsIn: emeraldFlipLimit.resetsIn },
        'dagdas-cauldron': { remaining: dagdasCauldronLimit.playsRemaining, resetsIn: dagdasCauldronLimit.resetsIn }
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [address, farcasterProfile])

  useEffect(() => {
    if (isConnected && address) {
      // Load user balance and limits for wallet users
      loadUserData()
    }
    // Note: Don't auto-load for FARCaster users here - it's handled in handleFarcasterAuth
  }, [isConnected, address, loadUserData])

  const handleFarcasterAuth = async (profile: { fid: number; username: string; displayName: string }) => {
    console.log('Farcaster auth successful:', profile)
    setIsFarcasterUser(true)
    setFarcasterProfile(profile)

    // Apply FARCaster incentives with the profile data
    await applyFarcasterIncentives(profile)
    
    // Load user data to sync with database (this should respect the FARCaster bonus we just applied)
    await loadUserDataForFarcaster(profile)
  }

  const loadUserDataForFarcaster = async (profile: { fid: number; username: string; displayName: string }) => {
    try {
      const userId = `fid-${profile.fid}`
      const username = profile.username || `User-${profile.fid}`

      // Get balance (should now be 75 after bonus)
      const userBalance = await balanceManager.getBalance(userId, username)
      setBalance(userBalance)

      // For FARCaster users, always set 25 plays (don't load from database)
      setDailyLimits({
        'emerald-flip': { remaining: 25, resetsIn: '24h 0m' },
        'dagdas-cauldron': { remaining: 25, resetsIn: '24h 0m' }
      })
    } catch (error) {
      console.error('Error loading FARCaster user data:', error)
    }
  }

  const applyFarcasterIncentives = async (profile?: { fid?: number; username?: string; displayName?: string }) => {
    try {
      // Use the passed profile or fallback to state
      const farcasterData = profile || farcasterProfile
      
      // Use wallet address OR FARCaster FID as user ID
      let userId: string
      let username: string

      if (address) {
        userId = address.toLowerCase()
        username = farcasterData?.username || `Player_${address.slice(0, 6)}`
      } else if (farcasterData?.fid) {
        userId = `fid-${farcasterData.fid}`
        username = farcasterData.username || `User-${farcasterData.fid}`
      } else {
        console.log('No user ID available for FARCaster incentives')
        return // No user ID available
      }

      console.log('Applying FARCaster incentives for:', { userId, username })

      // Give FARCaster users bonus PIE (75 total: 50 starting + 25 bonus)
      const currentBalance = await balanceManager.getBalance(userId, username)
      console.log('Current balance:', currentBalance)

      if (currentBalance === 50) { // Only if it's the starting balance
        await balanceManager.updateBalance(userId, username, 25) // +25 bonus PIE
        setBalance(75) // Update local state to 75 PIE total
        console.log('✅ Bonus applied: 75 PIE total')
      } else {
        // If user already has a balance, just set it
        setBalance(currentBalance)
      }

      // Update limits for FARCaster users (25 plays instead of 20)
      setDailyLimits({
        'emerald-flip': { remaining: 25, resetsIn: '24h 0m' },
        'dagdas-cauldron': { remaining: 25, resetsIn: '24h 0m' }
      })
      console.log('✅ FARCaster limits applied: 25 plays each')
    } catch (error) {
      console.error('Error applying FARCaster incentives:', error)
    }
  }

  const handleGameComplete = async () => {
    // Refresh user data after game completion
    await loadUserData()
    setCurrentGame(null)
  }

  // Show welcome screen if not connected via wallet AND not authenticated via FARCaster
  if (!isConnected && !isFarcasterUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="text-center p-8 rounded-xl border max-w-md"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            boxShadow: '0 4px 6px var(--shadow)'
          }}
        >
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--card-text)' }}>
            🏰 Welcome to Dagda Play
          </h2>
          <p className="mb-8" style={{ color: 'var(--foreground)' }}>
            Connect your wallet or Farcaster to start playing!
          </p>

          {/* FARCaster Auth Option */}
          <div className="mb-6">
            <FarcasterAuth onAuth={handleFarcasterAuth} />
          </div>

          <div className="text-sm space-y-2" style={{ color: 'var(--text-muted)' }}>
            <p>🎮 Play games • 🪙 Earn PIE Points • 🏆 Collect achievements</p>
            <p style={{ color: 'var(--accent-yellow)' }} className="font-semibold">
              ✨ FARCaster users get +25 bonus PIE and 25 plays/day!
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (currentGame === 'emerald-flip') {
    return <EmeraldFlipGame onComplete={handleGameComplete} balance={balance} farcasterProfile={farcasterProfile} />
  }

  if (currentGame === 'dagdas-cauldron') {
    return <DagdasCauldronGame onComplete={handleGameComplete} balance={balance} farcasterProfile={farcasterProfile} />
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            🏰 Welcome to Dagda Play
          </h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--text-muted)' }}>
            Play Celtic-themed games and earn PIE tokens!
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          <div 
            className="rounded-xl p-6 text-center"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 4px 6px var(--shadow)'
            }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--card-text)' }}>💰 {balance}</div>
            <div style={{ color: 'var(--text-muted)' }}>PIE Balance</div>
          </div>

          <div 
            className="rounded-xl p-6 text-center"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 4px 6px var(--shadow)'
            }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--card-text)' }}>
              🪙 {dailyLimits['emerald-flip'].remaining}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Emerald Flip Plays Left</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
              Resets in: {dailyLimits['emerald-flip'].resetsIn}
            </div>
          </div>

          <div 
            className="rounded-xl p-6 text-center"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 4px 6px var(--shadow)'
            }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--card-text)' }}>
              🎲 {dailyLimits['dagdas-cauldron'].remaining}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Dagda's Cauldron Plays Left</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
              Resets in: {dailyLimits['dagdas-cauldron'].resetsIn}
            </div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Emerald Flip Game */}
          <div 
            className="rounded-xl p-8 text-center transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 4px 6px var(--shadow)'
            }}
          >
            <div className="flex justify-center mb-4">
              <img src="/games/emerald-flip/coin-heads.png" alt="Emerald Flip Coin" className="w-24 h-24 object-contain" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--card-text)' }}>Emerald Flip</h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              Flip the enchanted emerald coin! Choose heads or tails and win up to 25 PIE per flip!
            </p>
            <button
              onClick={() => setCurrentGame('emerald-flip')}
              disabled={dailyLimits['emerald-flip'].remaining === 0}
              className="w-full py-4 px-8 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none"
            >
              {dailyLimits['emerald-flip'].remaining === 0 ? 'Daily Limit Reached' : 'Play Emerald Flip'}
            </button>
          </div>

          {/* Dagda's Cauldron Game */}
          <div 
            className="rounded-xl p-8 text-center transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 4px 6px var(--shadow)'
            }}
          >
            <div className="flex justify-center mb-4">
              <img src="/games/dagdas-cauldron/symbols/cauldron.png" alt="Dagda's Cauldron" className="w-24 h-24 object-contain" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--card-text)' }}>Dagda's Cauldron</h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              Spin the Celtic slot machine! Match symbols to win up to 25 PIE per spin!
            </p>
            <button
              onClick={() => setCurrentGame('dagdas-cauldron')}
              disabled={dailyLimits['dagdas-cauldron'].remaining === 0}
              className="w-full py-4 px-8 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none"
            >
              {dailyLimits['dagdas-cauldron'].remaining === 0 ? 'Daily Limit Reached' : 'Play Dagda\'s Cauldron'}
            </button>
          </div>
        </div>

        {/* Blockchain Features Preview */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>🔗 Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div 
              className="rounded-xl p-6"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: '0 4px 6px var(--shadow)'
              }}
            >
              <div className="text-3xl mb-3">🏆</div>
              <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--card-text)' }}>Achievement NFTs</h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Earn unique NFTs for your gaming milestones and achievements
              </p>
            </div>

            <div 
              className="rounded-xl p-6"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: '0 4px 6px var(--shadow)'
              }}
            >
              <div className="text-3xl mb-3">💎</div>
              <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--card-text)' }}>PIE Points</h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Earn PIE & get exclusive rewards
              </p>
            </div>

            <div 
              className="rounded-xl p-6"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: '0 4px 6px var(--shadow)'
              }}
            >
              <div className="text-3xl mb-3">🏅</div>
              <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--card-text)' }}>Leaderboards</h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Compete with other players on the global leaderboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
