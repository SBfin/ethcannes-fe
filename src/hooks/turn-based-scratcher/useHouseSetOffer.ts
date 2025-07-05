import { useState, useCallback } from 'react';
import { useChainId } from 'wagmi';
import { createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ronin } from 'viem/chains';
import { TURN_BASED_SCRATCHER_ABI, getTurnBasedContractAddress } from '../../contracts/config';
import { getHousePrivateKey } from '../../utils/houseKey';

interface UseHouseSetOfferReturn {
  setHouseOffer: (gameId: number, offerAmount: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useHouseSetOffer = (): UseHouseSetOfferReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chainId = useChainId();

  const setHouseOffer = useCallback(async (gameId: number, offerAmount: number) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const contractAddress = getTurnBasedContractAddress(chainId);
      if (!contractAddress) {
        throw new Error('Contract address not available for this network');
      }

      // Get house private key
      const privateKey = getHousePrivateKey();
      const account = privateKeyToAccount(`0x${privateKey}`);

      // Create wallet client with house account
      const walletClient = createWalletClient({
        account,
        chain: ronin,
        transport: http('https://api.roninchain.com/rpc')
      });

      // Convert offer amount to USDC units (6 decimals)
      const offerAmountWei = parseUnits(offerAmount.toString(), 6);

      // Send transaction using house private key
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: TURN_BASED_SCRATCHER_ABI,
        functionName: 'setHouseOffer',
        args: [BigInt(gameId), offerAmountWei],
      });

      console.log('House offer set, transaction hash:', hash);
    } catch (err) {
      console.error('Error setting house offer:', err);
      setError(err instanceof Error ? err.message : 'Failed to set house offer');
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    setHouseOffer,
    isLoading,
    error,
    clearError,
  };
}; 