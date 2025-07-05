import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import {
  TURN_BASED_SCRATCHER_ABI,
  getTurnBasedContractAddress,
} from '../../contracts/config';

export const useSimpleGameWatcher = (gameId: number | null) => {
  const { chainId } = useAccount();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const contractAddress = chainId ? getTurnBasedContractAddress(chainId) : undefined;

  // Read current game data with much less aggressive polling
  const { data: gameData, refetch: refetchGameData } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getGame',
    args: gameId ? [BigInt(gameId)] : undefined,
    query: {
      enabled: !!contractAddress && !!gameId,
      refetchInterval: 15000, // Poll every 15 seconds instead of 3
      staleTime: 10000, // Cache for 10 seconds
    },
  });

  // Add debug logging
  useEffect(() => {
    if (gameData) {
      console.log('📖 [useSimpleGameWatcher] getGame success:', {
        gameId,
        contractAddress,
        chainId,
        gameData,
        timestamp: new Date().toISOString()
      });
    }
  }, [gameData, gameId, contractAddress, chainId]);

  // Update timestamp when data changes
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [gameData]);

  const getGameStateString = (state: number): string => {
    const states = [
      'AwaitingRandomnessRound1',
      'Round1Negotiation', 
      'AwaitingRandomnessRound2',
      'Round2Negotiation',
      'AwaitingRandomnessRound3', 
      'Finished',
      'FinishedByHole'
    ];
    return states[state] || 'Unknown';
  };

  const getCurrentRound = (state: number): number => {
    if (state <= 1) return 1;
    if (state <= 3) return 2;
    if (state <= 4) return 3;
    return 0; // Finished
  };

  const game = gameData as any;

  return {
    gameData: game,
    gameState: game ? getGameStateString(game.state) : null,
    currentRound: game ? getCurrentRound(game.state) : null,
    isAwaitingVRF: game ? [0, 2, 4].includes(game.state) : false,
    isInNegotiation: game ? [1, 3].includes(game.state) : false,
    isFinished: game ? [5, 6].includes(game.state) : false,
    lastUpdate,
    refetchGameData,
  };
}; 