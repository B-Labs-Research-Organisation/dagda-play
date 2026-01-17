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

type GameState = 'ready' | 'spinning' | 'result' | 'nudge'
type Symbol = 'harp' | 'club' | 'cauldron' | 'wolfhound' | 'shamrock'

interface Reel {
  symbols: Symbol[]
  position: number
}

interface Payline {
  positions: number[]
  multiplier: number
}

export function DagdasCauldronGame({ onComplete, balance, farcasterProfile }: DagdasCauldronGameProps) {
  const { address } = useAccount()
  const [gameState, setGameState] = useState<GameState>('ready')
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState<Reel[]>([
    { symbols: ['harp', 'club', 'cauldron', 'wolfhound', 'shamrock'], position: 0 },
    { symbols: ['club', 'shamrock', 'harp', 'cauldron', 'wolfhound'], position: 0 },
    { symbols: ['cauldron', 'wolfhound', 'shamrock', 'harp', 'club'], position: 0 }
  ])
  const [displayedSymbols, setDisplayedSymbols] = useState<Symbol[]>(['harp', 'club', 'cauldron'])
  const [result, setResult] = useState<{ message: string; amount: number; emoji: string; color: string } | null>(null)
  const [newBalance, setNewBalance] = useState(balance)
  const [message, setMessage] = useState('')
  const [nudgesRemaining, setNudgesRemaining] = useState(1)
  const [nudgeCost, setNudgeCost] = useState(1)
  const [selectedReelForNudge, setSelectedReelForNudge] = useState<number | null>(null)
  const [winningPaylines, setWinningPaylines] = useState<number[]>([])

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  // Paylines: [reel1, reel2, reel3] positions (0=top, 1=middle, 2=bottom)
  const paylines: Payline[] = [
    { positions: [1, 1, 1], multiplier: 1 }, // Middle horizontal
    { positions: [0, 0, 0], multiplier: 1 }, // Top horizontal
    { positions: [2, 2, 2], multiplier: 1 }, // Bottom horizontal
    { positions: [0, 1, 2], multiplier: 1.5 }, // Diagonal top-left to bottom-right
    { positions: [2, 1, 0], multiplier: 1.5 }, // Diagonal bottom-left to top-right
  ]

  // Symbol values for payout calculations
  const symbolValues: Record<Symbol, number> = {
    harp: 5,
    club: 3,
    cauldron: 4,
    wolfhound: 2,
    shamrock: 1
  }

  const spinReels = () => {
    // Create new reel positions with spinning animation
    const newReels = reels.map(reel => {
      // Randomize the final position
      const finalPosition = Math.floor(Math.random() * 5)
      return {
        ...reel,
        position: finalPosition
      }
    })

    setReels(newReels)

    // Update displayed symbols based on middle positions
    const newSymbols = newReels.map(reel => reel.symbols[reel.position])
    setDisplayedSymbols(newSymbols)
  }

  const calculatePayout = (symbols: Symbol[]): { message: string; amount: number; emoji: string; color: string } => {
    // Check each payline for matches
    const winningLines: number[] = []
    let totalPayout = 0

    paylines.forEach((payline, index) => {
      const lineSymbols = payline.positions.map((pos, reelIndex) => reels[reelIndex].symbols[pos])
      const firstSymbol = lineSymbols[0]

      // Check if all symbols in the payline match
      if (lineSymbols.every(symbol => symbol === firstSymbol)) {
        winningLines.push(index)
        const symbolValue = symbolValues[firstSymbol]
        totalPayout += symbolValue * payline.multiplier
      }
    })

    // Special case: All three middle symbols match (jackpot)
    const middleSymbols = reels.map(reel => reel.symbols[reel.position])
    if (middleSymbols.every(symbol => symbol === middleSymbols[0])) {
      const symbolValue = symbolValues[middleSymbols[0]]
      totalPayout += symbolValue * 2 // Jackpot multiplier
    }

    // Determine result message and styling
    if (totalPayout > 0) {
      const messages = [
        { threshold: 20, message: '🎉 JACKPOT! Dagda smiles upon you!', emoji: '💎', color: 'from-yellow-400 to-yellow-600' },
        { threshold: 10, message: '🎉 Great win! The cauldron overflows!', emoji: '🪙', color: 'from-green-400 to-green-600' },
        { threshold: 5, message: '🎉 Nice win! Luck of the Irish!', emoji: '⚘', color: 'from-green-400 to-green-600' },
        { threshold: 1, message: '🎉 Small win! Keep playing!', emoji: '🍀', color: 'from-blue-400 to-blue-600' },
      ]

      const result = messages.find(m => totalPayout >= m.threshold) || messages[messages.length - 1]
      return {
        message: result.message,
        amount: totalPayout,
        emoji: result.emoji,
        color: result.color
      }
    } else {
      return {
        message: '😢 No win this time. Try again!',
        amount: 0,
        emoji: '💸',
        color: 'from-orange-400 to-red-500'
      }
    }
  }

  const playGame = async () => {
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

      setGameState('spinning')
      setIsSpinning(true)
      setMessage('Stirring Dagda\'s magical cauldron...')
      setWinningPaylines([])
      setNudgesRemaining(1)
      setNudgeCost(1)

      // Animate the slots
      const spinDuration = 2000
      const spinInterval = 100
      let spinCount = 0
      const maxSpins = spinDuration / spinInterval

      const spinTimer = setInterval(() => {
        // Randomize reel positions during spin
        setReels(prevReels => prevReels.map(reel => ({
          ...reel,
          position: Math.floor(Math.random() * 5)
        })))

        spinCount++

        if (spinCount >= maxSpins) {
          clearInterval(spinTimer)
          setIsSpinning(false)

          // Final reel positions
          spinReels()

          // Calculate payout
          const finalResult = calculatePayout(displayedSymbols)
          setResult(finalResult)

          // Update balance
          balanceManager.updateBalance(userId, username, finalResult.amount - 5) // Subtract the 5 PIE bet
            .then((updatedBalance) => {
              setNewBalance(updatedBalance)
              setGameState(finalResult.amount > 0 ? 'nudge' : 'result')
              setMessage(finalResult.message)
            })
            .catch((error) => {
              console.error('Error updating balance:', error)
              setMessage('Error updating balance. Please try again.')
            })
        }
      }, spinInterval)

    } catch (error) {
      console.error('Error playing Dagda\'s Cauldron:', error)
      setMessage('An error occurred. Please try again.')
    }
  }

  const handleNudge = async (reelIndex: number, direction: 'up' | 'down') => {
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

      setGameState('spinning')
      setMessage(`Nudging reel ${reelIndex + 1} ${direction}...`)

      // Apply the nudge
      setTimeout(() => {
        setReels(prevReels => {
          const newReels = [...prevReels]
          const currentPosition = newReels[reelIndex].position

          // Move up or down, wrapping around if needed
          if (direction === 'up') {
            newReels[reelIndex].position = currentPosition > 0 ? currentPosition - 1 : 4
          } else {
            newReels[reelIndex].position = currentPosition < 4 ? currentPosition + 1 : 0
          }

          return newReels
        })

        // Update displayed symbols
        const newSymbols = reels.map(reel => reel.symbols[reel.position])
        setDisplayedSymbols(newSymbols)

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
    setIsSpinning(false)
    setReels([
      { symbols: ['harp', 'club', 'cauldron', 'wolfhound', 'shamrock'], position: 0 },
      { symbols: ['club', 'shamrock', 'harp', 'cauldron', 'wolfhound'], position: 0 },
      { symbols: ['cauldron', 'wolfhound', 'shamrock', 'harp', 'club'], position: 0 }
    ])
    setDisplayedSymbols(['harp', 'club', 'cauldron'])
    setResult(null)
    setMessage('')
    setNudgesRemaining(1)
    setNudgeCost(1)
    setSelectedReelForNudge(null)
    setWinningPaylines([])
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
      backgroundImage: `url('/games/dagdas-cauldron/cabinet.png')`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={backToMain}
            className="mb-4 flex items-center gap-2"
            style={{ color: 'var(--accent-green)' }}
          >
            ← Back to Games
          </button>
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
              {gameState === 'ready' && 'Click spin to test your luck!'}
              {gameState === 'spinning' && 'Stirring the magical cauldron...'}
              {gameState === 'result' && `New Balance: ${newBalance} PIE`}
              {gameState === 'nudge' && `Nudges remaining: ${nudgesRemaining} (Cost: ${nudgeCost} PIE)`}
            </div>
          </div>
        </div>

        {/* Slot Machine Display */}
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
            {/* Slot Machine Frame */}
            <div 
              className="inline-block p-4 rounded-lg border-4 shadow-lg"
              style={{ 
                background: 'linear-gradient(to bottom, var(--accent-yellow), #ca8a04)',
                borderColor: 'var(--accent-yellow)'
              }}
            >
              {/* Reels Display */}
              <div className="flex gap-2 justify-center mb-4">
                {reels.map((reel, reelIndex) => (
                  <div key={reelIndex} className="relative">
                    {/* Show all 3 visible symbols for each reel */}
                    <div className="flex flex-col gap-1">
                      {[-1, 0, 1].map((offset) => {
                        const symbolIndex = (reel.position + offset + 5) % 5
                        const symbol = reel.symbols[symbolIndex]
                        return (
                          <div
                            key={`${reelIndex}-${offset}`}
                            className={`w-16 h-16 rounded border-2 flex items-center justify-center text-2xl font-bold transition-transform duration-75 ${
                              isSpinning ? 'animate-bounce' : ''
                            }`}
                            style={{
                              backgroundColor: 'white',
                              borderColor: '#d1d5db',
                              opacity: offset === 0 ? 1 : 0.7
                            }}
                          >
                            <img
                              src={`/games/dagdas-cauldron/symbols/${symbol}.png`}
                              alt={symbol}
                              className="w-12 h-12 object-contain"
                            />
                          </div>
                        )
                      })}
                    </div>
                    {/* Nudge buttons for this reel */}
                    {gameState === 'nudge' && (
                      <div className="flex justify-center gap-1 mt-1">
                        <button
                          onClick={() => handleNudge(reelIndex, 'up')}
                          disabled={nudgesRemaining <= 0}
                          className="w-6 h-6 bg-blue-500 text-white rounded text-xs disabled:bg-gray-400"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleNudge(reelIndex, 'down')}
                          disabled={nudgesRemaining <= 0}
                          className="w-6 h-6 bg-blue-500 text-white rounded text-xs disabled:bg-gray-400"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Slot Machine Lever */}
              <div className="flex justify-center mt-4">
                <div className="w-2 h-16 rounded-full relative" style={{ backgroundColor: '#6b7280' }}>
                  <div
                    className="w-4 h-4 rounded-full absolute -right-1 transition-all duration-300"
                    style={{
                      backgroundColor: '#dc2626',
                      top: isSpinning ? '-4px' : '8px'
                    }}
                  ></div>
                </div>
              </div>
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

        {/* Spin Button */}
        {gameState === 'ready' && (
          <div className="text-center">
            <button
              onClick={playGame}
              className="px-8 py-4 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-xl"
              style={{ background: 'linear-gradient(to right, var(--accent-purple), #7c3aed)' }}
            >
              🎰 SPIN (Bet 5 PIE)
            </button>
          </div>
        )}

        {/* Nudge Controls */}
        {gameState === 'nudge' && (
          <div className="text-center mt-4">
            <p className="mb-2" style={{ color: 'var(--text-muted)' }}>
              You have {nudgesRemaining} nudge{nudgesRemaining !== 1 ? 's' : ''} remaining (Cost: {nudgeCost} PIE each)
            </p>
            <button
              onClick={() => setGameState('result')}
              className="px-6 py-2 text-white font-bold rounded-lg transition-colors"
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
            <li>• Bet 5 PIE to spin the cauldron</li>
            <li>• Match symbols on paylines to win</li>
            <li>• Use nudges to improve your result</li>
            <li>• Win up to 25 PIE with the jackpot</li>
            <li>• 20 plays per day (25 for Farcaster users)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
