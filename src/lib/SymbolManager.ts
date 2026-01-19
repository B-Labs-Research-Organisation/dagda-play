export type Symbol = 'harp' | 'club' | 'cauldron' | 'wolfhound' | 'shamrock';

export interface SymbolConfig {
  value: number;
  weight: number; // Higher weight = more likely to appear
}

export interface SymbolSet {
  symbols: Symbol[];
  isWin: boolean;
  winType: 'none' | 'two-match' | 'jackpot';
  matchingSymbol?: Symbol;
}

export class SymbolManager {
  private symbols: Record<Symbol, SymbolConfig> = {
    harp: { value: 5, weight: 10 },
    club: { value: 3, weight: 15 },
    cauldron: { value: 4, weight: 12 },
    wolfhound: { value: 2, weight: 18 },
    shamrock: { value: 1, weight: 20 }
  };

  private winProbabilities = {
    anyWin: 0.25, // 25% chance of any win (reduced from 30%)
    jackpot: 0.01, // 1% of total games (reduced from 2%)
    twoMatch: 0.06 // 6% of total games (reduced from 8%)
  };

  /**
   * Generate a random symbol based on weighted probabilities
   */
  generateRandomSymbol(): Symbol {
    const totalWeight = Object.values(this.symbols).reduce((sum, config) => sum + config.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const [symbol, config] of Object.entries(this.symbols) as [Symbol, SymbolConfig][]) {
      random -= config.weight;
      if (random <= 0) {
        return symbol;
      }
    }
    
    // Fallback to first symbol
    return 'shamrock';
  }

  /**
   * Generate a set of 3 symbols with controlled win probabilities
   */
  generateSymbolSet(): SymbolSet {
    const shouldWin = Math.random() < this.winProbabilities.anyWin;
    
    if (!shouldWin) {
      // Generate losing combination (no matches)
      const symbols = this.generateLosingCombination();
      return {
        symbols,
        isWin: false,
        winType: 'none'
      };
    }
    
    // Determine win type
    const winTypeRandom = Math.random();
    if (winTypeRandom < this.winProbabilities.jackpot / this.winProbabilities.anyWin) {
      // Jackpot - all three match
      const symbol = this.generateRandomSymbol();
      return {
        symbols: [symbol, symbol, symbol],
        isWin: true,
        winType: 'jackpot',
        matchingSymbol: symbol
      };
    } else {
      // Two matching symbols
      const matchingSymbol = this.generateRandomSymbol();
      const thirdSymbol = this.generateDifferentSymbol(matchingSymbol);
      const position = Math.floor(Math.random() * 3);
      
      const symbols: Symbol[] = [matchingSymbol, matchingSymbol, thirdSymbol];
      // Randomize which position has the different symbol
      if (position === 0) {
        symbols[0] = thirdSymbol;
        symbols[1] = matchingSymbol;
        symbols[2] = matchingSymbol;
      } else if (position === 1) {
        symbols[0] = matchingSymbol;
        symbols[1] = thirdSymbol;
        symbols[2] = matchingSymbol;
      }
      // position === 2 keeps the default [match, match, different]
      
      return {
        symbols,
        isWin: true,
        winType: 'two-match',
        matchingSymbol
      };
    }
  }

  /**
   * Generate a losing combination (no two symbols match)
   */
  private generateLosingCombination(): Symbol[] {
    const symbols: Symbol[] = [];
    const availableSymbols: Symbol[] = Object.keys(this.symbols) as Symbol[];
    
    for (let i = 0; i < 3; i++) {
      let symbol: Symbol;
      let attempts = 0;
      
      do {
        symbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
        attempts++;
        
        // If we're stuck, allow some repetition but not all three the same
        if (attempts > 10) {
          // Check if we already have two of this symbol
          const count = symbols.filter(s => s === symbol).length;
          if (count < 2) {
            break;
          }
        }
      } while (symbols.includes(symbol) && symbols.length === 2 && symbols[0] === symbols[1]);
      
      symbols.push(symbol);
    }
    
    // Ensure we don't accidentally create a winning combination
    if (this.isWinningCombination(symbols)) {
      // Swap the last symbol with a different one
      const differentSymbol = this.generateDifferentSymbol(symbols[0]);
      symbols[2] = differentSymbol;
    }
    
    return symbols;
  }

  /**
   * Generate a symbol different from the given one
   */
  private generateDifferentSymbol(avoidSymbol: Symbol): Symbol {
    const availableSymbols = (Object.keys(this.symbols) as Symbol[]).filter(s => s !== avoidSymbol);
    return availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
  }

  /**
   * Check if a combination is winning
   */
  isWinningCombination(symbols: Symbol[]): boolean {
    const first = symbols[0];
    const allMatch = symbols.every(s => s === first);
    const twoMatch = symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2];
    return allMatch || twoMatch;
  }

  /**
   * Calculate payout for a symbol set
   */
  calculatePayout(symbols: Symbol[], betMultiplier: number = 1): { amount: number; winType: 'none' | 'two-match' | 'jackpot'; message: string; emoji: string } {
    const firstSymbol = symbols[0];
    const allMatch = symbols.every(s => s === firstSymbol);
    const twoMatch = symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2];
    
    let amount = 0;
    let winType: 'none' | 'two-match' | 'jackpot' = 'none';
    let message = '';
    let emoji = '';
    
    if (allMatch) {
      // Triple match: symbol value × 5 × bet multiplier
      amount = this.symbols[firstSymbol].value * 5 * betMultiplier;
      winType = 'jackpot';
      message = '✨ Dagda\'s Blessing! The cauldron overflows with fortune!';
      emoji = '🍀';
    } else if (twoMatch) {
      // Two match: find matching symbol
      const matchingSymbol = symbols.find((symbol, index) => 
        index < 2 && symbols[index + 1] === symbol
      ) || symbols[0];
      amount = this.symbols[matchingSymbol].value * 2 * betMultiplier;
      winType = 'two-match';
      message = '� The harp sings! A fine win from the cauldron!';
      emoji = '🎵';
    } else {
      // No match
      message = 'The cauldron bubbles but yields no fortune. Try again!';
      emoji = '🍲';
    }
    
    return { amount, winType, message, emoji };
  }

  /**
   * Apply a nudge to shift one specific symbol based on direction
   */
  applyNudge(symbols: Symbol[], direction: 'left' | 'right' | 'middle'): Symbol[] {
    const newSymbols = [...symbols];
    
    // Determine which position to nudge based on direction
    let position: number;
    switch (direction) {
      case 'left':
        position = 0; // Left symbol
        break;
      case 'middle':
        position = 1; // Middle symbol
        break;
      case 'right':
        position = 2; // Right symbol
        break;
      default:
        position = Math.floor(Math.random() * 3);
    }
    
    // Get a different symbol for the nudged position
    const currentSymbol = newSymbols[position];
    const differentSymbol = this.generateDifferentSymbol(currentSymbol);
    newSymbols[position] = differentSymbol;
    
    return newSymbols;
  }

  /**
   * Get symbol value
   */
  getSymbolValue(symbol: Symbol): number {
    return this.symbols[symbol].value;
  }

  /**
   * Get all symbols
   */
  getAllSymbols(): Symbol[] {
    return Object.keys(this.symbols) as Symbol[];
  }
}
