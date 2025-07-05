import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
import {
  TURN_BASED_SCRATCHER_ABI,
  getTurnBasedContractAddress,
} from '../../contracts/config';

export interface GameData {
  player: string;
  state: number;
  vrfRequestId: bigint;
  chosenCells: readonly number[];
  isCellChosen: readonly boolean[];
  revealedPayouts: readonly bigint[];
  offeredPayouts: readonly bigint[];
  holeFound: boolean;
}

export interface RoundRevealedEvent {
  gameId: bigint;
  round: number;
  payout: bigint;
  holeFound: boolean;
}

export const useGameWatcher = (gameId: number | null) => {
  const { chainId } = useAccount();
  const effectiveChainId = chainId ?? 2020; // Ronin mainnet as default
  const [latestRoundRevealed, setLatestRoundRevealed] = useState<RoundRevealedEvent | null>(null);
  const [gameFinished, setGameFinished] = useState<{ gameId: bigint; totalPayout: bigint; byHole: boolean } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const contractAddress = getTurnBasedContractAddress(effectiveChainId);

  // Read current game data with reduced polling
  const { data: gameData, refetch: refetchGameData } = useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'getGame',
    args: gameId ? [BigInt(gameId)] : undefined,
    query: {
      enabled: !!contractAddress && !!gameId && isClient,
      refetchInterval: 20000, 
      staleTime: 15000,
    },
  });
  
  // Avoid running watchers on the server
  useWatchContractEvent({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    eventName: 'RandomnessRequested',
    pollingInterval: 4000,
    onLogs: (logs) => {
      if (!isClient) return;
      console.log('👁️ [useGameWatcher] RandomnessRequested event:', logs);
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    eventName: 'RoundRevealed',
    pollingInterval: 4000,
    onLogs: (logs) => {
      if (!isClient) return;
      console.log('👁️ [useGameWatcher] RoundRevealed event:', logs);
      const relevantLog = logs.find(log => (log as any).args.gameId === BigInt(gameId!));
      if (relevantLog) {
        setLatestRoundRevealed((relevantLog as any).args as RoundRevealedEvent);
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    eventName: 'GameFinished',
    pollingInterval: 4000,
    onLogs: (logs) => {
      if (!isClient) return;
      console.log('👁️ [useGameWatcher] GameFinished event:', logs);
      const relevantLog = logs.find(log => (log as any).args.gameId === BigInt(gameId!));
      if (relevantLog) {
        setGameFinished((relevantLog as any).args);
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    eventName: 'GameFinishedByHole',
    pollingInterval: 4000,
    onLogs: (logs) => {
      if (!isClient) return;
      console.log('👁️ [useGameWatcher] GameFinishedByHole event:', logs);
      const relevantLog = logs.find(log => (log as any).args.gameId === BigInt(gameId!));
      if (relevantLog) {
        setGameFinished((relevantLog as any).args);
      }
    },
  });

  // Debug: log whenever gameData or derived flags change
  useEffect(() => {
    if (gameData !== undefined) {
      const stateNum = (gameData as any)?.state;
      console.log('🔄 [useGameWatcher] getGame fetched', {
        gameId,
        state: stateNum,
        gameState: stateNum !== undefined ? getGameStateString(stateNum) : 'unknown',
        isAwaitingVRF: [0,2,4].includes(stateNum),
        isInNegotiation: [1,3].includes(stateNum),
        isFinished: [5,6].includes(stateNum),
        timestamp: new Date().toISOString(),
      });
    }
  }, [gameData, gameId]);

  if (!isClient) {
    // Return a server-safe, non-interactive version
    return {
      gameData: undefined,
      latestRoundRevealed: null,
      gameFinished: null,
      gameState: null,
      currentRound: null,
      isAwaitingVRF: false,
      isInNegotiation: false,
      isFinished: false,
      refetchGameData: () => {},
    };
  }

  const getGameStateString = (state: number): string => {
    const states = [
      'AwaitingRandomnessRound1',
      'Round1Negotiation', 
      'AwaitingRandomnessRound2',
      'Round2Negotiation',
      'AwaitingRandomnessRound3', 
      'Round3Negotiation',
      'Finished',
      'FinishedByHole'
    ];
    return states[state] || 'Unknown';
  };

  const getCurrentRound = (state: number): number => {
    if (state <= 1) return 1;
    if (state <= 3) return 2;
    if (state <= 5) return 3;
    return 0; // Finished
  };

  const typedGameData = gameData as GameData | undefined;
  
  return {
    gameData: typedGameData,
    latestRoundRevealed,
    gameFinished,
    gameState: typedGameData ? getGameStateString(typedGameData.state) : null,
    currentRound: typedGameData ? getCurrentRound(typedGameData.state) : null,
    isAwaitingVRF: typedGameData ? [0, 2, 4].includes(typedGameData.state) : false,
    isInNegotiation: typedGameData ? [1, 3, 5].includes(typedGameData.state) : false,
    isFinished: typedGameData ? [6, 7].includes(typedGameData.state) : false,
    refetchGameData,
  };
}; 