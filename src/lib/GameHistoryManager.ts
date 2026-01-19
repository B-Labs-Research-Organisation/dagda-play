import fs from 'fs/promises';
import path from 'path';

export type GameType = 'dagdas-cauldron' | 'emerald-flip' | 'coinflip' | 'randomizer';

export interface GameHistoryEntry {
  id: string;
  userId: string;
  username: string;
  gameType: GameType;
  timestamp: number;
  betAmount: number;
  symbols?: string[]; // For cauldron game
  result?: string; // For coin flip games
  winnings: number;
  netChange: number;
  isWin: boolean;
}

export interface UserStats {
  userId: string;
  username: string;
  totalGames: number;
  totalWins: number;
  totalPieWon: number;
  totalPieBet: number;
  largestWin: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayed: number;
  gameTypeStats: Record<GameType, {
    games: number;
    wins: number;
    pieWon: number;
    pieBet: number;
  }>;
}

export class GameHistoryManager {
  private historyFilePath: string;
  private history: GameHistoryEntry[] = [];
  private userStats: Map<string, UserStats> = new Map();

  constructor() {
    // Store in data directory at project root
    this.historyFilePath = path.join(process.cwd(), 'data', 'game-history.json');
    this.ensureDataDirectory();
  }

  /**
   * Ensure the data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  /**
   * Load history from file
   */
  async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.historyFilePath, 'utf-8');
      this.history = JSON.parse(data);
      this.updateStatsFromHistory();
    } catch (error) {
      // File doesn't exist or is invalid, start with empty history
      this.history = [];
      await this.saveHistory();
    }
  }

  /**
   * Save history to file
   */
  async saveHistory(): Promise<void> {
    try {
      const data = JSON.stringify(this.history, null, 2);
      await fs.writeFile(this.historyFilePath, data, 'utf-8');
    } catch (error) {
      console.error('Error saving game history:', error);
    }
  }

  /**
   * Add a new game entry
   */
  async addGameEntry(entry: Omit<GameHistoryEntry, 'id'>): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullEntry: GameHistoryEntry = { ...entry, id };
    
    this.history.push(fullEntry);
    this.updateUserStats(fullEntry);
    await this.saveHistory();
    
    return id;
  }

  /**
   * Update user statistics from a game entry
   */
  private updateUserStats(entry: GameHistoryEntry): void {
    const { userId, username, gameType, winnings, netChange, betAmount, isWin } = entry;
    
    let userStat = this.userStats.get(userId);
    if (!userStat) {
      userStat = {
        userId,
        username,
        totalGames: 0,
        totalWins: 0,
        totalPieWon: 0,
        totalPieBet: 0,
        largestWin: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPlayed: 0,
        gameTypeStats: {
          'dagdas-cauldron': { games: 0, wins: 0, pieWon: 0, pieBet: 0 },
          'emerald-flip': { games: 0, wins: 0, pieWon: 0, pieBet: 0 },
          coinflip: { games: 0, wins: 0, pieWon: 0, pieBet: 0 },
          randomizer: { games: 0, wins: 0, pieWon: 0, pieBet: 0 }
        }
      };
    }

    // Update general stats
    userStat.totalGames++;
    userStat.totalPieBet += betAmount;
    userStat.lastPlayed = entry.timestamp;
    
    if (isWin) {
      userStat.totalWins++;
      userStat.totalPieWon += winnings;
      userStat.currentStreak++;
      
      if (winnings > userStat.largestWin) {
        userStat.largestWin = winnings;
      }
      
      if (userStat.currentStreak > userStat.longestStreak) {
        userStat.longestStreak = userStat.currentStreak;
      }
    } else {
      userStat.currentStreak = 0;
    }

    // Update game type specific stats
    const gameTypeStat = userStat.gameTypeStats[gameType];
    gameTypeStat.games++;
    gameTypeStat.pieBet += betAmount;
    if (isWin) {
      gameTypeStat.wins++;
      gameTypeStat.pieWon += winnings;
    }

    this.userStats.set(userId, userStat);
  }

  /**
   * Update stats from loaded history
   */
  private updateStatsFromHistory(): void {
    this.userStats.clear();
    
    // Sort by timestamp to process in chronological order
    const sortedHistory = [...this.history].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const entry of sortedHistory) {
      this.updateUserStats(entry);
    }
  }

  /**
   * Get game history for a specific user
   */
  getUserHistory(userId: string, limit: number = 50): GameHistoryEntry[] {
    return this.history
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get all game history (with pagination)
   */
  getAllHistory(limit: number = 100, offset: number = 0): GameHistoryEntry[] {
    return this.history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: string): UserStats | null {
    return this.userStats.get(userId) || null;
  }

  /**
   * Get leaderboard sorted by total winnings
   */
  getLeaderboard(limit: number = 20): UserStats[] {
    return Array.from(this.userStats.values())
      .sort((a, b) => b.totalPieWon - a.totalPieWon)
      .slice(0, limit);
  }

  /**
   * Get leaderboard for a specific game type
   */
  getGameTypeLeaderboard(gameType: GameType, limit: number = 20): Array<{
    userId: string;
    username: string;
    games: number;
    wins: number;
    pieWon: number;
    pieBet: number;
    winRate: number;
  }> {
    const results: Array<{
      userId: string;
      username: string;
      games: number;
      wins: number;
      pieWon: number;
      pieBet: number;
      winRate: number;
    }> = [];

    for (const userStat of this.userStats.values()) {
      const gameTypeStat = userStat.gameTypeStats[gameType];
      if (gameTypeStat.games > 0) {
        results.push({
          userId: userStat.userId,
          username: userStat.username,
          games: gameTypeStat.games,
          wins: gameTypeStat.wins,
          pieWon: gameTypeStat.pieWon,
          pieBet: gameTypeStat.pieBet,
          winRate: gameTypeStat.games > 0 ? (gameTypeStat.wins / gameTypeStat.games) * 100 : 0
        });
      }
    }

    return results
      .sort((a, b) => b.pieWon - a.pieWon)
      .slice(0, limit);
  }

  /**
   * Get recent games
   */
  getRecentGames(limit: number = 20): GameHistoryEntry[] {
    return this.history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get daily statistics
   */
  getDailyStats(date: Date = new Date()): {
    date: string;
    totalGames: number;
    totalPlayers: number;
    totalPieBet: number;
    totalPieWon: number;
    mostPlayedGame: GameType;
  } {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayStart = new Date(dateStr).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const dailyGames = this.history.filter(
      entry => entry.timestamp >= dayStart && entry.timestamp < dayEnd
    );
    
    const gameTypeCounts: Record<GameType, number> = {
      'dagdas-cauldron': 0,
      'emerald-flip': 0,
      coinflip: 0,
      randomizer: 0
    };
    
    let totalPieBet = 0;
    let totalPieWon = 0;
    const uniquePlayers = new Set<string>();
    
    for (const game of dailyGames) {
      gameTypeCounts[game.gameType]++;
      totalPieBet += game.betAmount;
      totalPieWon += game.winnings;
      uniquePlayers.add(game.userId);
    }
    
    const mostPlayedGame = Object.entries(gameTypeCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as GameType;
    
    return {
      date: dateStr,
      totalGames: dailyGames.length,
      totalPlayers: uniquePlayers.size,
      totalPieBet,
      totalPieWon,
      mostPlayedGame
    };
  }

  /**
   * Clear all history (for testing/reset)
   */
  async clearHistory(): Promise<void> {
    this.history = [];
    this.userStats.clear();
    await this.saveHistory();
  }

  /**
   * Get total statistics
   */
  getTotalStats(): {
    totalGames: number;
    totalPlayers: number;
    totalPieBet: number;
    totalPieWon: number;
    averageWinRate: number;
  } {
    const totalGames = this.history.length;
    const totalPlayers = this.userStats.size;
    const totalPieBet = this.history.reduce((sum, game) => sum + game.betAmount, 0);
    const totalPieWon = this.history.reduce((sum, game) => sum + game.winnings, 0);
    
    const totalWins = this.history.filter(game => game.isWin).length;
    const averageWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
    
    return {
      totalGames,
      totalPlayers,
      totalPieBet,
      totalPieWon,
      averageWinRate
    };
  }
}
