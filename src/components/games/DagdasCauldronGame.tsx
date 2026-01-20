'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { BalanceManager } from '@/lib/BalanceManager'
import { LimitManager } from '@/lib/LimitManager'
import { GameEngine, type GameState, type BetMultiplier, type GameResult } from '@/lib/GameEngine'
import { GameHistoryManager, type GameType } from '@/lib/GameHistoryManager'
import { type Symbol } from '@/lib/SymbolManager'

interface DagdasCauldronGameProps {
  onComplete: () => void
  balance: number
  farcasterProfile?: { fid?: number; username?: string } | null
}

interface FloatingSymbol {
  id: number
  symbol: Symbol
  x: number
  y: number
  rotation: number
  speed: number
  direction: number
  size: number
  opacity: number
}

export function DagdasCauldronGame({ onComplete, balance, farcasterProfile }: DagdasCauldronGameProps) {
  const { address } = useAccount()
  const [gameState, setGameState] = useState<GameState>('ready')
  const [isStirring, setIsStirring] = useState(false)
  const [floatingSymbols, setFloatingSymbols] = useState<FloatingSymbol[]>([])
  const [resultSymbols, setResultSymbols] = useState<Symbol[]>([])
  const [newBalance, setNewBalance] = useState(balance)
  const [message, setMessage] = useState('')
  const [betMultiplier, setBetMultiplier] = useState<BetMultiplier>(1)
  const [userStats, setUserStats] = useState<{ totalPlays: number; totalWins: number; winRate: number }>({ totalPlays: 0, totalWins: 0, winRate: 0 })
  const [showStats, setShowStats] = useState(false)
  const [runningTotal, setRunningTotal] = useState(0)
  const [initialResult, setInitialResult] = useState<GameResult | null>(null)
  const [nudgeCount, setNudgeCount] = useState(0)
  const [totalWinnings, setTotalWinnings] = useState(0)
  const [isCollecting, setIsCollecting] = useState(false)

  const gameEngine = useRef(new GameEngine())
  const balanceManager = useRef(new BalanceManager())
  const limitManager = useRef(new LimitManager())
  const historyManager = useRef(new GameHistoryManager())
  const stirAnimationRef = useRef<number | null>(null)

  // Initialize history manager
  useEffect(() => {
    historyManager.current.loadHistory()
  }, [])

  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      if (stirAnimationRef.current) cancelAnimationFrame(stirAnimationRef.current)
    }
  }, [])

  // Update user stats when game state changes
  useEffect(() => {
    const stats = gameEngine.current.getStats()
    setUserStats({
      totalPlays: stats.totalPlays,
      totalWins: stats.totalWins,
      winRate: gameEngine.current.getWinRate()
    })
  }, [gameState])

  const initializeFloatingSymbols = (count: number = 15): FloatingSymbol[] => {
    const symbols: FloatingSymbol[] = []
    const cauldronWidth = 400
    const cauldronHeight = 300
    const centerX = cauldronWidth / 2
    const centerY = cauldronHeight / 2
    const allSymbols = gameEngine.current.getAllSymbols()

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const radius = 80 + Math.random() * 40
      const symbol = allSymbols[Math.floor(Math.random() * allSymbols.length)]
      
      symbols.push({
        id: i,
        symbol: symbol,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        rotation: Math.random() * 360,
        speed: 2 + Math.random() * 3,
        direction: Math.random() > 0.5 ? 1 : -1,
        size: 60 + Math.random() * 30, // Increased size
        opacity: 1
      })
    }
    return symbols
  }

  const startStirring = async () => {
    try {
      if (gameState !== 'ready') return

      // Get user ID from wallet OR Farcaster
      let userId: string
      let username: string

      if (address) {
        userId = address.toLowerCase()
        username = `Player_${address.slice(0, 6)}`
      } else if (farcasterProfile?.fid) {
        userId = `fid-${farcasterProfile.fid}`
        username = farcasterProfile.username || `User-${farcasterProfile.fid}`
      } else {
        setMessage('Please connect your wallet or sign in with Farcaster first.')
        return
      }

      // Check daily limits
      const isFarcasterUser = !!farcasterProfile?.fid
      const limitCheck = await limitManager.current.checkAndUpdateLimit(userId, username, 'dagdas-cauldron', isFarcasterUser)
      if (!limitCheck.canPlay) {
        setMessage(`Daily limit reached! Resets in: ${limitCheck.resetsIn}`)
        return
      }

      // Check balance
      const betAmount = 5 * betMultiplier
      if (balance < betAmount) {
        setMessage(`Insufficient PIE balance! Need at least ${betAmount} PIE for this bet.`)
        return
      }

      // Start game
      setGameState('stirring')
      setIsStirring(true)
      setMessage('Stirring Dagda\'s magical cauldron...')

      // Initialize symbols
      const initialSymbols = initializeFloatingSymbols()
      setFloatingSymbols(initialSymbols)

      // Start the game engine
      gameEngine.current.startGame(betMultiplier)
      const result = gameEngine.current.getResult()
      if (result) {
        setResultSymbols(result.symbols)
      }

      // Animate stirring
      animateStirring(initialSymbols)

    } catch (error) {
      console.error('Error in startStirring:', error)
      setMessage('An error occurred while starting the game. Please try again.')
      setGameState('ready')
    }
  }

  const animateStirring = (initialSymbols: FloatingSymbol[]) => {
    const stirDuration = 5000 // Increased to 5 seconds
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / stirDuration, 1)
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setFloatingSymbols(prevSymbols =>
        prevSymbols.map((symbol, index) => {
          // Spiral movement that slows down
          const angle = (Math.PI * 2 * index) / prevSymbols.length + progress * 30 // Faster rotation
          const radius = 80 + Math.random() * 60 // Larger radius
          // Center coordinates adjusted to match cauldron center (400x400 container)
          const centerX = 200
          const centerY = 200
          
          return {
            ...symbol,
            x: centerX + Math.cos(angle) * radius * (1 - easeOut * 0.3), // Less reduction
            y: centerY + Math.sin(angle) * radius * (1 - easeOut * 0.3), // Less reduction
            rotation: symbol.rotation + symbol.speed * symbol.direction * (1 - easeOut * 0.5),
            opacity: 1 - easeOut * 0.7 // Less fade out
          }
        })
      )

      if (progress < 1) {
        stirAnimationRef.current = requestAnimationFrame(animate)
      } else {
        finishStirring()
      }
    }

    stirAnimationRef.current = requestAnimationFrame(animate)
  }

  const finishStirring = async () => {
    setIsStirring(false)

    // Get result from game engine
    const result = gameEngine.current.getResult()
    if (!result) return

    // Store initial result and set up running total
    setInitialResult(result)
    setRunningTotal(result.amount)
    setTotalWinnings(result.amount)
    setNudgeCount(0)

    // Create enhanced message with win amount
    let enhancedMessage = result.message
    if (result.isWin) {
      enhancedMessage = `${result.message} You won ${result.amount} PIE!`
    }
    setMessage(enhancedMessage)

    // Move to nudge state without updating balance yet
    setGameState('nudge')
  }

  const handleNudge = async (direction: 'left' | 'middle' | 'right') => {
    if (gameState !== 'nudge') return

    try {
      // Get user ID from wallet OR Farcaster
      let userId: string
      let username: string

      if (address) {
        userId = address.toLowerCase()
        username = `Player_${address.slice(0, 6)}`
      } else if (farcasterProfile?.fid) {
        userId = `fid-${farcasterProfile.fid}`
        username = farcasterProfile.username || `User-${farcasterProfile.fid}`
      } else {
        setMessage('Please connect your wallet or sign in with Farcaster first.')
        return
      }

      // Check if user can afford the nudge
      const nudgeInfo = gameEngine.current.getNudgeInfo()
      if (balance < nudgeInfo.cost) {
        setMessage(`Insufficient PIE balance! Need ${nudgeInfo.cost} PIE for a nudge.`)
        return
      }

      setMessage(`Nudging the cauldron ${direction}...`)

      // Apply nudge
      const nudgeResult = gameEngine.current.applyNudge(direction)
      if (!nudgeResult.success) {
        setMessage('No nudges remaining!')
        return
      }

      // Update symbols display
      setResultSymbols(nudgeResult.newSymbols)

      // Get updated result
      const result = gameEngine.current.getResult()
      if (!result) return

      // Update running total instead of balance immediately
      const newRunningTotal = runningTotal + nudgeResult.additionalWinnings
      const newTotalWinnings = totalWinnings + nudgeResult.additionalWinnings
      setRunningTotal(newRunningTotal)
      setTotalWinnings(newTotalWinnings)
      setNudgeCount(nudgeCount + 1)

      // Create enhanced message based on whether result improved
      let enhancedMessage: string
      if (nudgeResult.additionalWinnings > 0) {
        enhancedMessage = `Nudge improved your result! ${result.message} You won an additional ${nudgeResult.additionalWinnings} PIE!`
      } else if (result.isWin) {
        enhancedMessage = `Nudge applied! ${result.message} (No improvement - same winning combination)`
      } else {
        enhancedMessage = `Nudge applied! ${result.message}`
      }
      setMessage(enhancedMessage)

    } catch (error) {
      console.error('Error with nudge:', error)
      setMessage('An error occurred with the nudge. Please try again.')
    }
  }

  const handleBetMultiplier = (multiplier: BetMultiplier) => {
    setBetMultiplier(multiplier)
    gameEngine.current.setBetMultiplier(multiplier)
  }

  const resetGame = () => {
    setGameState('ready')
    setIsStirring(false)
    setFloatingSymbols([])
    setResultSymbols([])
    setMessage('')
    if (stirAnimationRef.current) {
      cancelAnimationFrame(stirAnimationRef.current)
      stirAnimationRef.current = null
    }
  }

  const completeGame = () => {
    gameEngine.current.completeGame()
    setGameState('complete')
    setMessage('Game completed! Click Play Again to try your luck once more.')
  }

  const collectWinnings = async () => {
    try {
      // Get user ID from wallet OR Farcaster
      let userId: string
      let username: string

      if (address) {
        userId = address.toLowerCase()
        username = `Player_${address.slice(0, 6)}`
      } else if (farcasterProfile?.fid) {
        userId = `fid-${farcasterProfile.fid}`
        username = farcasterProfile.username || `User-${farcasterProfile.fid}`
      } else {
        setMessage('Please connect your wallet or sign in with Farcaster first.')
        return
      }

      // Calculate total net winnings (winnings minus bet minus nudge costs)
      const betAmount = gameEngine.current.getBetAmount()
      const nudgeCosts = nudgeCount * 1 // 1 PIE per nudge
      const netWinnings = totalWinnings - betAmount - nudgeCosts

      // Update balance with total net winnings
      await balanceManager.current.updateBalance(userId, username, netWinnings)
        .then((updatedBalance) => {
          setNewBalance(updatedBalance)
          setIsCollecting(true)

          // Record final game history
          const finalResult = gameEngine.current.getResult()
          if (finalResult) {
            historyManager.current.addGameEntry({
              userId,
              username,
              gameType: 'dagdas-cauldron' as GameType,
              timestamp: Date.now(),
              betAmount: betAmount + nudgeCosts,
              symbols: finalResult.symbols,
              winnings: totalWinnings,
              netChange: netWinnings,
              isWin: totalWinnings > 0
            })
          }

          setMessage(`🎉 Dagda's bounty collected! You won a total of ${totalWinnings} PIE! Your new balance is ${updatedBalance} PIE.`)
          setGameState('complete')
        })
        .catch((error) => {
          console.error('Error collecting winnings:', error)
          setMessage('Error collecting winnings. Please try again.')
        })
    } catch (error) {
      console.error('Error with collecting winnings:', error)
      setMessage('An error occurred while collecting winnings. Please try again.')
    }
  }

  const backToMain = () => {
    resetGame()
    onComplete()
  }

  // Symbol to emoji mapping
  const symbolToEmoji: Record<Symbol, string> = {
    harp: '🎵',
    club: '🏏',
    cauldron: '🍲',
    wolfhound: '🐺',
    shamrock: '⚘'
  }

  const nudgeInfo = gameEngine.current.getNudgeInfo()
  const canNudge = gameEngine.current.canNudge()

  return (
    <div className="min-h-screen p-4 md:p-8" style={{
      backgroundColor: 'var(--background)',
      backgroundImage: 'var(--background-gradient)',
      color: 'var(--foreground)'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <button
              onClick={backToMain}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: 'var(--accent-green)'
              }}
            >
              ← Back to Games
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'var(--accent-purple)'
                }}
              >
                📊 Stats
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'var(--accent-green)'
                }}
              >
                🏰 Home
              </button>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            🍲 Dagda's Cauldron
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
            Stir the magical cauldron and test your luck with Celtic symbols!
          </p>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div 
            className="rounded-xl p-4 md:p-6 mb-6"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 4px 6px var(--shadow)'
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--card-text)' }}>{userStats.totalPlays}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Plays</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--card-text)' }}>{userStats.totalWins}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Wins</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--card-text)' }}>{userStats.winRate.toFixed(1)}%</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--card-text)' }}>{gameEngine.current.getStats().currentStreak}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div 
          className="rounded-xl p-4 md:p-6 mb-6"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: '0 4px 6px var(--shadow)'
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--card-text)' }}>
              Current Balance: {newBalance} PIE
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {gameState === 'ready' && 'Choose your bet and click stir to play!'}
              {gameState === 'stirring' && 'Stirring the magical cauldron...'}
              {gameState === 'result' && `New Balance: ${newBalance} PIE`}
              {gameState === 'nudge' && `Nudges remaining: ${nudgeInfo.remaining} (Cost: ${nudgeInfo.cost} PIE each)`}
              {gameState === 'complete' && 'Game completed!'}
            </div>
          </div>
        </div>

        {/* Bet Multiplier Selection */}
        {gameState === 'ready' && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => handleBetMultiplier(1)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                betMultiplier === 1 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              1x (5 PIE)
            </button>
            <button
              onClick={() => handleBetMultiplier(2)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                betMultiplier === 2 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              2x (10 PIE)
            </button>
            <button
              onClick={() => handleBetMultiplier(5)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                betMultiplier === 5 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              5x (25 PIE)
            </button>
          </div>
        )}

        {/* Game Board with Symbol Legend */}
        <div 
          className="rounded-xl p-4 md:p-8 mb-6"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: '0 4px 6px var(--shadow)',
            position: 'relative'
          }}
        >
          <div className="flex flex-col md:flex-row gap-6" style={{ position: 'relative', zIndex: 1 }}>
            {/* Cauldron Game Area */}
            <div
              className="flex-shrink-0"
              style={{
                width: '400px',
                height: '400px',
                position: 'relative',
                isolation: 'isolate'
              }}
            >
              {/* Cauldron Base Layer */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <img
                  src="/games/dagdas-cauldron/cauldron.png"
                  alt="Dagda's Cauldron"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Symbols Layer */}
              <div
                className="absolute inset-0"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 2,
                  overflow: 'visible'
                }}
              >
                {floatingSymbols.map((symbol) => (
                  <div
                    key={symbol.id}
                    className="absolute transition-all duration-50"
                    style={{
                      left: `${symbol.x - symbol.size/2}px`,
                      top: `${symbol.y - symbol.size/2}px`,
                      width: `${symbol.size}px`,
                      height: `${symbol.size}px`,
                      transform: `rotate(${symbol.rotation}deg)`,
                      opacity: symbol.opacity
                    }}
                  >
                    <img
                      src={`/games/dagdas-cauldron/symbols/${symbol.symbol}.png`}
                      alt={symbol.symbol}
                      className="w-full h-full object-contain"
                      style={{
                        filter: isStirring ? 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.7))' : 'none',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Result Symbols - Positioned in front with higher z-index */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-8" style={{ zIndex: 10 }}>
                {resultSymbols.map((symbol, index) => (
                  <div
                    key={index}
                    className={`w-28 h-28 rounded-xl border-4 flex items-center justify-center transition-all duration-700 ${
                      isStirring ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                    }`}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderColor: '#d4af37',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.9), 0 0 40px rgba(212, 175, 55, 0.5)',
                      zIndex: 10
                    }}
                  >
                    <img
                      src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                      alt={symbol}
                      className="w-24 h-24 object-contain"
                      style={{
                        filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 1))'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Symbol Legend - Vertical on the right */}
            <div className="flex-shrink-0 w-48">
              <h3 className="text-lg font-bold mb-3 text-center" style={{ color: 'var(--card-text)' }}>🎲 Symbol Values</h3>
              <div className="flex flex-col gap-2">
                {gameEngine.current.getAllSymbols().map((symbol) => (
                  <div key={symbol} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <img
                      src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                      alt={symbol}
                      className="w-8 h-8 object-contain"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: 'var(--card-text)' }}>{gameEngine.current.getSymbolValue(symbol)} PIE</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stir Button */}
        {gameState === 'ready' && (
          <div className="text-center mt-8">
            <button
              onClick={startStirring}
              className="px-8 py-4 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-xl"
              style={{
                background: 'linear-gradient(to right, var(--accent-purple), #7c3aed)',
                cursor: 'pointer'
              }}
            >
              🥄 STIR (Bet {5 * betMultiplier} PIE)
            </button>
          </div>
        )}

        {/* Nudge Controls */}
        {gameState === 'nudge' && (
          <div className="text-center mt-4">
            <p className="mb-2" style={{ color: 'var(--text-muted)' }}>
              You have {nudgeInfo.remaining} nudge{nudgeInfo.remaining !== 1 ? 's' : ''} remaining (Cost: {nudgeInfo.cost} PIE each)
            </p>
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => handleNudge('left')}
                disabled={!canNudge}
                className="px-6 py-3 text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                style={{ cursor: 'pointer' }}
              >
                <img src="/games/dagdas-cauldron/nudge-buttons.png" alt="Nudge Left" className="w-6 h-6 inline-block mr-2" />
                Nudge Left
              </button>
              <button
                onClick={() => handleNudge('middle')}
                disabled={!canNudge}
                className="px-6 py-3 text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                style={{ cursor: 'pointer' }}
              >
                <img src="/games/dagdas-cauldron/nudge-buttons.png" alt="Nudge Middle" className="w-6 h-6 inline-block mr-2 transform rotate-90" />
                Nudge Middle
              </button>
              <button
                onClick={() => handleNudge('right')}
                disabled={!canNudge}
                className="px-6 py-3 text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                style={{ cursor: 'pointer' }}
              >
                <img src="/games/dagdas-cauldron/nudge-buttons.png" alt="Nudge Right" className="w-6 h-6 inline-block mr-2 transform rotate-180" />
                Nudge Right
              </button>
            </div>
            <div className="flex justify-center gap-4">
              {totalWinnings > 0 && (
                <button
                  onClick={collectWinnings}
                  className="px-8 py-3 text-white font-bold rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--accent-purple)', cursor: 'pointer' }}
                >
                  🏆 Claim Your Bounty ({totalWinnings} PIE)
                </button>
              )}
              <button
                onClick={resetGame}
                className="px-8 py-3 text-white font-bold rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--accent-green)', cursor: 'pointer' }}
              >
                🎮 Play Again
              </button>
            </div>
          </div>
        )}

        {/* Result Message */}
        {message && (
          <div className={`text-center p-4 rounded-xl mt-4 ${
            message.includes('won') || message.includes('JACKPOT') || message.includes('Great win')
              ? 'bg-green-100 border border-green-300 text-green-800'
              : message.includes('lost') || message.includes('No win')
              ? 'bg-red-100 border border-red-300 text-red-800'
              : 'bg-blue-100 border border-blue-300 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Play Again Button */}
        {(gameState === 'complete' || gameState === 'result') && (
          <div className="text-center mt-8">
            <button
              onClick={resetGame}
              className="px-6 py-3 text-white font-bold rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent-green)' }}
            >
              Play Again
            </button>
          </div>
        )}

        {/* Game Rules */}
        <div
          className="mt-6 rounded-xl p-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--card-text)' }}>� How to Play</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <li>• Bet 5, 10, or 25 PIE to stir the cauldron</li>
            <li>• Watch symbols swirl and settle</li>
            <li>• Match 2 or 3 symbols to win</li>
            <li>• Use nudges to improve your result (max 3 per game)</li>
            <li>• Running total accumulates during nudges</li>
            <li>• Claim your bounty to collect all winnings at once</li>
            <li>• Win up to 125 PIE with the jackpot</li>
            <li>• 20 plays per day (25 for Farcaster users)</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes stirAnimation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .cauldron-stir-animation {
          animation: stirAnimation 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
