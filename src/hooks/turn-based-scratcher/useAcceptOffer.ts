import { useState, useCallback } from 'react';
import { getErrorMessage } from '../../utils/errorHandling';

interface UseAcceptOfferReturn {
  acceptOffer: (gameId: number) => Promise<void>;
  isLoading: boolean;
  isConfirmed: boolean;
  error: string | null;
  txHash: string | null;
}

export const useAcceptOffer = (): UseAcceptOfferReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const acceptOffer = useCallback(async (gameId: number) => {
    if (!gameId) {
      setError('No game ID provided.');
      return;
    }

    setIsLoading(true);
    setIsConfirmed(false);
    setError(null);
    setTxHash(null);

    try {
      const response = await fetch('/api/house/accept-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to accept offer');
      }

      setTxHash(data.hash);
      setIsConfirmed(true);

    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    acceptOffer,
    isLoading,
    isConfirmed,
    error,
    txHash,
  };
}; 