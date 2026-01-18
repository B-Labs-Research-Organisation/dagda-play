interface UserBalance {
  userId: string
  username: string
  balance: number
}

export class BalanceManager {
  private balances: Map<string, UserBalance[]> = new Map()
  private readonly storageKey = 'dagda_balances'

  constructor() {
    this.loadBalances()
  }

  private saveBalances() {
    try {
      const balancesArray = Array.from(this.balances.values()).flat()
      localStorage.setItem(this.storageKey, JSON.stringify(balancesArray))
    } catch (error) {
      console.error('Error saving balances to localStorage:', error)
    }
  }

  private loadBalances() {
    try {
      if (typeof window === 'undefined') return // Server-side check

      const data = localStorage.getItem(this.storageKey)
      if (!data || !data.trim()) {
        return
      }

      try {
        const balancesArray: UserBalance[] = JSON.parse(data)
        balancesArray.forEach((balance) => {
          const userBalances = this.balances.get(balance.userId) || []
          userBalances.push(balance)
          this.balances.set(balance.userId, userBalances)
        })
      } catch (parseError) {
        console.error('Error parsing balances from localStorage:', parseError)
      }
    } catch (error) {
      console.error('Error loading balances:', error)
    }
  }

  async getBalance(userId: string, username: string): Promise<number> {
    const userBalances = this.balances.get(userId) || []
    const user = userBalances.find((b) => b.userId === userId)

    if (!user) {
      const newUser: UserBalance = { userId, username, balance: 50 }
      userBalances.push(newUser)
      this.balances.set(userId, userBalances)
      this.saveBalances()
      return 50
    }
    return user.balance
  }

  async updateBalance(userId: string, username: string, amount: number): Promise<number> {
    const currentBalance = await this.getBalance(userId, username)
    const newBalance = currentBalance + amount

    if (newBalance < 0) {
      throw new Error('Insufficient balance')
    }

    const userBalances = this.balances.get(userId) || []
    const userIndex = userBalances.findIndex((b) => b.userId === userId)

    if (userIndex >= 0) {
      userBalances[userIndex].balance = newBalance
    } else {
      userBalances.push({ userId, username, balance: newBalance })
    }

    this.balances.set(userId, userBalances)
    this.saveBalances()
    return newBalance
  }

  async getTopPlayers(limit: number): Promise<UserBalance[]> {
    const allBalances = Array.from(this.balances.values()).flat()
    const sortedPlayers = [...allBalances].sort((a, b) => b.balance - a.balance)
    return sortedPlayers.slice(0, limit)
  }
}
