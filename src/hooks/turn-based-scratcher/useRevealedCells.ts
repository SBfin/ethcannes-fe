import { useState, useEffect } from 'react';
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

export const useRevealedCells = (gameId: number | null) => {
  const { chainId } = useAccount();
  const [revealedCells, setRevealedCells] = useState<RevealedCellData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const contractAddress = chainId ? getTurnBasedContractAddress(chainId) : undefined;

  // Get basic game data with dynamic polling
  const { data: gameData } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getGame',
    args: gameId ? [BigInt(gameId)] : undefined,
    query: {
      enabled: !!contractAddress && !!gameId,
      refetchInterval: Date.now() - lastUpdate < 60000 ? 3000 : 20000, // Poll every 3s for first minute, then every 20s
      staleTime: 2000, // Cache for 2 seconds
    },
  });

  // Get round 1 cell results - only poll when round 1+ is complete
  const { data: round1Results } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getRoundCellResults',
    args: gameId ? [BigInt(gameId), 1] : undefined,
    query: {
      enabled: !!contractAddress && !!gameId && !!gameData && (gameData as any)?.state >= 1,
      refetchInterval: Date.now() - lastUpdate < 60000 ? 3000 : 30000, // Poll every 3s for first minute, then every 30s
      staleTime: 2000, // Cache for 2 seconds
    },
  });

  // Get round 2 cell results - only poll when round 2+ is complete
  const { data: round2Results } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getRoundCellResults',
    args: gameId ? [BigInt(gameId), 2] : undefined,
    query: {
      enabled: !!contractAddress && !!gameId && !!gameData && (gameData as any)?.state >= 3,
      refetchInterval: Date.now() - lastUpdate < 60000 ? 3000 : 30000, // Poll every 3s for first minute, then every 30s
      staleTime: 2000, // Cache for 2 seconds
    },
  });

  // Get round 3 cell results - only poll when round 3+ is complete
  const { data: round3Results } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getRoundCellResults',
    args: gameId ? [BigInt(gameId), 3] : undefined,
    query: {
      enabled: !!contractAddress && !!gameId && !!gameData && (gameData as any)?.state >= 5,
      refetchInterval: Date.now() - lastUpdate < 60000 ? 3000 : 30000, // Poll every 3s for first minute, then every 30s
      staleTime: 2000, // Cache for 2 seconds
    },
  });

  useEffect(() => {
    const allCells: RevealedCellData[] = [];

    // Process round 1 results
    if (round1Results && Array.isArray(round1Results) && round1Results.length >= 3) {
      const [cellPayouts, cellRandomValues, cellIndexes] = round1Results;
      for (let i = 0; i < 3; i++) {
        if (Number(cellRandomValues[i]) > 0) { // Only add if actually revealed
          allCells.push({
            cellIndex: Number(cellIndexes[i]),
            randomValue: Number(cellRandomValues[i]),
            payout: Number(cellPayouts[i])
          });
        }
      }
    }

    // Process round 2 results
    if (round2Results && Array.isArray(round2Results) && round2Results.length >= 3) {
      const [cellPayouts, cellRandomValues, cellIndexes] = round2Results;
      for (let i = 0; i < 3; i++) {
        if (Number(cellRandomValues[i]) > 0) {
          allCells.push({
            cellIndex: Number(cellIndexes[i]),
            randomValue: Number(cellRandomValues[i]),
            payout: Number(cellPayouts[i])
          });
        }
      }
    }

    // Process round 3 results
    if (round3Results && Array.isArray(round3Results) && round3Results.length >= 3) {
      const [cellPayouts, cellRandomValues, cellIndexes] = round3Results;
      for (let i = 0; i < 3; i++) {
        if (Number(cellRandomValues[i]) > 0) {
          allCells.push({
            cellIndex: Number(cellIndexes[i]),
            randomValue: Number(cellRandomValues[i]),
            payout: Number(cellPayouts[i])
          });
        }
      }
    }

    if (allCells.length > 0) {
      console.log('🎯 All revealed cells from getRoundCellResults:', allCells);
      setRevealedCells(allCells);
      setLastUpdate(Date.now());
    }
  }, [round1Results, round2Results, round3Results]);

  return {
    revealedCells,
    refetchCells: () => {}, // The individual hooks will handle refetching
  };
}; 