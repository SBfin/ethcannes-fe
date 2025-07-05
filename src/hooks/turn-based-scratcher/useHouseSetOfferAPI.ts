import { useState, useCallback } from 'react';

interface UseHouseSetOfferAPIReturn {
  setHouseOffer: (gameId: number, offerAmount: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useHouseSetOfferAPI = (): UseHouseSetOfferAPIReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setHouseOffer = useCallback(async (gameId: number, offerAmount: number) => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('Making API call to set house offer:', { gameId, offerAmount });
      
      const response = await fetch('/api/house/set-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          offerAmount,
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Error response content-type:', contentType);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            console.log('Error response data:', errorData);
            errorMessage = errorData.error || errorData.details || errorMessage;
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
          }
        } else {
          const textResponse = await response.text();
          console.log('Error response text:', textResponse);
          errorMessage = textResponse || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('House offer set successfully:', result);
      
    } catch (err) {
      console.error('Error setting house offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to set house offer';
      setError(errorMessage);
      throw err; // Re-throw to allow calling code to handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    setHouseOffer,
    isLoading,
    error,
    clearError,
  };
}; 