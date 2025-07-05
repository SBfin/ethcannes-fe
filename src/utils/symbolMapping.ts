// Symbol mapping based on the payout structure from TurnScratcher.sol
// Payouts are in USDC (6 decimals), so divide by 1e6 to get actual USDC amounts

export interface SymbolInfo {
  symbol: string;
  name: string;
  payoutUSDC: number;
  rarity: string;
  color: string;
  probability: number; // Percentage chance
}

export const SYMBOL_MAPPING: Record<number, SymbolInfo> = {
  // $100 USDC - 0.5% chance - Ultra Legendary
  100000000: {
    symbol: '💎',
    name: 'Diamond Crown',
    payoutUSDC: 100,
    rarity: 'Ultra Legendary',
    color: '#ff6b9d',
    probability: 0.5
  },
  
  // $25 USDC - 1.5% chance - Legendary  
  25000000: {
    symbol: '👑',
    name: 'Golden Crown',
    payoutUSDC: 25,
    rarity: 'Legendary',
    color: '#ffd700',
    probability: 1.5
  },
  
  // $8 USDC - 3% chance - Epic
  8000000: {
    symbol: '💰',
    name: 'Gold Treasure',
    payoutUSDC: 8,
    rarity: 'Epic',
    color: '#ff8c00',
    probability: 3.0
  },
  
  // $2 USDC - 10% chance - Rare
  2000000: {
    symbol: '🏆',
    name: 'Trophy',
    payoutUSDC: 2,
    rarity: 'Rare',
    color: '#4169e1',
    probability: 10.0
  },
  
  // $1 USDC - 11% chance - Uncommon
  1000000: {
    symbol: '💎',
    name: 'Blue Diamond',
    payoutUSDC: 1,
    rarity: 'Uncommon',
    color: '#00bfff',
    probability: 11.0
  },
  
  // $0.50 USDC - 15% chance - Common
  500000: {
    symbol: '🍒',
    name: 'Cherry',
    payoutUSDC: 0.5,
    rarity: 'Common',
    color: '#dc143c',
    probability: 15.0
  },
  
  // $0.20 USDC - 25% chance - Common
  200000: {
    symbol: '⭐',
    name: 'Star',
    payoutUSDC: 0.2,
    rarity: 'Common',
    color: '#ffa500',
    probability: 25.0
  },
  
  // $0.10 USDC - 30% chance - Common
  100000: {
    symbol: '🗿',
    name: 'Stone',
    payoutUSDC: 0.10,
    rarity: 'Common',
    color: '#696969',
    probability: 30.0
  },
  
  // $0 USDC - 4% chance - Hole (Game Over)
  0: {
    symbol: '🕳️',
    name: 'Hole',
    payoutUSDC: 0,
    rarity: 'Hole',
    color: '#000000',
    probability: 4.0
  }
};

// Helper function to get symbol info by payout amount
export const getSymbolByPayout = (payoutMicroUSDC: number): SymbolInfo => {
  return SYMBOL_MAPPING[payoutMicroUSDC] || SYMBOL_MAPPING[0]; // Default to hole if not found
};

// Helper function to get symbol by random value (matches TurnScratcher.sol exactly)
export const getSymbolByRandomValue = (randomValue: number): SymbolInfo => {
  const roll = randomValue % 100000;
  
  // 💎 (Diamond Crown) - 0.5% chance, $100 payout
  if (roll < 500) return SYMBOL_MAPPING[100000000];
  
  // 👑 (Golden Crown) - 1.5% chance, $25 payout  
  else if (roll < 2000) return SYMBOL_MAPPING[25000000];
  
  // 💰 (Gold Treasure) - 3% chance, $8 payout
  else if (roll < 5000) return SYMBOL_MAPPING[8000000];
  
  // 🏆 (Trophy) - 10% chance, $2 payout
  else if (roll < 15000) return SYMBOL_MAPPING[2000000];
  
  // 💎 (Blue Diamond) - 11% chance, $1 payout
  else if (roll < 26000) return SYMBOL_MAPPING[1000000];
  
  // 🍒 (Cherry) - 15% chance, $0.50 payout
  else if (roll < 41000) return SYMBOL_MAPPING[500000];
  
  // ⭐ (Star) - 25% chance, $0.20 payout
  else if (roll < 66000) return SYMBOL_MAPPING[200000];
  
  // 🗿 (Stone) - 30% chance, $0.10 payout
  else if (roll < 96000) return SYMBOL_MAPPING[100000];
  
  // 🕳️ (Hole) - 4% chance, $0 payout (GAME OVER)
  else if (roll < 100000) return SYMBOL_MAPPING[0];
  
  // Fallback to hole
  else return SYMBOL_MAPPING[0];
};

// Helper function to format payout display
export const formatPayout = (payoutUSDC: number): string => {
  if (payoutUSDC === 0) return 'No Prize';
  if (payoutUSDC >= 1) return `$${payoutUSDC.toFixed(0)}`;
  return `$${payoutUSDC.toFixed(2)}`;
};

// Helper function to get rarity color
export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'Ultra Legendary': return '#ff6b9d';
    case 'Legendary': return '#ffd700';
    case 'Epic': return '#ff8c00';
    case 'Rare': return '#4169e1';
    case 'Uncommon': return '#00bfff';
    case 'Common': return '#32cd32';
    case 'Hole': return '#000000';
    default: return '#666666';
  }
}; 