import TurnBasedScratcherABI from './TurnBasedScratcher.abi.json';

// Contract addresses
export const CONTRACTS = {
  RONIN_MAINNET: {
    TURN_BASED_SCRATCHER: '0xA5a2250b0170bdb9bd0904C0440717f00A506023' as `0x${string}`,
    USDC: '0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc' as `0x${string}`,
    VRF_COORDINATOR: '0x16a62a921e7fec5bf867ff5c805b662db757b778' as `0x${string}`,
  },
  SAIGON_TESTNET: {
    TURN_BASED_SCRATCHER: undefined, // Will be set after deployment
    USDC: undefined, // Need to find testnet USDC address
    VRF_COORDINATOR: '0xa60c1e07fa030e4b49eb54950adb298ab94dd312' as `0x${string}`,
  },
} as const;

// Network configuration
export const NETWORKS = {
  RONIN_MAINNET: {
    chainId: 2020,
    name: 'Ronin',
    rpcUrl: 'https://api.roninchain.com/rpc',
    blockExplorer: 'https://explorer.roninchain.com',
  },
  SAIGON_TESTNET: {
    chainId: 2021,
    name: 'Saigon Testnet',
    rpcUrl: 'https://saigon-testnet.roninchain.com/rpc',
    blockExplorer: 'https://saigon-explorer.roninchain.com',
  },
} as const;

// Contract ABI
export const TURN_BASED_SCRATCHER_ABI = TurnBasedScratcherABI;

// Game configuration
export const GAME_CONFIG = {
  TICKET_PRICE: '1000000', // 1 USDC (6 decimals)
  DECIMALS: 6,
  SYMBOLS: {
    '💎1': { amount: '100000000', symbol: '💎1', name: 'Diamond Crown', chance: 0.5 },
    '💎2': { amount: '25000000', symbol: '💎2', name: 'Golden Crown', chance: 1.5 },
    '💎3': { amount: '8000000', symbol: '💎3', name: 'Gold Treasure', chance: 3 },
    '💰': { amount: '2000000', symbol: '💰', name: 'Trophy', chance: 10 },
    '1': { amount: '1000000', symbol: '1', name: 'Blue Diamond', chance: 11 },
    '🍒': { amount: '500000', symbol: '🍒', name: 'Cherry', chance: 15 },
    '⭐': { amount: '200000', symbol: '⭐', name: 'Star', chance: 25 },
    '🗿': { amount: '100000', symbol: '🗿', name: 'Stone', chance: 30 },
    '🕳️': { amount: '0', symbol: '🕳️', name: 'Hole/Trap', chance: 4 },
  },
} as const;

// Helper functions
export const getTurnBasedContractAddress = (chainId: number): `0x${string}` | undefined => {
  switch (chainId) {
    case NETWORKS.RONIN_MAINNET.chainId:
      return CONTRACTS.RONIN_MAINNET.TURN_BASED_SCRATCHER;
    case NETWORKS.SAIGON_TESTNET.chainId:
      return CONTRACTS.SAIGON_TESTNET.TURN_BASED_SCRATCHER;
    default:
      return undefined;
  }
};

export const getUSDCAddress = (chainId: number): `0x${string}` | undefined => {
  switch (chainId) {
    case NETWORKS.RONIN_MAINNET.chainId:
      return CONTRACTS.RONIN_MAINNET.USDC;
    case NETWORKS.SAIGON_TESTNET.chainId:
      return CONTRACTS.SAIGON_TESTNET.USDC;
    default:
      return undefined;
  }
};

export const getVRFCoordinatorAddress = (chainId: number): `0x${string}` | undefined => {
  switch (chainId) {
    case NETWORKS.RONIN_MAINNET.chainId:
      return CONTRACTS.RONIN_MAINNET.VRF_COORDINATOR;
    case NETWORKS.SAIGON_TESTNET.chainId:
      return CONTRACTS.SAIGON_TESTNET.VRF_COORDINATOR;
    default:
      return undefined;
  }
};

export const getNetworkConfig = (chainId: number) => {
  switch (chainId) {
    case NETWORKS.RONIN_MAINNET.chainId:
      return NETWORKS.RONIN_MAINNET;
    case NETWORKS.SAIGON_TESTNET.chainId:
      return NETWORKS.SAIGON_TESTNET;
    default:
      return undefined;
  }
};

export const isNetworkSupported = (chainId: number): boolean => {
  return chainId === NETWORKS.RONIN_MAINNET.chainId || chainId === NETWORKS.SAIGON_TESTNET.chainId;
};

export const formatUSDC = (amount: string | bigint): string => {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  const formatted = Number(amountBigInt) / Math.pow(10, GAME_CONFIG.DECIMALS);
  return formatted.toFixed(2);
};

export const parseUSDC = (amount: string): string => {
  const parsed = parseFloat(amount) * Math.pow(10, GAME_CONFIG.DECIMALS);
  return Math.floor(parsed).toString();
}; 