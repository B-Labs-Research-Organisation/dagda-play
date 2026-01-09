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
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={backToMain}
            className="mb-4 text-green-700 hover:text-green-900 flex items-center gap-2"
          >
            ← Back to Games
          </button>
          <h1 className="text-4xl font-bold text-green-900 mb-2">🪙 Coinflip Challenge</h1>
          <p className="text-green-700">Bet 5 PIE and guess correctly to win 10 PIE!</p>
        </div>

        {/* Balance Display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-200 shadow-lg p-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              Current Balance: {newBalance} PIE
            </div>
            <div className="text-green-600 text-sm mt-1">
              {gameState === 'betting' && 'Choose heads or tails to play'}
              {gameState === 'flipping' && 'Flipping the coin...'}
              {gameState === 'result' && `New Balance: ${newBalance} PIE`}
            </div>
          </div>
        </div>

        {/* Coin Display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-200 shadow-lg p-8 mb-8">
          <div className="text-center">
            <div
              className={`w-32 h-32 mx-auto mb-4 rounded-full border-4 border-yellow-500 flex items-center justify-center text-6xl transition-transform duration-1000 ${
                isFlipping ? 'animate-spin' : ''
              } ${result === 'heads' ? 'bg-yellow-300 text-yellow-900' : 'bg-yellow-200 text-yellow-800'}`}
              style={{
                transformStyle: 'preserve-3d',
                animation: isFlipping ? 'flip 2s ease-in-out' : 'none'
              }}
            >
              {result === 'heads' ? '🪙' : '⭐'}
            </div>

            {gameState === 'result' && (
              <div className="text-xl font-bold text-green-900">
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
                  ? 'border-yellow-500 bg-yellow-100 text-yellow-900'
                  : 'border-yellow-300 bg-white text-yellow-800 hover:border-yellow-500'
              }`}
            >
              <div className="text-4xl mb-2">🪙</div>
              <div className="font-bold">HEADS</div>
              <div className="text-sm opacity-75">+10 PIE if correct</div>
            </button>

            <button
              onClick={() => handleChoice('tails')}
              className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                selectedChoice === 'tails'
                  ? 'border-yellow-500 bg-yellow-100 text-yellow-900'
                  : 'border-yellow-300 bg-white text-yellow-800 hover:border-yellow-500'
              }`}
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
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-xl"
            >
              Flip Coin! (Bet 5 PIE)
            </button>
          </div>
        )}

        {/* Result Message */}
        {message && (
          <div className={`text-center p-4 rounded-xl ${
            message.includes('won')
              ? 'bg-green-100 border border-green-300 text-green-800'
              : message.includes('lost')
              ? 'bg-red-100 border border-red-300 text-red-800'
              : 'bg-blue-100 border border-blue-300 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Play Again Button */}
        {gameState === 'result' && (
          <div className="text-center mt-8">
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Game Rules */}
        <div className="mt-12 bg-white/60 backdrop-blur-sm rounded-xl border border-green-200 p-6">
          <h3 className="text-lg font-bold text-green-900 mb-3">🎮 How to Play</h3>
          <ul className="text-green-700 space-y-2 text-sm">
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
