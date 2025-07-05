# Smart Contract Integration

This folder contains all the necessary files for interacting with the Scratcher Game smart contract.

## Files

- **`ScratchGameUSDC.abi.json`** - Contract ABI extracted from Forge
- **`config.ts`** - Contract addresses, network configs, and helper functions
- **`index.ts`** - Re-exports and common constants for easy importing

## Usage

### Basic Import
```typescript
import { 
  CONTRACTS, 
  SCRATCH_GAME_ABI, 
  getContractAddress,
  formatUSDC 
} from '@/contracts';
```

### Get Contract Address for Current Network
```typescript
import { getContractAddress } from '@/contracts';

const contractAddress = getContractAddress(8453); // Base mainnet
```

### Format USDC Amounts
```typescript
import { formatUSDC, parseUSDC } from '@/contracts';

const readable = formatUSDC('1000000'); // "1.00"
const parsed = parseUSDC('1.00'); // "1000000"
```

### Use with wagmi/viem
```typescript
import { useContractRead } from 'wagmi';
import { SCRATCH_GAME_ABI, getContractAddress } from '@/contracts';

const { data: prizePool } = useContractRead({
  address: getContractAddress(chainId),
  abi: SCRATCH_GAME_ABI,
  functionName: 'getPrizePool',
});
```

## Contract Information

- **Base Mainnet**: `0xC382ee1E963c12d676CaEA9B25f712591A41398A`
- **Ticket Price**: 1 USDC
- **Max Prize**: 5 USDC
- **USDC Contract**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Prize Structure

| Symbol | Amount | Probability |
|--------|--------|-------------|
| 🍒 Cherry | $0.00 | 60% |
| 🔔 Bell | $0.50 | 25% |
| 💎 Diamond | $1.00 | 10% |
| �� Bar | $5.00 | 5% | 