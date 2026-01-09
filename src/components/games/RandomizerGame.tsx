'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BalanceManager } from '@/lib/BalanceManager'
import { LimitManager } from '@/lib/LimitManager'

interface RandomizerGameProps {
  onComplete: () => void
  balance: number
  farcasterProfile?: { fid?: number; username?: string } | null
}

type GameState = 'ready' | 'spinning' | 'result'

interface Outcome {
  message: string
  amount: number
  emoji: string
  color: string
}

export function RandomizerGame({ onComplete, balance, farcasterProfile }: RandomizerGameProps) {
  const { address } = useAccount()
  const [gameState, setGameState] = useState<GameState>('ready')
  const [isSpinning, setIsSpinning] = useState(false)
  const [slots, setSlots] = useState(['🎰', '🎰', '🎰'])
  const [result, setResult] = useState<Outcome | null>(null)
  const [newBalance, setNewBalance] = useState(balance)
  const [message, setMessage] = useState('')

  const balanceManager = new BalanceManager()
  const limitManager = new LimitManager()

  const outcomes: Outcome[] = [
    { message: '🎉 JACKPOT! You won 10 PIE!', amount: 10, emoji: '💎', color: 'from-yellow-400 to-yellow-600' },
    { message: '🎉 You won 5 PIE!', amount: 5, emoji: '🪙', color: 'from-green-400 to-green-600' },
    { message: '😐 Break even - no PIE gained or lost', amount: 0, emoji: '⚖️', color: 'from-blue-400 to-blue-600' },
    { message: '😢 You lost 5 PIE', amount: -5, emoji: '💸', color: 'from-orange-400 to-red-500' },
    { message: '😱 You lost 10 PIE!', amount: -10, emoji: '💥', color: 'from-red-400 to-red-600' },
  ]

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

      const limitCheck = await limitManager.checkAndUpdateLimit(userId, username, 'randomizer')
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
      setMessage('Spinning the wheel of fortune...')

      // Animate the slots
      const spinDuration = 2000
      const spinInterval = 100
      let spinCount = 0
      const maxSpins = spinDuration / spinInterval

      const slotEmojis = ['🎰', '🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎲']

      const spinTimer = setInterval(() => {
        setSlots([
          slotEmojis[Math.floor(Math.random() * slotEmojis.length)],
          slotEmojis[Math.floor(Math.random() * slotEmojis.length)],
          slotEmojis[Math.floor(Math.random() * slotEmojis.length)]
        ])
        spinCount++

        if (spinCount >= maxSpins) {
          clearInterval(spinTimer)
          setIsSpinning(false)

          // Determine final outcome
          const finalOutcome = outcomes[Math.floor(Math.random() * outcomes.length)]
          setResult(finalOutcome)

          // Update balance
          balanceManager.updateBalance(userId, username, finalOutcome.amount)
            .then((updatedBalance) => {
              setNewBalance(updatedBalance)
              setGameState('result')
              setMessage(finalOutcome.message)
            })
            .catch((error) => {
              console.error('Error updating balance:', error)
              setMessage('Error updating balance. Please try again.')
            })
        }
      }, spinInterval)

    } catch (error) {
      console.error('Error playing randomizer:', error)
      setMessage('An error occurred. Please try again.')
    }
  }

  const resetGame = () => {
    setGameState('ready')
    setIsSpinning(false)
    setSlots(['🎰', '🎰', '🎰'])
    setResult(null)
    setMessage('')
    // Don't call onComplete() - stay in the game for "Play Again"
  }

  const backToMain = () => {
    setGameState('ready')
    setIsSpinning(false)
    setSlots(['🎰', '🎰', '🎰'])
    setResult(null)
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
            🎲 Randomizer
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Test your luck! Win big or lose big in this thrilling game of chance!
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
              {gameState === 'spinning' && 'Spinning the wheel of fortune...'}
              {gameState === 'result' && `New Balance: ${newBalance} PIE`}
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
              <div className="flex gap-2 justify-center">
                {slots.map((slot, index) => (
                  <div
                    key={index}
                    className={`w-20 h-20 rounded border-2 flex items-center justify-center text-4xl font-bold transition-transform duration-75 ${
                      isSpinning ? 'animate-bounce' : ''
                    }`}
                    style={{ 
                      backgroundColor: 'white',
                      borderColor: '#d1d5db'
                    }}
                  >
                    {slot}
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

        {/* Possible Outcomes */}
        <div 
          className="mt-12 rounded-xl p-6"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--card-text)' }}>🎲 Possible Outcomes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {outcomes.map((outcome, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg shadow-sm"
                style={{ 
                  background: `linear-gradient(to right, ${outcome.color.split(' ')[1]}, ${outcome.color.split(' ')[3]})`
                }}
              >
                <span className="font-bold" style={{ color: 'white' }}>{outcome.emoji}</span>
                <span style={{ color: 'white', marginLeft: '8px' }}>{outcome.message}</span>
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
            <li>• Bet 5 PIE to spin the randomizer</li>
            <li>• 5 possible outcomes ranging from +10 PIE to -10 PIE</li>
            <li>• Watch the slots spin and reveal your fate!</li>
            <li>• 3 plays per day maximum</li>
            <li>• Can you beat the odds and win big?</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
