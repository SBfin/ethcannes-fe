import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { TURN_BASED_SCRATCHER_ABI, getTurnBasedContractAddress } from '../../contracts/config';

interface UseSetHouseOfferReturn {
  setHouseOffer: (gameId: number, offerAmount: number) => Promise<void>;
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
  clearError: () => void;
}

export const useSetHouseOffer = (): UseSetHouseOfferReturn => {
  const [error, setError] = useState<string | null>(null);
  const chainId = useChainId();
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading } = useWaitForTransactionReceipt({
    hash,
  });

  const setHouseOffer = useCallback(async (gameId: number, offerAmount: number) => {
    try {
      setError(null);
      
      const contractAddress = getTurnBasedContractAddress(chainId);
      if (!contractAddress) {
        throw new Error('Contract address not available for this network');
      }
      
      // Convert offer amount to USDC units (6 decimals)
      const offerAmountWei = parseUnits(offerAmount.toString(), 6);
      
      writeContract({
        address: contractAddress,
        abi: TURN_BASED_SCRATCHER_ABI,
        functionName: 'setHouseOffer',
        args: [BigInt(gameId), offerAmountWei],
      });
    } catch (err) {
      console.error('Error setting house offer:', err);
      setError(err instanceof Error ? err.message : 'Failed to set house offer');
    }
  }, [chainId, writeContract]);

  const clearError = useCallback(() => setError(null), []);

  return {
    setHouseOffer,
    isLoading,
    isPending,
    error,
    clearError,
  };
}; 