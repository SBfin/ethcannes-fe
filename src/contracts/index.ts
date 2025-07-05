// Re-export all contract configurations
export * from './config';

// Common contract interaction patterns
export const CONTRACT_FUNCTIONS = {
  // Read functions
  GET_PRIZE_POOL: 'getPrizePool',
  GET_PRIZES: 'getPrizes',
  MAX_PRIZE: 'maxPrize',
  TICKET_PRICE: 'ticketPrice',
  OWNER: 'owner',
  
  // Write functions
  PLAY: 'play',
  ADD_LIQUIDITY: 'addLiquidity',
  WITHDRAW: 'withdraw',
  UPDATE_TICKET_PRICE: 'updateTicketPrice',
} as const;

// Event names for listening to contract events
export const CONTRACT_EVENTS = {
  SCRATCHER_PLAYED: 'ScratcherPlayed',
  LIQUIDITY_ADDED: 'LiquidityAdded',
  TICKET_PRICE_UPDATED: 'TicketPriceUpdated',
  TICKET_PLAYED: 'TicketPlayed',
} as const;

// Common gas limits for different operations
export const GAS_LIMITS = {
  PLAY: BigInt(150000),
  ADD_LIQUIDITY: BigInt(100000),
  WITHDRAW: BigInt(80000),
  UPDATE_PRICE: BigInt(50000),
  APPROVE: BigInt(60000),
} as const;

