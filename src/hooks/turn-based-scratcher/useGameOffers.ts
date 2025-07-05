import { useReadContract, useChainId } from 'wagmi';
import { TURN_BASED_SCRATCHER_ABI, getTurnBasedContractAddress, formatUSDC } from '../../contracts/config';
import { useEffect, useMemo } from 'react';

interface GameData {
  player: `0x${string}`;
  state: number;
  vrfRequestId: bigint;
  chosenCells: readonly [number, number, number, number, number, number, number, number, number];
  isCellChosen: readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  revealedPayouts: readonly [bigint, bigint, bigint];
  offeredPayouts: readonly [bigint, bigint, bigint];
  holeFound: boolean;
  cellPayouts: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  cellRandomValues: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

interface UseGameOffersReturn {
  offers: {
    round1: string | null;
    round2: string | null;
    round3: string | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGameOffers = (gameId: number | null): UseGameOffersReturn => {
  const chainId = useChainId();
  
  const contractAddress = getTurnBasedContractAddress(chainId);
  
  const { 
    data: gameData, 
    isLoading, 
    error, 
    refetch: refetchGame 
  } = useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getGame',
    args: gameId ? [BigInt(gameId)] : undefined,
    query: {
      enabled: !!gameId && !!contractAddress,
    },
  });

  const game = gameData as GameData | undefined;

  // Add debug logging
  useEffect(() => {
    if (game) {
      console.log('📖 [useGameOffers] getGame success:', {
        gameId,
        contractAddress,
        chainId,
        offeredPayouts: game.offeredPayouts,
        timestamp: new Date().toISOString()
      });
    }
    if (error) {
      console.error('❌ [useGameOffers] getGame error:', {
        gameId,
        contractAddress,
        chainId,
        error,
        timestamp: new Date().toISOString()
      });
    }
  }, [game, error, gameId, contractAddress, chainId]);

  // Extract offers from game data
  const offers = useMemo(() => {
    if (!game) {
      return null;
    }
    return {
      round1: game.offeredPayouts[0] > BigInt(0) ? formatUSDC(game.offeredPayouts[0]) : null,
      round2: game.offeredPayouts[1] > BigInt(0) ? formatUSDC(game.offeredPayouts[1]) : null,
      round3: game.offeredPayouts[2] > BigInt(0) ? formatUSDC(game.offeredPayouts[2]) : null,
    };
  }, [game]);

  const refetch = () => {
    refetchGame();
  };

  return {
    offers,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}; 