import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import {
  TURN_BASED_SCRATCHER_ABI,
  getTurnBasedContractAddress,
} from '../../contracts/config';

export interface RevealedCellData {
  cellIndex: number;
  randomValue: number;
  payout: number;
}

interface GameData {
  state: number;
  // Other properties of the game data can be added here
}

const useRoundResults = (
  gameId: number | null,
  roundNumber: number,
  isEnabled: boolean,
) => {
  const { chainId } = useAccount();
  const contractAddress = chainId
    ? getTurnBasedContractAddress(chainId)
    : undefined;

  return useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getRoundCellResults',
    args: gameId ? [BigInt(gameId), roundNumber] : undefined,
    query: {
      enabled: isEnabled,
      refetchInterval: 5000, // Poll every 5 seconds when active
      staleTime: 4000,
    },
  });
};

export const useRevealedCells = (gameId: number | null) => {
  const { chainId } = useAccount();
  const [revealedCells, setRevealedCells] = useState<RevealedCellData[]>([]);
  const contractAddress = chainId
    ? getTurnBasedContractAddress(chainId)
    : undefined;

  const { data: gameData, refetch: refetchGameData } = useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getGame',
    args: gameId ? [BigInt(gameId)] : undefined,
    query: {
      enabled: !!contractAddress && !!gameId,
      refetchInterval: 5000,
      staleTime: 4000,
    },
  });

  const gameState = (gameData as GameData | undefined)?.state;

  const { data: round1Results, refetch: refetchRound1 } = useRoundResults(
    gameId,
    1,
    !!gameState && gameState >= 1,
  );
  const { data: round2Results, refetch: refetchRound2 } = useRoundResults(
    gameId,
    2,
    !!gameState && gameState >= 3,
  );
  const { data: round3Results, refetch: refetchRound3 } = useRoundResults(
    gameId,
    3,
    !!gameState && gameState >= 5,
  );

  useEffect(() => {
    const processResults = (
      results: readonly [bigint[], bigint[], bigint[]] | undefined,
    ): RevealedCellData[] => {
      if (!results || !Array.isArray(results) || results.length < 3) return [];

      const [cellPayouts, cellRandomValues, cellIndexes] = results;
      const cells: RevealedCellData[] = [];

      for (let i = 0; i < cellIndexes.length; i++) {
        if (Number(cellRandomValues[i]) > 0) {
          cells.push({
            cellIndex: Number(cellIndexes[i]),
            randomValue: Number(cellRandomValues[i]),
            payout: Number(cellPayouts[i]),
          });
        }
      }
      return cells;
    };

    const allCells = [
      ...processResults(round1Results as any),
      ...processResults(round2Results as any),
      ...processResults(round3Results as any),
    ];

    if (allCells.length > revealedCells.length) {
      setRevealedCells(allCells);
    }
  }, [round1Results, round2Results, round3Results, revealedCells.length]);

  const refetchCells = useCallback(() => {
    refetchGameData();
    refetchRound1();
    refetchRound2();
    refetchRound3();
  }, [refetchGameData, refetchRound1, refetchRound2, refetchRound3]);

  return {
    revealedCells,
    refetchCells,
  };
}; 