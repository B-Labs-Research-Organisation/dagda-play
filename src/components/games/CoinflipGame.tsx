'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BalanceManager } from '@/lib/BalanceManager'
import { LimitManager } from '@/lib/LimitManager'

interface CoinflipGameProps {
  onComplete: () => void
  balance: number
  farcasterProfile?: { fid?: number; username?: string } | null
}

type GameState = 'betting' | 'flipping' | 'result'

export function CoinflipGame({ onComplete, balance, farcasterProfile }: CoinflipGameProps) {
  const { address } = useAccount()
  const [gameState, setGameState] = useState<GameState>('betting')
  const [selectedChoice, setSelectedChoice] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [newBalance, setNewBalance] = useState(balance)
  const [message, setMessage] = useState('')

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  const handleChoice = (choice: 'heads' | 'tails') => {
    if (gameState !== 'betting') return
    setSelectedChoice(choice)
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

      const limitCheck = await limitManager.checkAndUpdateLimit(userId, username, 'coinflip')
      if (!limitCheck.canPlay) {
        setMessage(`Daily limit reached! Resets in: ${limitCheck.resetsIn}`)
        return
      }

      // Check balance
      if (balance < 5) {
        setMessage('Insufficient PIE balance! Need at least 5 PIE.')
        return
      }

      setGameState('flipping')
      setIsFlipping(true)
      setMessage('Flipping the coin...')

      // Animate the flip
      setTimeout(() => {
        const gameResult = Math.random() < 0.5 ? 'heads' : 'tails'
        setResult(gameResult)
        setIsFlipping(false)

        const won = selectedChoice === gameResult
        const amountChange = won ? 5 : -5

        // Update balance
        balanceManager.updateBalance(userId, username, amountChange)
          .then((updatedBalance) => {
            setNewBalance(updatedBalance)
            setGameState('result')

            if (won) {
              setMessage(`🎉 You won 5 PIE! The coin landed on ${gameResult}!`)
            } else {
              setMessage(`😢 You lost 5 PIE! The coin landed on ${gameResult}.`)
            }
          })
          .catch((error) => {
            console.error('Error updating balance:', error)
            setMessage('Error updating balance. Please try again.')
          })
      }, 2000)

    } catch (error) {
      console.error('Error playing coinflip:', error)
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
    <div className="min-h-screen p-8">
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
            🪙 Coinflip Challenge
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Bet 5 PIE and guess correctly to win 10 PIE!
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
              {gameState === 'betting' && 'Choose heads or tails to play'}
              {gameState === 'flipping' && 'Flipping the coin...'}
              {gameState === 'result' && `New Balance: ${newBalance} PIE`}
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
              className={`w-32 h-32 mx-auto mb-4 rounded-full border-4 flex items-center justify-center text-6xl transition-transform duration-1000 ${
                isFlipping ? 'animate-spin' : ''
              }`}
              style={{ 
                borderColor: 'var(--accent-yellow)',
                backgroundColor: result === 'heads' ? '#fef08a' : '#fef3c7',
                color: result === 'heads' ? '#854d0e' : '#92400e'
              }}
              role="img"
              aria-label={result === 'heads' ? 'Coin showing heads' : 'Coin showing tails'}
            >
              {result === 'heads' ? '🪙' : '⭐'}
            </div>

            {gameState === 'result' && (
              <div className="text-xl font-bold" style={{ color: 'var(--card-text)' }}>
                {result === 'heads' ? 'HEADS' : 'TAILS'}
              </div>
            )}
          </div>
        </div>

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
              <div className="text-4xl mb-2">🪙</div>
              <div className="font-bold">HEADS</div>
              <div className="text-sm opacity-75">+10 PIE if correct</div>
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
              <div className="text-4xl mb-2">⭐</div>
              <div className="font-bold">TAILS</div>
              <div className="text-sm opacity-75">+10 PIE if correct</div>
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
              Flip Coin! (Bet 5 PIE)
            </button>
          </div>
        )}

        {/* Result Message */}
        {message && (
          <div className={`text-center p-4 rounded-xl ${
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

        {/* Game Rules */}
        <div 
          className="mt-12 rounded-xl p-6"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--card-text)' }}>🎮 How to Play</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <li>• Choose either Heads or Tails</li>
            <li>• Bet 5 PIE to play</li>
            <li>• Win 10 PIE if you guess correctly</li>
            <li>• Lose 5 PIE if you're wrong</li>
            <li>• 3 plays per day maximum</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes flip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(1800deg); }
          100% { transform: rotateY(3600deg); }
        }
      `}</style>
    </div>
  )
}
