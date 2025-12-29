'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { CoinflipGame } from '@/components/games/CoinflipGame'
import { RandomizerGame } from '@/components/games/RandomizerGame'
import { BalanceManager } from '@/lib/BalanceManager'
import { LimitManager } from '@/lib/LimitManager'
import { FarcasterAuth } from '@/components/auth/FarcasterAuth'

type GameType = 'coinflip' | 'randomizer' | null

export default function Home() {
  const { address, isConnected } = useAccount()
  const [currentGame, setCurrentGame] = useState<GameType>(null)
  const [balance, setBalance] = useState(15) // Starting balance
  const [dailyLimits, setDailyLimits] = useState({
    coinflip: { remaining: 3, resetsIn: '24h 0m' },
    randomizer: { remaining: 3, resetsIn: '24h 0m' }
  })
  const [isFarcasterUser, setIsFarcasterUser] = useState(false)
  const [farcasterProfile, setFarcasterProfile] = useState<{ fid?: number; username?: string; displayName?: string } | null>(null)

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  const loadUserData = useCallback(async () => {
    try {
      // Use wallet address OR Farcaster FID as user ID
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

      const coinflipLimit = await limitManager.checkLimit(userId, username, 'coinflip')
      const randomizerLimit = await limitManager.checkLimit(userId, username, 'randomizer')

      setDailyLimits({
        coinflip: { remaining: coinflipLimit.playsRemaining, resetsIn: coinflipLimit.resetsIn },
        randomizer: { remaining: randomizerLimit.playsRemaining, resetsIn: randomizerLimit.resetsIn }
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
    // Note: Don't auto-load for Farcaster users here - it's handled in handleFarcasterAuth
  }, [isConnected, address, loadUserData])

  const handleFarcasterAuth = async (profile: { fid: number; username: string; displayName: string }) => {
    console.log('Farcaster auth successful:', profile)
    setIsFarcasterUser(true)
    setFarcasterProfile(profile)

    // Apply Farcaster incentives with the profile data
    await applyFarcasterIncentives(profile)
    
    // Load user data to sync with database (this should respect the Farcaster bonus we just applied)
    await loadUserDataForFarcaster(profile)
  }

  const loadUserDataForFarcaster = async (profile: { fid: number; username: string; displayName: string }) => {
    try {
      const userId = `fid-${profile.fid}`
      const username = profile.username || `User-${profile.fid}`

      // Get balance (should now be 25 after bonus)
      const userBalance = await balanceManager.getBalance(userId, username)
      setBalance(userBalance)

      // For Farcaster users, always set 5 plays (don't load from database)
      setDailyLimits({
        coinflip: { remaining: 5, resetsIn: '24h 0m' },
        randomizer: { remaining: 5, resetsIn: '24h 0m' }
      })
    } catch (error) {
      console.error('Error loading Farcaster user data:', error)
    }
  }

  const applyFarcasterIncentives = async (profile?: { fid?: number; username?: string; displayName?: string }) => {
    try {
      // Use the passed profile or fallback to state
      const farcasterData = profile || farcasterProfile
      
      // Use wallet address OR Farcaster FID as user ID
      let userId: string
      let username: string

      if (address) {
        userId = address.toLowerCase()
        username = farcasterData?.username || `Player_${address.slice(0, 6)}`
      } else if (farcasterData?.fid) {
        userId = `fid-${farcasterData.fid}`
        username = farcasterData.username || `User-${farcasterData.fid}`
      } else {
        console.log('No user ID available for Farcaster incentives')
        return // No user ID available
      }

      console.log('Applying Farcaster incentives for:', { userId, username })

      // Give Farcaster users bonus PIE (25 total: 15 starting + 10 bonus)
      const currentBalance = await balanceManager.getBalance(userId, username)
      console.log('Current balance:', currentBalance)
      
      if (currentBalance === 15) { // Only if it's the starting balance
        await balanceManager.updateBalance(userId, username, 10) // +10 bonus PIE
        setBalance(25) // Update local state to 25 PIE total
        console.log('✅ Bonus applied: 25 PIE total')
      } else {
        // If user already has a balance, just set it
        setBalance(currentBalance)
      }

      // Update limits for Farcaster users (5 plays instead of 3)
      setDailyLimits({
        coinflip: { remaining: 5, resetsIn: '24h 0m' },
        randomizer: { remaining: 5, resetsIn: '24h 0m' }
      })
      console.log('✅ Farcaster limits applied: 5 plays each')
    } catch (error) {
      console.error('Error applying Farcaster incentives:', error)
    }
  }

  const handleGameComplete = async () => {
    // Refresh user data after game completion
    await loadUserData()
    setCurrentGame(null)
  }

  // Show welcome screen if not connected via wallet AND not authenticated via Farcaster
  if (!isConnected && !isFarcasterUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 max-w-md">
          <h2 className="text-3xl font-bold text-green-100 mb-6">🏰 Welcome to Dagda Play</h2>
          <p className="text-green-200 mb-8">Connect your wallet to start playing!</p>

          {/* Farcaster Auth Option */}
          <div className="mb-6">
            <FarcasterAuth onAuth={handleFarcasterAuth} />
          </div>

          <div className="text-sm text-green-300 space-y-2">
            <p>🎮 Play games • 🪙 Earn PIE tokens • 🏆 Collect achievements</p>
            <p className="text-yellow-400 font-semibold">
              ✨ Farcaster users get +10 bonus PIE and 5 plays/day!
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (currentGame === 'coinflip') {
    return <CoinflipGame onComplete={handleGameComplete} balance={balance} farcasterProfile={farcasterProfile} />
  }

  if (currentGame === 'randomizer') {
    return <RandomizerGame onComplete={handleGameComplete} balance={balance} farcasterProfile={farcasterProfile} />
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-100 mb-4">
            🏰 Welcome to Dagda Play
          </h1>
          <p className="text-xl text-green-200">
            The Irish God of Games awaits your challenge!
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-6 text-center">
            <div className="text-3xl font-bold text-green-100 mb-2">💰 {balance}</div>
            <div className="text-green-300">PIE Balance</div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-6 text-center">
            <div className="text-3xl font-bold text-green-100 mb-2">
              🪙 {dailyLimits.coinflip.remaining}
            </div>
            <div className="text-green-300">Coinflip Plays Left</div>
            <div className="text-xs text-green-400 mt-1">
              Resets in: {dailyLimits.coinflip.resetsIn}
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-6 text-center">
            <div className="text-3xl font-bold text-green-100 mb-2">
              🎲 {dailyLimits.randomizer.remaining}
            </div>
            <div className="text-green-300">Randomizer Plays Left</div>
            <div className="text-xs text-green-400 mt-1">
              Resets in: {dailyLimits.randomizer.resetsIn}
            </div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Coinflip Game */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-8 text-center hover:border-green-500/50 transition-colors">
            <div className="text-6xl mb-4">🪙</div>
            <h2 className="text-2xl font-bold text-green-100 mb-4">Coinflip</h2>
            <p className="text-green-200 mb-6">
              Bet 5 PIE and guess heads or tails. Win 10 PIE if you're correct!
            </p>
            <button
              onClick={() => setCurrentGame('coinflip')}
              disabled={dailyLimits.coinflip.remaining === 0}
              className="w-full py-4 px-8 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none"
            >
              {dailyLimits.coinflip.remaining === 0 ? 'Daily Limit Reached' : 'Play Coinflip'}
            </button>
          </div>

          {/* Randomizer Game */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-8 text-center hover:border-green-500/50 transition-colors">
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-2xl font-bold text-green-100 mb-4">Randomizer</h2>
            <p className="text-green-200 mb-6">
              Try your luck! Win up to 10 PIE or lose up to 10 PIE in this thrilling game of chance.
            </p>
            <button
              onClick={() => setCurrentGame('randomizer')}
              disabled={dailyLimits.randomizer.remaining === 0}
              className="w-full py-4 px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none"
            >
              {dailyLimits.randomizer.remaining === 0 ? 'Daily Limit Reached' : 'Play Randomizer'}
            </button>
          </div>
        </div>

        {/* Blockchain Features Preview */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-green-100 mb-8">🔗 Coming Soon: Blockchain Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-6">
              <div className="text-3xl mb-3">🏆</div>
              <h4 className="text-lg font-bold text-green-100 mb-2">Achievement NFTs</h4>
              <p className="text-green-300 text-sm">
                Earn unique NFTs for your gaming milestones and achievements
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-6">
              <div className="text-3xl mb-3">💎</div>
              <h4 className="text-lg font-bold text-green-100 mb-2">PIE Token</h4>
              <p className="text-green-300 text-sm">
                Cash out your PIE earnings to your wallet as ERC-20 tokens
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-green-700/30 p-6">
              <div className="text-3xl mb-3">🏅</div>
              <h4 className="text-lg font-bold text-green-100 mb-2">Leaderboards</h4>
              <p className="text-green-300 text-sm">
                Compete with other players on the global leaderboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
