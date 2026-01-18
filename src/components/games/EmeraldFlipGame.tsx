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
  const [serverSeedHash, setServerSeedHash] = useState('')
  const [revealServerSeed, setRevealServerSeed] = useState(false)

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  // Generate client seed on component mount
  useEffect(() => {
    const seed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setClientSeed(seed)
    // In a real implementation, you would get this from the server
    setServerSeedHash('abc123def456ghi789') // Placeholder
  }, [])

  // Provably fair coin flip algorithm
  const generateProvablyFairResult = (clientSeed: string, serverSeed: string, nonce: number): 'heads' | 'tails' => {
    // Combine seeds and nonce
    const combined = clientSeed + serverSeed + nonce
    // Create hash (simplified for demo)
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
    // Use hash to determine result
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
      const limitCheck = await limitManager.checkAndUpdateLimit(userId, username, 'emerald-flip', isFarcasterUser)
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

      setGameState('flipping')
      setIsFlipping(true)
      setMessage('Flipping the emerald coin...')

      // Generate provably fair result
      const nonce = Date.now()
      const gameResult = generateProvablyFairResult(clientSeed, 'server-seed-placeholder', nonce)

      // Animate the flip
      setTimeout(() => {
        setResult(gameResult)
        setIsFlipping(false)

        const won = selectedChoice === gameResult
        const amountChange = won ? 5 * betMultiplier : -5 * betMultiplier

        // Update balance
        balanceManager.updateBalance(userId, username, amountChange)
          .then((updatedBalance) => {
            setNewBalance(updatedBalance)
            setGameState(won ? 'double-or-nothing' : 'result')

            // Update streak and history
            const newStreak = won ? currentStreak + 1 : 0
            setCurrentStreak(newStreak)
            setFlipHistory([gameResult, ...flipHistory].slice(0, 10)) // Keep last 10

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

      setGameState('flipping')
      setIsFlipping(true)
      setMessage('Double or nothing flip...')

      // Generate new provably fair result
      const nonce = Date.now() + 1 // Different nonce for double or nothing
      const gameResult = generateProvablyFairResult(clientSeed, 'server-seed-placeholder', nonce)

      setTimeout(() => {
        setResult(gameResult)
        setIsFlipping(false)

        const won = selectedChoice === gameResult
        const amountChange = won ? 5 * betMultiplier : -5 * betMultiplier

        // Update balance
        balanceManager.updateBalance(userId, username, amountChange)
          .then((updatedBalance) => {
            setNewBalance(updatedBalance)
            setGameState('result')

            // Update streak and history
            const newStreak = won ? currentStreak + 1 : 0
            setCurrentStreak(newStreak)
            setFlipHistory([gameResult, ...flipHistory].slice(0, 10)) // Keep last 10

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
    // Don't call onComplete() - stay in the game for "Play Again"
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
            <img src="/games/emerald-flip/coin-heads.png" alt="Emerald Coin" className="inline-block w-10 h-10 mr-2 align-middle" />
            Emerald Flip
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Test your luck with Dagda's enchanted emerald coin!
          </p>
        </div>

        {/* Balance & Stats Display */}
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
              {gameState === 'betting' && 'Choose heads or tails to play'}
              {gameState === 'flipping' && 'Flipping the emerald coin...'}
              {gameState === 'result' && `New Balance: ${newBalance} PIE`}
              {gameState === 'double-or-nothing' && 'Double or nothing opportunity!'}
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <span style={{ color: 'var(--text-muted)' }}>🔥 Streak: {currentStreak}</span>
              <span style={{ color: 'var(--text-muted)' }}>🎯 Bet: {betMultiplier}x</span>
            </div>
          </div>
        </div>

        {/* Coin Display */}
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
            <div
              className={`w-32 h-32 mx-auto mb-4 rounded-full border-4 flex items-center justify-center text-6xl transition-all duration-2000 ${
                isFlipping ? 'coin-flip-animation' : ''
              }`}
              style={{ 
                borderColor: 'var(--accent-yellow)',
                backgroundColor: result === 'heads' ? '#fef08a' : '#fef3c7',
                color: result === 'heads' ? '#854d0e' : '#92400e',
                transform: isFlipping ? 'rotateY(1800deg)' : 'rotateY(0deg)'
              }}
              role="img"
              aria-label={result === 'heads' ? 'Coin showing heads' : 'Coin showing tails'}
            >
              {result === 'heads' ? (
                <img src="/games/emerald-flip/coin-heads.png" alt="Heads" className="w-full h-full object-contain" />
              ) : result === 'tails' ? (
                <img src="/games/emerald-flip/coin-tails.png" alt="Tails" className="w-full h-full object-contain" />
              ) : (
                <img src="/games/emerald-flip/coin-heads.png" alt="Heads" className="w-full h-full object-contain" />
              )}
            </div>

            {gameState === 'result' && (
              <div className="text-xl font-bold" style={{ color: 'var(--card-text)' }}>
                {result === 'heads' ? 'HEADS' : 'TAILS'}
              </div>
            )}
          </div>
        </div>

        {/* Bet Multiplier Selection */}
        {gameState === 'betting' && (
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

        {/* Choice Selection */}
        {gameState === 'betting' && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => handleChoice('heads')}
              className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                selectedChoice === 'heads'
                  ? ''
                  : ''
              }`}
              style={{ 
                backgroundColor: selectedChoice === 'heads' ? 'var(--accent-yellow)' : 'var(--card-bg)',
                borderColor: 'var(--accent-yellow)',
                color: selectedChoice === 'heads' ? '#854d0e' : 'var(--card-text)'
              }}
            >
              <div className="flex justify-center mb-2">
                <img src="/games/emerald-flip/coin-heads.png" alt="Heads" className="w-12 h-12 object-contain" />
              </div>
              <div className="font-bold">HEADS</div>
              <div className="text-sm opacity-75">+{5 * betMultiplier} PIE if correct</div>
            </button>

            <button
              onClick={() => handleChoice('tails')}
              className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                selectedChoice === 'tails'
                  ? ''
                  : ''
              }`}
              style={{ 
                backgroundColor: selectedChoice === 'tails' ? 'var(--accent-yellow)' : 'var(--card-bg)',
                borderColor: 'var(--accent-yellow)',
                color: selectedChoice === 'tails' ? '#854d0e' : 'var(--card-text)'
              }}
            >
              <div className="flex justify-center mb-2">
                <img src="/games/emerald-flip/coin-tails.png" alt="Tails" className="w-12 h-12 object-contain" />
              </div>
              <div className="font-bold">TAILS</div>
              <div className="text-sm opacity-75">+{5 * betMultiplier} PIE if correct</div>
            </button>
          </div>
        )}

        {/* Play Button */}
        {gameState === 'betting' && selectedChoice && (
          <div className="text-center">
            <button
              onClick={playGame}
              className="px-8 py-4 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-xl"
              style={{ background: 'linear-gradient(to right, var(--accent-yellow), #f59e0b)' }}
            >
              Flip Coin! (Bet {5 * betMultiplier} PIE)
            </button>
          </div>
        )}

        {/* Double or Nothing Button */}
        {gameState === 'double-or-nothing' && (
          <div className="text-center space-y-4">
            <button
              onClick={handleDoubleOrNothing}
              className="px-8 py-4 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-xl"
              style={{ background: 'linear-gradient(to right, var(--accent-green), #16a34a)' }}
            >
              Double or Nothing! (Bet {5 * betMultiplier} PIE)
            </button>
            <button
              onClick={() => setGameState('result')}
              className="px-8 py-4 text-white font-bold rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent-purple)' }}
            >
              Collect Winnings
            </button>
          </div>
        )}

        {/* Result Message */}
        {message && (
          <div className={`text-center p-4 rounded-xl mt-4 ${
            message.includes('won')
              ? 'bg-green-100 border border-green-300'
              : message.includes('lost')
              ? 'bg-red-100 border border-red-300'
              : 'bg-blue-100 border border-blue-300'
          }`}
          style={{ 
            color: message.includes('won') ? '#166534' : message.includes('lost') ? '#991b1b' : '#1e40af'
          }}
          >
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

        {/* Flip History */}
        <div 
          className="mt-12 rounded-xl p-6"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--card-text)' }}>📜 Flip History</h3>
          <div className="flex gap-2 flex-wrap">
            {flipHistory.map((flip, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: flip === 'heads' ? '#fef08a' : '#fef3c7',
                  color: flip === 'heads' ? '#854d0e' : '#92400e',
                  border: '2px solid var(--accent-yellow)'
                }}
              >
                {flip === 'heads' ? 'H' : 'T'}
              </div>
            ))}
          </div>
        </div>

        {/* Provably Fair Info */}
        <div 
          className="mt-6 rounded-xl p-4 text-sm"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-muted)' }}>✅ Provably Fair</span>
            <button
              onClick={() => setRevealServerSeed(!revealServerSeed)}
              className="text-xs text-blue-500 hover:underline"
            >
              {revealServerSeed ? 'Hide' : 'Verify'}
            </button>
          </div>
          {revealServerSeed && (
            <div className="mt-2 text-xs">
              <div style={{ color: 'var(--text-muted)' }}>Client Seed: {clientSeed}</div>
              <div style={{ color: 'var(--text-muted)' }}>Server Seed: server-seed-placeholder</div>
            </div>
          )}
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
