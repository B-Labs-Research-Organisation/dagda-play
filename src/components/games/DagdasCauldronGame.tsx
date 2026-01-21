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
        size: 60 + Math.random() * 30,
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
    const stirDuration = 5000
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / stirDuration, 1)
      
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setFloatingSymbols(prevSymbols =>
        prevSymbols.map((symbol, index) => {
          const angle = (Math.PI * 2 * index) / prevSymbols.length + progress * 30
          const radius = 80 + Math.random() * 60
          const centerX = 200
          const centerY = 200
          
          return {
            ...symbol,
            x: centerX + Math.cos(angle) * radius * (1 - easeOut * 0.3),
            y: centerY + Math.sin(angle) * radius * (1 - easeOut * 0.3),
            rotation: symbol.rotation + symbol.speed * symbol.direction * (1 - easeOut * 0.5),
            opacity: 1 - easeOut * 0.7
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

    const result = gameEngine.current.getResult()
    if (!result) return

    setInitialResult(result)
    setRunningTotal(result.amount)
    setTotalWinnings(result.amount)
    setNudgeCount(0)

    let enhancedMessage = result.message
    if (result.isWin) {
      enhancedMessage = `${result.message} You won ${result.amount} PIE!`
    }
    setMessage(enhancedMessage)

    setGameState('nudge')
  }

  const handleNudge = async (direction: 'left' | 'middle' | 'right') => {
    if (gameState !== 'nudge') return

    try {
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

      const nudgeInfo = gameEngine.current.getNudgeInfo()
      if (balance < nudgeInfo.cost) {
        setMessage(`Insufficient PIE balance! Need ${nudgeInfo.cost} PIE for a nudge.`)
        return
      }

      setMessage(`Nudging the cauldron ${direction}...`)

      const nudgeResult = gameEngine.current.applyNudge(direction)
      if (!nudgeResult.success) {
        setMessage('No nudges remaining!')
        return
      }

      setResultSymbols(nudgeResult.newSymbols)

      const result = gameEngine.current.getResult()
      if (!result) return

      const newRunningTotal = runningTotal + nudgeResult.additionalWinnings
      const newTotalWinnings = totalWinnings + nudgeResult.additionalWinnings
      setRunningTotal(newRunningTotal)
      setTotalWinnings(newTotalWinnings)
      setNudgeCount(nudgeCount + 1)

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

      const betAmount = gameEngine.current.getBetAmount()
      const nudgeCosts = nudgeCount * 1
      const netWinnings = totalWinnings - betAmount - nudgeCosts

      await balanceManager.current.updateBalance(userId, username, netWinnings)
        .then((updatedBalance) => {
          setNewBalance(updatedBalance)
          setIsCollecting(true)

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

  const nudgeInfo = gameEngine.current.getNudgeInfo()
  const canNudge = gameEngine.current.canNudge()

  return (
    <div className="min-h-screen p-2 md:p-4" style={{
      backgroundColor: 'var(--background)',
      backgroundImage: 'var(--background-gradient)',
      color: 'var(--foreground)'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <button
            onClick={backToMain}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors info-card-compact"
            style={{ color: 'var(--accent-green)' }}
          >
            ← Back
          </button>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            🍲 Dagda's Cauldron
          </h1>
          <button
            onClick={() => window.location.href = '/'}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors info-card-compact"
            style={{ color: 'var(--accent-green)' }}
          >
            🏰 Home
          </button>
        </div>

        {/* Three Column Grid Layout */}
        <div className="cauldron-game-container">
          {/* LEFT SIDEBAR - Info & Stats */}
          <div className="space-compact">
            {/* Balance Card */}
            <div className="info-card-compact">
              <div className="text-center">
                <div className="text-xs text-responsive-sm mb-1" style={{ color: 'var(--text-muted)' }}>Balance</div>
                <div className="text-lg md:text-xl font-bold" style={{ color: 'var(--card-text)' }}>
                  {newBalance} PIE
                </div>
              </div>
            </div>

            {/* Game Status */}
            <div className="info-card-compact">
              <div className="text-xs text-responsive-sm text-center" style={{ color: 'var(--text-muted)' }}>
                {gameState === 'ready' && 'Choose bet & stir!'}
                {gameState === 'stirring' && 'Stirring...'}
                {gameState === 'result' && `Balance: ${newBalance} PIE`}
                {gameState === 'nudge' && `Nudges: ${nudgeInfo.remaining}`}
                {gameState === 'complete' && 'Completed!'}
              </div>
            </div>

            {/* Stats Toggle & Display */}
            <div className="info-card-compact">
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full text-xs text-responsive-sm font-bold mb-2"
                style={{ color: 'var(--accent-purple)' }}
              >
                📊 {showStats ? 'Hide' : 'Show'} Stats
              </button>
              {showStats && (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Plays:</span>
                    <span style={{ color: 'var(--card-text)' }} className="font-bold">{userStats.totalPlays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Wins:</span>
                    <span style={{ color: 'var(--card-text)' }} className="font-bold">{userStats.totalWins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Win Rate:</span>
                    <span style={{ color: 'var(--card-text)' }} className="font-bold">{userStats.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Streak:</span>
                    <span style={{ color: 'var(--card-text)' }} className="font-bold">{gameEngine.current.getStats().currentStreak}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bet Multiplier - Left Sidebar on Desktop */}
            {gameState === 'ready' && (
              <div className="hidden md:block info-card-compact space-compact">
                <div className="text-xs font-bold mb-2 text-center" style={{ color: 'var(--card-text)' }}>Bet Size</div>
                <button
                  onClick={() => handleBetMultiplier(1)}
                  className={`w-full px-2 py-1.5 text-xs rounded transition-colors mb-1 ${
                    betMultiplier === 1 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  1x (5 PIE)
                </button>
                <button
                  onClick={() => handleBetMultiplier(2)}
                  className={`w-full px-2 py-1.5 text-xs rounded transition-colors mb-1 ${
                    betMultiplier === 2 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  2x (10 PIE)
                </button>
                <button
                  onClick={() => handleBetMultiplier(5)}
                  className={`w-full px-2 py-1.5 text-xs rounded transition-colors ${
                    betMultiplier === 5 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  5x (25 PIE)
                </button>
              </div>
            )}
          </div>

          {/* CENTER - Game Board */}
          <div className="space-compact">
            {/* Bet Multiplier - Mobile Only */}
            {gameState === 'ready' && (
              <div className="md:hidden flex justify-center gap-2">
                <button
                  onClick={() => handleBetMultiplier(1)}
                  className={`px-3 py-1.5 text-xs rounded font-bold transition-colors ${
                    betMultiplier === 1 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  1x (5 PIE)
                </button>
                <button
                  onClick={() => handleBetMultiplier(2)}
                  className={`px-3 py-1.5 text-xs rounded font-bold transition-colors ${
                    betMultiplier === 2 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  2x (10 PIE)
                </button>
                <button
                  onClick={() => handleBetMultiplier(5)}
                  className={`px-3 py-1.5 text-xs rounded font-bold transition-colors ${
                    betMultiplier === 5 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  5x (25 PIE)
                </button>
              </div>
            )}

            {/* Cauldron Container */}
            <div className="game-board-card">
              <div className="cauldron-container">
                {/* Cauldron Base Layer */}
                <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                  <img
                    src="/games/dagdas-cauldron/cauldron.png"
                    alt="Dagda's Cauldron"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      display: 'block'
                    }}
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
                        left: `${(symbol.x / 400) * 100}%`,
                        top: `${(symbol.y / 400) * 100}%`,
                        width: `${(symbol.size / 400) * 100}%`,
                        height: `${(symbol.size / 400) * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${symbol.rotation}deg)`,
                        opacity: symbol.opacity
                      }}
                    >
                      <img
                        src={`/games/dagdas-cauldron/symbols/${symbol.symbol}.png`}
                        alt={symbol.symbol}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: isStirring ? 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.7))' : 'none',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Result Symbols */}
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-4" 
                  style={{ 
                    zIndex: 10,
                    bottom: '10%'
                  }}
                >
                  {resultSymbols.map((symbol, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border-2 md:border-4 flex items-center justify-center transition-all duration-700 ${
                        isStirring ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                      }`}
                      style={{
                        width: 'min(20vw, 80px)',
                        height: 'min(20vw, 80px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderColor: '#d4af37',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.9), 0 0 40px rgba(212, 175, 55, 0.5)'
                      }}
                    >
                      <img
                        src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                        alt={symbol}
                        style={{
                          width: '90%',
                          height: '90%',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 1))'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Symbol Legend - Mobile Only (Horizontal) */}
            <div className="md:hidden info-card-compact">
              <div className="text-xs font-bold mb-2 text-center" style={{ color: 'var(--card-text)' }}>Symbols</div>
              <div className="symbol-legend">
                {gameEngine.current.getAllSymbols().map((symbol) => (
                  <div key={symbol} className="flex flex-col items-center p-1 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', minWidth: '50px' }}>
                    <img
                      src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                      alt={symbol}
                      className="w-8 h-8 object-contain mb-1"
                    />
                    <span className="text-xs font-bold" style={{ color: 'var(--card-text)' }}>{gameEngine.current.getSymbolValue(symbol)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="text-center space-compact">
              {/* Stir Button */}
              {gameState === 'ready' && (
                <button
                  onClick={startStirring}
                  className="px-6 py-3 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-base md:text-lg w-full md:w-auto"
                  style={{
                    background: 'linear-gradient(to right, var(--accent-purple), #7c3aed)',
                    cursor: 'pointer'
                  }}
                >
                  🥄 STIR ({5 * betMultiplier} PIE)
                </button>
              )}

              {/* Nudge Controls */}
              {gameState === 'nudge' && (
                <div className="space-compact">
                  <p className="text-xs text-responsive-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    {nudgeInfo.remaining} nudge{nudgeInfo.remaining !== 1 ? 's' : ''} left ({nudgeInfo.cost} PIE each)
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => handleNudge('left')}
                      disabled={!canNudge}
                      className="px-3 py-2 text-xs md:text-sm text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      ← Nudge Left
                    </button>
                    <button
                      onClick={() => handleNudge('middle')}
                      disabled={!canNudge}
                      className="px-3 py-2 text-xs md:text-sm text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      ↓ Nudge Middle
                    </button>
                    <button
                      onClick={() => handleNudge('right')}
                      disabled={!canNudge}
                      className="px-3 py-2 text-xs md:text-sm text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      Nudge Right →
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {totalWinnings > 0 && (
                      <button
                        onClick={collectWinnings}
                        className="px-4 py-2 text-xs md:text-sm text-white font-bold rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--accent-purple)' }}
                      >
                        🏆 Claim ({totalWinnings} PIE)
                      </button>
                    )}
                    <button
                      onClick={resetGame}
                      className="px-4 py-2 text-xs md:text-sm text-white font-bold rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--accent-green)' }}
                    >
                      🎮 Play Again
                    </button>
                  </div>
                </div>
              )}

              {/* Play Again */}
              {(gameState === 'complete' || gameState === 'result') && (
                <button
                  onClick={resetGame}
                  className="px-6 py-3 text-white font-bold rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--accent-green)' }}
                >
                  Play Again
                </button>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`text-center p-2 md:p-3 rounded-lg text-xs text-responsive-sm ${
                message.includes('won') || message.includes('JACKPOT') || message.includes('Great win')
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : message.includes('lost') || message.includes('No win')
                  ? 'bg-red-100 border border-red-300 text-red-800'
                  : 'bg-blue-100 border border-blue-300 text-blue-800'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Symbol Legend & Rules */}
          <div className="space-compact">
            {/* Symbol Legend - Desktop Only (Vertical) */}
            <div className="hidden md:block info-card-compact">
              <h3 className="text-xs font-bold mb-2 text-center" style={{ color: 'var(--card-text)' }}>Symbols</h3>
              <div className="symbol-legend">
                {gameEngine.current.getAllSymbols().map((symbol) => (
                  <div key={symbol} className="flex flex-col items-center p-1 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <img
                      src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                      alt={symbol}
                      className="w-10 h-10 object-contain mb-1"
                    />
                    <span className="text-xs font-bold" style={{ color: 'var(--card-text)' }}>{gameEngine.current.getSymbolValue(symbol)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compact Rules */}
            <div className="info-card-compact">
              <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--card-text)' }}>📖 How to Play</h3>
              <ul className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li>• Bet 5, 10, or 25 PIE</li>
                <li>• Match 2-3 symbols to win</li>
                <li>• Use nudges to improve (max 3)</li>
                <li>• Win up to 125 PIE jackpot</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
