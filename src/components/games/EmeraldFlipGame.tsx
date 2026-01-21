'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BalanceManager } from '@/lib/BalanceManager'
import { LimitManager } from '@/lib/LimitManager'

interface EmeraldFlipGameProps {
  onComplete: () => void
  balance: number
  farcasterProfile?: { fid?: number; username?: string } | null
}

type GameState = 'betting' | 'flipping' | 'result' | 'double-or-nothing'
type BetMultiplier = 1 | 2 | 5

export function EmeraldFlipGame({ onComplete, balance, farcasterProfile }: EmeraldFlipGameProps) {
  const { address } = useAccount()
  const [gameState, setGameState] = useState<GameState>('betting')
  const [selectedChoice, setSelectedChoice] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [newBalance, setNewBalance] = useState(balance)
  const [message, setMessage] = useState('')
  const [betMultiplier, setBetMultiplier] = useState<BetMultiplier>(1)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [flipHistory, setFlipHistory] = useState<('heads' | 'tails')[]>([])
  const [clientSeed, setClientSeed] = useState('')

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  // Generate client seed on component mount
  useEffect(() => {
    const seed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setClientSeed(seed)
  }, [])

  // Provably fair coin flip algorithm
  const generateProvablyFairResult = (clientSeed: string, serverSeed: string, nonce: number): 'heads' | 'tails' => {
    const combined = clientSeed + serverSeed + nonce
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i)
      hash |= 0
    }
    return (Math.abs(hash) % 2) === 0 ? 'heads' : 'tails'
  }

  const handleChoice = (choice: 'heads' | 'tails') => {
    if (gameState !== 'betting') return
    setSelectedChoice(choice)
  }

  const handleBetMultiplier = (multiplier: BetMultiplier) => {
    setBetMultiplier(multiplier)
  }

  const playGame = async () => {
    if (!selectedChoice || gameState !== 'betting') return

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

      const isFarcasterUser = !!farcasterProfile?.fid
      const limitCheck = await limitManager.checkAndUpdateLimit(userId, username, 'emerald-flip', isFarcasterUser)
      if (!limitCheck.canPlay) {
        setMessage(`Daily limit reached! Resets in: ${limitCheck.resetsIn}`)
        return
      }

      const betAmount = 5 * betMultiplier
      if (balance < betAmount) {
        setMessage(`Insufficient PIE balance! Need at least ${betAmount} PIE for this bet.`)
        return
      }

      setGameState('flipping')
      setIsFlipping(true)
      setMessage('Flipping the emerald coin...')

      const nonce = Date.now()
      const gameResult = generateProvablyFairResult(clientSeed, 'server-seed-placeholder', nonce)

      setTimeout(() => {
        setResult(gameResult)
        setIsFlipping(false)

        const won = selectedChoice === gameResult
        const amountChange = won ? 5 * betMultiplier : -5 * betMultiplier

        balanceManager.updateBalance(userId, username, amountChange)
          .then((updatedBalance) => {
            setNewBalance(updatedBalance)
            setGameState(won ? 'double-or-nothing' : 'result')

            const newStreak = won ? currentStreak + 1 : 0
            setCurrentStreak(newStreak)
            setFlipHistory([gameResult, ...flipHistory].slice(0, 10))

            if (won) {
              setMessage(`🎉 You won ${5 * betMultiplier} PIE! The coin landed on ${gameResult}! Streak: ${newStreak}`)
            } else {
              setMessage(`😢 You lost ${5 * betMultiplier} PIE! The coin landed on ${gameResult}.`)
            }
          })
          .catch((error) => {
            console.error('Error updating balance:', error)
            setMessage('Error updating balance. Please try again.')
          })
      }, 2000)

    } catch (error) {
      console.error('Error playing emerald flip:', error)
      setMessage('An error occurred. Please try again.')
    }
  }

  const handleDoubleOrNothing = async () => {
    if (gameState !== 'double-or-nothing') return

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

      setGameState('flipping')
      setIsFlipping(true)
      setMessage('Double or nothing flip...')

      const nonce = Date.now() + 1
      const gameResult = generateProvablyFairResult(clientSeed, 'server-seed-placeholder', nonce)

      setTimeout(() => {
        setResult(gameResult)
        setIsFlipping(false)

        const won = selectedChoice === gameResult
        const amountChange = won ? 5 * betMultiplier : -5 * betMultiplier

        balanceManager.updateBalance(userId, username, amountChange)
          .then((updatedBalance) => {
            setNewBalance(updatedBalance)
            setGameState('result')

            const newStreak = won ? currentStreak + 1 : 0
            setCurrentStreak(newStreak)
            setFlipHistory([gameResult, ...flipHistory].slice(0, 10))

            if (won) {
              setMessage(`🎉 Double or nothing success! You won another ${5 * betMultiplier} PIE! Streak: ${newStreak}`)
            } else {
              setMessage(`😢 Double or nothing failed! You lost ${5 * betMultiplier} PIE.`)
            }
          })
          .catch((error) => {
            console.error('Error updating balance:', error)
            setMessage('Error updating balance. Please try again.')
          })
      }, 2000)

    } catch (error) {
      console.error('Error with double or nothing:', error)
      setMessage('An error occurred. Please try again.')
    }
  }

  const resetGame = () => {
    setGameState('betting')
    setSelectedChoice(null)
    setResult(null)
    setIsFlipping(false)
    setMessage('')
  }

  const backToMain = () => {
    setGameState('betting')
    setSelectedChoice(null)
    setResult(null)
    setIsFlipping(false)
    setMessage('')
    onComplete()
  }

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
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <img src="/games/emerald-flip/coin-heads.png" alt="Emerald Coin" className="w-6 h-6 md:w-8 md:h-8" />
            Emerald Flip
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

            {/* Stats Card */}
            <div className="info-card-compact">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>🔥 Streak:</span>
                  <span style={{ color: 'var(--card-text)' }} className="font-bold">{currentStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>🎯 Bet:</span>
                  <span style={{ color: 'var(--card-text)' }} className="font-bold">{betMultiplier}x</span>
                </div>
              </div>
            </div>

            {/* Bet Multiplier - Left Sidebar on Desktop */}
            {gameState === 'betting' && (
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
            {gameState === 'betting' && (
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

            {/* Coin Display */}
            <div className="game-board-card">
              <div
                className={`w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-2000 ${
                  isFlipping ? 'coin-flip-animation' : ''
                }`}
                style={{ 
                  borderColor: 'var(--accent-yellow)',
                  backgroundColor: result === 'heads' ? '#fef08a' : '#fef3c7',
                  transform: isFlipping ? 'rotateY(1800deg)' : 'rotateY(0deg)'
                }}
              >
                {result === 'heads' ? (
                  <img src="/games/emerald-flip/coin-heads.png" alt="Heads" className="w-full h-full object-contain p-2" />
                ) : result === 'tails' ? (
                  <img src="/games/emerald-flip/coin-tails.png" alt="Tails" className="w-full h-full object-contain p-2" />
                ) : (
                  <img src="/games/emerald-flip/coin-heads.png" alt="Heads" className="w-full h-full object-contain p-2" />
                )}
              </div>

              {gameState === 'result' && (
                <div className="text-xl font-bold text-center mt-4" style={{ color: 'var(--card-text)' }}>
                  {result === 'heads' ? 'HEADS' : 'TAILS'}
                </div>
              )}
            </div>

            {/* Choice Selection */}
            {gameState === 'betting' && (
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <button
                  onClick={() => handleChoice('heads')}
                  className="p-3 md:p-4 rounded-lg border-2 transition-all transform hover:scale-105"
                  style={{ 
                    backgroundColor: selectedChoice === 'heads' ? 'var(--accent-yellow)' : 'var(--card-bg)',
                    borderColor: 'var(--accent-yellow)',
                    color: selectedChoice === 'heads' ? '#854d0e' : 'var(--card-text)'
                  }}
                >
                  <div className="flex justify-center mb-1">
                    <img src="/games/emerald-flip/coin-heads.png" alt="Heads" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                  </div>
                  <div className="font-bold text-sm md:text-base">HEADS</div>
                  <div className="text-xs opacity-75">+{5 * betMultiplier} PIE</div>
                </button>

                <button
                  onClick={() => handleChoice('tails')}
                  className="p-3 md:p-4 rounded-lg border-2 transition-all transform hover:scale-105"
                  style={{ 
                    backgroundColor: selectedChoice === 'tails' ? 'var(--accent-yellow)' : 'var(--card-bg)',
                    borderColor: 'var(--accent-yellow)',
                    color: selectedChoice === 'tails' ? '#854d0e' : 'var(--card-text)'
                  }}
                >
                  <div className="flex justify-center mb-1">
                    <img src="/games/emerald-flip/coin-tails.png" alt="Tails" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                  </div>
                  <div className="font-bold text-sm md:text-base">TAILS</div>
                  <div className="text-xs opacity-75">+{5 * betMultiplier} PIE</div>
                </button>
              </div>
            )}

            {/* Controls */}
            <div className="text-center space-compact">
              {/* Play Button */}
              {gameState === 'betting' && selectedChoice && (
                <button
                  onClick={playGame}
                  className="px-6 py-3 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-base md:text-lg w-full md:w-auto"
                  style={{ background: 'linear-gradient(to right, var(--accent-yellow), #f59e0b)' }}
                >
                  Flip Coin! ({5 * betMultiplier} PIE)
                </button>
              )}

              {/* Double or Nothing */}
              {gameState === 'double-or-nothing' && (
                <div className="space-compact flex flex-col gap-2">
                  <button
                    onClick={handleDoubleOrNothing}
                    className="px-6 py-3 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-base md:text-lg w-full"
                    style={{ background: 'linear-gradient(to right, var(--accent-green), #16a34a)' }}
                  >
                    Double or Nothing! ({5 * betMultiplier} PIE)
                  </button>
                  <button
                    onClick={() => setGameState('result')}
                    className="px-6 py-3 text-white font-bold rounded-lg transition-colors w-full"
                    style={{ backgroundColor: 'var(--accent-purple)' }}
                  >
                    Collect Winnings
                  </button>
                </div>
              )}

              {/* Play Again */}
              {gameState === 'result' && (
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
                message.includes('won')
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : message.includes('lost')
                  ? 'bg-red-100 border border-red-300 text-red-800'
                  : 'bg-blue-100 border border-blue-300 text-blue-800'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - History & Info */}
          <div className="space-compact">
            {/* Flip History */}
            <div className="info-card-compact">
              <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--card-text)' }}>📜 History</h3>
              <div className="flex gap-1 flex-wrap">
                {flipHistory.length === 0 ? (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No flips yet</div>
                ) : (
                  flipHistory.map((flip, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: flip === 'heads' ? '#fef08a' : '#fef3c7',
                        color: flip === 'heads' ? '#854d0e' : '#92400e',
                        border: '2px solid var(--accent-yellow)'
                      }}
                    >
                      {flip === 'heads' ? 'H' : 'T'}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* How to Play */}
            <div className="info-card-compact">
              <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--card-text)' }}>📖 How to Play</h3>
              <ul className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li>• Choose heads or tails</li>
                <li>• Select bet size (1x, 2x, 5x)</li>
                <li>• Win = double your bet</li>
                <li>• Try double or nothing!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes flip {
          0% { 
            transform: rotateY(0deg); 
            opacity: 1;
          }
          25% { 
            transform: rotateY(900deg); 
            opacity: 0.5;
          }
          50% { 
            transform: rotateY(1800deg); 
            opacity: 0;
          }
          75% { 
            transform: rotateY(2700deg); 
            opacity: 0.5;
          }
          100% { 
            transform: rotateY(3600deg); 
            opacity: 1;
          }
        }
        
        .coin-flip-animation {
          animation: flip 2s cubic-bezier(0.45, 0.05, 0.55, 0.95);
        }
      `}</style>
    </div>
  )
}
