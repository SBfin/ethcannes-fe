import { formatUnits } from 'viem';

export const formatUSDC = (amount: bigint) => {
  return parseFloat(formatUnits(amount, 6)).toFixed(2);
}; 