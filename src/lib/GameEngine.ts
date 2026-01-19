import { SymbolManager, type Symbol } from './SymbolManager';

export type GameState = 'ready' | 'stirring' | 'result' | 'nudge' | 'complete';
export type BetMultiplier = 1 | 2 | 5;

export interface GameResult {
  symbols: Symbol[];
  amount: number;
  winType: 'none' | 'two-match' | 'jackpot';
  message: string;
  emoji: string;
  isWin: boolean;
}

export interface GameStats {
  totalPlays: number;
  totalWins: number;
  totalPieWon: number;
  totalPieBet: number;
  largestWin: number;
  currentStreak: number;
  longestStreak: number;
}

export class GameEngine {
  private symbolManager: SymbolManager;
  private currentSymbols: Symbol[] = [];
  private currentBetMultiplier: BetMultiplier = 1;
  private currentResult: GameResult | null = null;
  private nudgesRemaining: number = 3;
  private nudgeCost: number = 1;
  private gameStats: GameStats = {
    totalPlays: 0,
    totalWins: 0,
    totalPieWon: 0,
    totalPieBet: 0,
    largestWin: 0,
    currentStreak: 0,
    longestStreak: 0
  };

  constructor() {
    this.symbolManager = new SymbolManager();
  }

  /**
   * Start a new game with the given bet multiplier
   */
  startGame(betMultiplier: BetMultiplier = 1): void {
    this.currentBetMultiplier = betMultiplier;
    this.nudgesRemaining = 3;
    this.nudgeCost = 1;
    this.currentResult = null;
    
    // Generate initial symbols
    const symbolSet = this.symbolManager.generateSymbolSet();
    this.currentSymbols = symbolSet.symbols;
    
    // Calculate initial result
    this.calculateResult();
    
    // Update stats
    this.updateStats();
  }

  /**
   * Calculate the current result based on symbols
   */
  private calculateResult(): void {
    const payout = this.symbolManager.calculatePayout(this.currentSymbols, this.currentBetMultiplier);
    
    this.currentResult = {
      symbols: this.currentSymbols,
      amount: payout.amount,
      winType: payout.winType,
      message: payout.message,
      emoji: payout.emoji,
      isWin: payout.winType !== 'none'
    };
  }

  /**
   * Apply a nudge to the current symbols
   */
  applyNudge(direction: 'left' | 'right'): { success: boolean; newSymbols: Symbol[]; cost: number } {
    if (this.nudgesRemaining <= 0) {
      return { success: false, newSymbols: this.currentSymbols, cost: 0 };
    }

    // Apply nudge to change one random symbol
    const newSymbols = this.symbolManager.applyNudge(this.currentSymbols, direction);
    this.currentSymbols = newSymbols;
    
    // Recalculate result with new symbols
    this.calculateResult();
    
    // Update nudge state
    this.nudgesRemaining--;
    this.nudgeCost++;
    
    return { success: true, newSymbols, cost: this.nudgeCost - 1 }; // Return cost of this nudge
  }

  /**
   * Get the current game result
   */
  getResult(): GameResult | null {
    return this.currentResult;
  }

  /**
   * Get the current symbols
   */
  getSymbols(): Symbol[] {
    return this.currentSymbols;
  }

  /**
   * Get the bet amount for the current multiplier
   */
  getBetAmount(): number {
    return 5 * this.currentBetMultiplier;
  }

  /**
   * Get the current bet multiplier
   */
  getBetMultiplier(): BetMultiplier {
    return this.currentBetMultiplier;
  }

  /**
   * Set the bet multiplier
   */
  setBetMultiplier(multiplier: BetMultiplier): void {
    this.currentBetMultiplier = multiplier;
  }

  /**
   * Get nudge information
   */
  getNudgeInfo(): { remaining: number; cost: number } {
    return {
      remaining: this.nudgesRemaining,
      cost: this.nudgeCost
    };
  }

  /**
   * Check if nudges are available
   */
  canNudge(): boolean {
    return this.nudgesRemaining > 0;
  }

  /**
   * Get the net winnings (payout minus bet)
   */
  getNetWinnings(): number {
    if (!this.currentResult) return 0;
    return this.currentResult.amount - this.getBetAmount();
  }

  /**
   * Update game statistics
   */
  private updateStats(): void {
    if (!this.currentResult) return;

    this.gameStats.totalPlays++;
    this.gameStats.totalPieBet += this.getBetAmount();
    
    if (this.currentResult.isWin) {
      this.gameStats.totalWins++;
      this.gameStats.totalPieWon += this.currentResult.amount;
      this.gameStats.currentStreak++;
      
      if (this.currentResult.amount > this.gameStats.largestWin) {
        this.gameStats.largestWin = this.currentResult.amount;
      }
      
      if (this.gameStats.currentStreak > this.gameStats.longestStreak) {
        this.gameStats.longestStreak = this.gameStats.currentStreak;
      }
    } else {
      this.gameStats.currentStreak = 0;
    }
  }

  /**
   * Get current game statistics
   */
  getStats(): GameStats {
    return { ...this.gameStats };
  }

  /**
   * Reset game statistics
   */
  resetStats(): void {
    this.gameStats = {
      totalPlays: 0,
      totalWins: 0,
      totalPieWon: 0,
      totalPieBet: 0,
      largestWin: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  /**
   * Get win rate percentage
   */
  getWinRate(): number {
    if (this.gameStats.totalPlays === 0) return 0;
    return (this.gameStats.totalWins / this.gameStats.totalPlays) * 100;
  }

  /**
   * Get return on investment percentage
   */
  getROI(): number {
    if (this.gameStats.totalPieBet === 0) return 0;
    return ((this.gameStats.totalPieWon - this.gameStats.totalPieBet) / this.gameStats.totalPieBet) * 100;
  }

  /**
   * Get all available symbols
   */
  getAllSymbols(): Symbol[] {
    return this.symbolManager.getAllSymbols();
  }

  /**
   * Get symbol value
   */
  getSymbolValue(symbol: Symbol): number {
    return this.symbolManager.getSymbolValue(symbol);
  }

  /**
   * Check if symbols form a winning combination
   */
  isWinningCombination(symbols: Symbol[]): boolean {
    return this.symbolManager.isWinningCombination(symbols);
  }

  /**
   * Complete the game (after nudges or player chooses to stop)
   */
  completeGame(): void {
    // Any final cleanup if needed
  }
}
