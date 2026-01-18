'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BalanceManager } from '@/lib/BalanceManager'
import { LimitManager } from '@/lib/LimitManager'

interface DagdasCauldronGameProps {
  onComplete: () => void
  balance: number
  farcasterProfile?: { fid?: number; username?: string } | null
}

type GameState = 'ready' | 'stirring' | 'result' | 'nudge'
type Symbol = 'harp' | 'club' | 'cauldron' | 'wolfhound' | 'shamrock'

interface FloatingSymbol {
  id: number
  symbol: Symbol
  x: number
  y: number
  rotation: number
  speed: number
  direction: number
  size: number
}

export function DagdasCauldronGame({ onComplete, balance, farcasterProfile }: DagdasCauldronGameProps) {
  const { address } = useAccount()
  const [gameState, setGameState] = useState<GameState>('ready')
  const [isStirring, setIsStirring] = useState(false)
  const [floatingSymbols, setFloatingSymbols] = useState<FloatingSymbol[]>([])
  const [resultSymbols, setResultSymbols] = useState<Symbol[]>([])
  const [result, setResult] = useState<{ message: string; amount: number; emoji: string; color: string } | null>(null)
  const [newBalance, setNewBalance] = useState(balance)
  const [message, setMessage] = useState('')
  const [nudgesRemaining, setNudgesRemaining] = useState(1)
  const [nudgeCost, setNudgeCost] = useState(1)
  const [winningAnimation, setWinningAnimation] = useState(false)
  const [animationFrame, setAnimationFrame] = useState(0)

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  // Symbol values for payout calculations
  const symbolValues: Record<Symbol, number> = {
    harp: 5,
    club: 3,
    cauldron: 4,
    wolfhound: 2,
    shamrock: 1
  }

  // Initialize floating symbols
  const initializeSymbols = () => {
    const symbols: FloatingSymbol[] = []
    const cauldronWidth = 400
    const cauldronHeight = 300
    const centerX = cauldronWidth / 2
    const centerY = cauldronHeight / 2
    const symbolsList: Symbol[] = ['harp', 'club', 'cauldron', 'wolfhound', 'shamrock']

    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15
      const radius = 80 + Math.random() * 40
      const symbol = symbolsList[Math.floor(Math.random() * symbolsList.length)]
      
      symbols.push({
        id: i,
        symbol: symbol,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        rotation: Math.random() * 360,
        speed: 2 + Math.random() * 3,
        direction: Math.random() > 0.5 ? 1 : -1,
        size: 40 + Math.random() * 20
      })
    }
    return symbols
  }

  const calculatePayout = (symbols: Symbol[]): { message: string; amount: number; emoji: string; color: string } => {
    // Check for matches in the result symbols
    const firstSymbol = symbols[0]
    const allMatch = symbols.every(symbol => symbol === firstSymbol)
    const twoMatch = symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]

    let totalPayout = 0
    let message = ''
    let emoji = ''
    let color = ''

    if (allMatch) {
      // All three match - jackpot
      totalPayout = symbolValues[firstSymbol] * 5
      message = '🎉 JACKPOT! Dagda smiles upon you!'
      emoji = '💎'
      color = 'from-yellow-400 to-yellow-600'
    } else if (twoMatch) {
      // Two match
      const matchingSymbol = symbols.find((symbol, index) => 
        index < 2 && symbols[index + 1] === symbol
      ) || symbols[0]
      totalPayout = symbolValues[matchingSymbol] * 2
      message = '🎉 Great win! The cauldron overflows!'
      emoji = '🪙'
      color = 'from-green-400 to-green-600'
    } else {
      // No match
      message = '😢 No win this time. Try again!'
      emoji = '💸'
      color = 'from-orange-400 to-red-500'
    }

    return {
      message,
      amount: totalPayout,
      emoji,
      color
    }
  }

  const startStirring = async () => {
    if (gameState !== 'ready') return

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

      const isFarcasterUser = !!farcasterProfile?.fid
      const limitCheck = await limitManager.checkAndUpdateLimit(userId, username, 'dagdas-cauldron', isFarcasterUser)
      if (!limitCheck.canPlay) {
        setMessage(`Daily limit reached! Resets in: ${limitCheck.resetsIn}`)
        return
      }

      // Check balance
      if (balance < 5) {
        setMessage('Insufficient PIE balance! Need at least 5 PIE.')
        return
      }

      setGameState('stirring')
      setIsStirring(true)
      setMessage('Stirring Dagda\'s magical cauldron...')
      setWinningAnimation(false)
      setAnimationFrame(0)
      setNudgesRemaining(1)
      setNudgeCost(1)
      setResult(null)

      // Initialize symbols
      const initialSymbols = initializeSymbols()
      setFloatingSymbols(initialSymbols)

      // Animate the cauldron
      const stirDuration = 3000
      const stirInterval = 50
      let stirCount = 0
      const maxStirs = stirDuration / stirInterval

      const stirTimer = setInterval(() => {
        setFloatingSymbols(prevSymbols => 
          prevSymbols.map(symbol => ({
            ...symbol,
            // Spiral movement with random drift
            x: symbol.x + Math.cos(stirCount * 0.1) * symbol.speed * 0.5 + (Math.random() - 0.5) * 2,
            y: symbol.y + Math.sin(stirCount * 0.1) * symbol.speed * 0.5 + (Math.random() - 0.5) * 2,
            rotation: symbol.rotation + symbol.speed * symbol.direction
          }))
        )

        stirCount++

        if (stirCount >= maxStirs) {
          clearInterval(stirTimer)
          finishStirring()
        }
      }, stirInterval)

    } catch (error) {
      console.error('Error starting cauldron stirring:', error)
      setMessage('An error occurred. Please try again.')
    }
  }

  const finishStirring = async () => {
    setIsStirring(false)
    
    // Generate final result symbols
    const symbolsList: Symbol[] = ['harp', 'club', 'cauldron', 'wolfhound', 'shamrock']
    const finalSymbols: Symbol[] = []
    
    for (let i = 0; i < 3; i++) {
      finalSymbols.push(symbolsList[Math.floor(Math.random() * symbolsList.length)])
    }
    
    setResultSymbols(finalSymbols)

    // Calculate payout
    const finalResult = calculatePayout(finalSymbols)
    setResult(finalResult)

    // Update balance
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

      balanceManager.updateBalance(userId, username, finalResult.amount - 5) // Subtract the 5 PIE bet
        .then((updatedBalance) => {
          setNewBalance(updatedBalance)
          setGameState('nudge')
          setMessage(finalResult.message)
          
          // Start winning animation if there's a win
          if (finalResult.amount > 0) {
            setWinningAnimation(true)
            startWinningAnimation()
          }
        })
        .catch((error) => {
          console.error('Error updating balance:', error)
          setMessage('Error updating balance. Please try again.')
        })
    } catch (error) {
      console.error('Error with balance update:', error)
      setMessage('An error occurred. Please try again.')
    }
  }

  const startWinningAnimation = () => {
    const animationTimer = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 12)
    }, 100)

    setTimeout(() => {
      clearInterval(animationTimer)
      setWinningAnimation(false)
    }, 3000)
  }

  const handleNudge = async (direction: 'left' | 'right') => {
    if (gameState !== 'nudge' || nudgesRemaining <= 0) return

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
      if (balance < nudgeCost) {
        setMessage(`Insufficient PIE balance! Need ${nudgeCost} PIE for a nudge.`)
        return
      }

      setGameState('stirring')
      setMessage(`Nudging the cauldron ${direction}...`)

      // Apply the nudge - change one of the symbols
      setTimeout(() => {
        const symbolsList: Symbol[] = ['harp', 'club', 'cauldron', 'wolfhound', 'shamrock']
        const newSymbols = [...resultSymbols]
        
        // Change a random symbol to try to create a match
        const changeIndex = Math.floor(Math.random() * 3)
        newSymbols[changeIndex] = symbolsList[Math.floor(Math.random() * symbolsList.length)]
        
        setResultSymbols(newSymbols)

        // Calculate new payout
        const newResult = calculatePayout(newSymbols)
        setResult(newResult)

        // Update balance (subtract nudge cost and add any new winnings)
        balanceManager.updateBalance(userId, username, newResult.amount - nudgeCost)
          .then((updatedBalance) => {
            setNewBalance(updatedBalance)
            setNudgesRemaining(nudgesRemaining - 1)
            setNudgeCost(nudgeCost + 1) // Increase cost for next nudge
            setGameState('result')
            setMessage(`Nudge applied! ${newResult.message}`)
            
            // Start winning animation if there's a win
            if (newResult.amount > 0) {
              setWinningAnimation(true)
              startWinningAnimation()
            }
          })
          .catch((error) => {
            console.error('Error applying nudge:', error)
            setMessage('Error applying nudge. Please try again.')
          })
      }, 1000)

    } catch (error) {
      console.error('Error with nudge:', error)
      setMessage('An error occurred with the nudge. Please try again.')
    }
  }

  const resetGame = () => {
    setGameState('ready')
    setIsStirring(false)
    setFloatingSymbols([])
    setResultSymbols([])
    setResult(null)
    setMessage('')
    setNudgesRemaining(1)
    setNudgeCost(1)
    setWinningAnimation(false)
    setAnimationFrame(0)
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

  return (
    <div className="min-h-screen p-8" style={{
      backgroundColor: 'var(--background)',
      backgroundImage: 'none'
    }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={backToMain}
              className="flex items-center gap-2"
              style={{ color: 'var(--accent-green)' }}
            >
              ← Back to Games
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
              style={{ color: 'var(--accent-green)' }}
            >
              🏰 Home
            </button>
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            🍲 Dagda's Cauldron
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Stir the magical cauldron and test your luck with Celtic symbols!
          </p>
        </div>

        {/* Balance Display */}
        <div 
          className="rounded-xl p-6 mb-8"
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
              {gameState === 'ready' && 'Click stir to test your luck!'}
              {gameState === 'stirring' && 'Stirring the magical cauldron...'}
              {gameState === 'result' && `New Balance: ${newBalance} PIE`}
              {gameState === 'nudge' && `Nudges remaining: ${nudgesRemaining} (Cost: ${nudgeCost} PIE)`}
            </div>
          </div>
        </div>

        {/* Cauldron Display */}
        <div 
          className="rounded-xl p-8 mb-8"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: '0 4px 6px var(--shadow)'
          }}
        >
          <div className="text-center">
            {/* Cauldron Frame */}
            <div 
              className="inline-block relative"
              style={{ 
                width: '400px',
                height: '400px',
                position: 'relative'
              }}
            >
              {/* Actual Cauldron Image */}
              <img 
                src="/games/dagdas-cauldron/cauldron.png" 
                alt="Dagda's Cauldron"
                className="w-full h-full object-contain"
              />
              
              {/* Floating Symbols */}
              <div className="relative w-full h-full">
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
                      opacity: isStirring ? 1 : 0
                    }}
                  >
                    <img
                      src={`/games/dagdas-cauldron/symbols/${symbol.symbol}.png`}
                      alt={symbol.symbol}
                      className="w-full h-full object-contain"
                      style={{
                        filter: isStirring ? 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.7))' : 'none'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Result Symbols */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                {resultSymbols.map((symbol, index) => (
                  <div
                    key={index}
                    className={`w-20 h-20 rounded-lg border-4 flex items-center justify-center transition-all duration-500 ${
                      isStirring ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                    }`}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: '#d4af37',
                      boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
                    }}
                  >
                    <img
                      src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                      alt={symbol}
                      className="w-16 h-16 object-contain"
                      style={{
                        filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.7))'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Winning Animation Overlay */}
              {winningAnimation && (
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={`/games/dagdas-cauldron/win-animation-${String(animationFrame + 1).padStart(2, '0')}.png`}
                    alt="Win Animation"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Cauldron Handle */}
              <div 
                className="absolute top-2 left-2 w-8 h-16 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, #d4af37, #8b4513)',
                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.7)'
                }}
              ></div>
              <div 
                className="absolute top-2 right-2 w-8 h-16 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, #d4af37, #8b4513)',
                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.7)'
                }}
              ></div>
            </div>

            {/* Result Display */}
            {result && (
              <div
                className="mt-6 p-4 rounded-xl text-center shadow-lg"
                style={{
                  background: `linear-gradient(to right, ${result.color.split(' ')[1]}, ${result.color.split(' ')[3]})`
                }}
              >
                <div className="text-4xl mb-2">{result.emoji}</div>
                <div className="font-bold text-lg" style={{ color: 'white' }}>{result.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Stir Button */}
        {gameState === 'ready' && (
          <div className="text-center">
            <button
              onClick={startStirring}
              className="px-8 py-4 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-xl"
              style={{ background: 'linear-gradient(to right, var(--accent-purple), #7c3aed)' }}
            >
              🍲 STIR (Bet 5 PIE)
            </button>
          </div>
        )}

        {/* Nudge Controls */}
        {gameState === 'nudge' && (
          <div className="text-center mt-4">
            <p className="mb-2" style={{ color: 'var(--text-muted)' }}>
              You have {nudgesRemaining} nudge{nudgesRemaining !== 1 ? 's' : ''} remaining (Cost: {nudgeCost} PIE each)
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleNudge('left')}
                disabled={nudgesRemaining <= 0}
                className="px-6 py-3 text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
              >
                🔄 Nudge Left
              </button>
              <button
                onClick={() => handleNudge('right')}
                disabled={nudgesRemaining <= 0}
                className="px-6 py-3 text-white font-bold rounded-lg transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
              >
                🔄 Nudge Right
              </button>
            </div>
            <button
              onClick={() => setGameState('result')}
              className="mt-4 px-6 py-2 text-white font-bold rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent-green)' }}
            >
              Finish & Collect
            </button>
          </div>
        )}

        {/* Result Message */}
        {message && !result && (
          <div className="text-center p-4 rounded-xl bg-blue-100 border border-blue-300 text-blue-800">
            {message}
          </div>
        )}

        {/* Play Again Button */}
        {gameState === 'result' && (
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

        {/* Symbol Guide */}
        <div
          className="mt-12 rounded-xl p-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--card-text)' }}>🎲 Symbol Values</h3>
          <div className="grid grid-cols-5 gap-2 text-center">
            {Object.entries(symbolValues).map(([symbol, value]) => (
              <div key={symbol} className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <img
                  src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                  alt={symbol}
                  className="w-12 h-12 mx-auto mb-1 object-contain"
                />
                <div className="text-xs font-bold" style={{ color: 'var(--card-text)' }}>{value} PIE</div>
              </div>
            ))}
          </div>
        </div>

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
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--card-text)' }}>🎮 How to Play</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <li>• Bet 5 PIE to stir the cauldron</li>
            <li>• Watch symbols swirl and settle</li>
            <li>• Match 2 or 3 symbols to win</li>
            <li>• Use nudges to improve your result</li>
            <li>• Win up to 25 PIE with the jackpot</li>
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
