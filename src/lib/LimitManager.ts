interface GameLimit {
  userId: string
  username: string
  games: {
    [key: string]: {
      count: number
      lastReset: string
    }
  }
}

export class LimitManager {
  private limits: Map<string, GameLimit[]> = new Map()
  private readonly storageKey = 'dagda_limits'

  constructor() {
    this.loadLimits()
  }

  private saveLimits() {
    try {
      if (typeof window === 'undefined') return // Server-side check

      const limitsArray = Array.from(this.limits.values()).flat()
      localStorage.setItem(this.storageKey, JSON.stringify(limitsArray))
    } catch (error) {
      console.error('Error saving limits to localStorage:', error)
    }
  }

  private loadLimits() {
    try {
      if (typeof window === 'undefined') return // Server-side check

      const data = localStorage.getItem(this.storageKey)
      if (!data || !data.trim()) {
        return
      }

      try {
        const limitsArray: GameLimit[] = JSON.parse(data)
        limitsArray.forEach((limit) => {
          const userLimits = this.limits.get(limit.userId) || []
          userLimits.push(limit)
          this.limits.set(limit.userId, userLimits)
        })
      } catch (parseError) {
        console.error('Error parsing limits from localStorage:', parseError)
      }
    } catch (error) {
      console.error('Error loading limits:', error)
    }
  }

  private isNewDay(lastReset: string): boolean {
    const last = new Date(lastReset)
    const now = new Date()
    return (
      last.getUTCDate() !== now.getUTCDate() ||
      last.getUTCMonth() !== now.getUTCMonth() ||
      last.getUTCFullYear() !== now.getUTCFullYear()
    )
  }

  private getResetTimeString(): string {
    const now = new Date()
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
    const msUntilReset = tomorrow.getTime() - now.getTime()
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60))
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60))
    return `${hoursUntilReset}h ${minutesUntilReset}m`
  }

  async checkLimit(userId: string, username: string, game: string): Promise<{ playsRemaining: number; resetsIn: string }> {
    const userLimits = this.limits.get(userId) || []
    const userLimit = userLimits.find((l) => l.userId === userId)

    if (!userLimit || !userLimit.games[game]) {
      return {
        playsRemaining: this.DAILY_LIMITS[game as keyof typeof this.DAILY_LIMITS] || 3,
        resetsIn: this.getResetTimeString(),
      }
    }

    const gameLimit = userLimit.games[game]
    if (this.isNewDay(gameLimit.lastReset)) {
      return {
        playsRemaining: this.DAILY_LIMITS[game as keyof typeof this.DAILY_LIMITS] || 3,
        resetsIn: this.getResetTimeString(),
      }
    }

    const playsRemaining = Math.max(0, (this.DAILY_LIMITS[game as keyof typeof this.DAILY_LIMITS] || 3) - gameLimit.count)
    return {
      playsRemaining,
      resetsIn: this.getResetTimeString(),
    }
  }

  async checkAndUpdateLimit(userId: string, username: string, game: string): Promise<{ canPlay: boolean; remainingPlays: number; resetsIn: string }> {
    const userLimits = this.limits.get(userId) || []
    let userLimit = userLimits.find((l) => l.userId === userId)

    if (!userLimit) {
      userLimit = {
        userId,
        username,
        games: {},
      }
      userLimits.push(userLimit)
    }

    if (!userLimit.games[game]) {
      userLimit.games[game] = {
        count: 0,
        lastReset: new Date().toISOString(),
      }
    }

    const gameLimit = userLimit.games[game]

    // Reset if it's a new day
    if (this.isNewDay(gameLimit.lastReset)) {
      gameLimit.count = 0
      gameLimit.lastReset = new Date().toISOString()
    }

    const maxPlays = this.DAILY_LIMITS[game as keyof typeof this.DAILY_LIMITS] || 3
    const canPlay = gameLimit.count < maxPlays
    const remainingPlays = Math.max(0, maxPlays - gameLimit.count)

    if (canPlay) {
      gameLimit.count++
      this.limits.set(userId, userLimits)
      this.saveLimits()
    }

    return {
      canPlay,
      remainingPlays: remainingPlays - (canPlay ? 1 : 0),
      resetsIn: this.getResetTimeString(),
    }
  }

  private readonly DAILY_LIMITS = {
    coinflip: 3,
    randomizer: 3,
  }
}
