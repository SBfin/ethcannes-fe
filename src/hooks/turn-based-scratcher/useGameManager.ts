import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import {
  TURN_BASED_SCRATCHER_ABI,
  getTurnBasedContractAddress,
} from '../../contracts/config';
import { decodeEventLog, AbiEvent } from 'viem';
import { getErrorMessage } from '../../utils/errorHandling';

export interface GameState {
  currentOffer: bigint | null;
  totalPayout: bigint | null;
  isFinished: boolean;
}

export const useGameManager = (gameId: number | null) => {
  const { address, chainId } = useAccount();
  const [gameState, setGameState] = useState<GameState>({
    currentOffer: null,
    totalPayout: null,
    isFinished: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [claimSuccess, setClaimSuccess] = useState<{ amount: bigint; gameId: number } | null>(null);

  const contractAddress = chainId ? getTurnBasedContractAddress(chainId) : undefined;
  const validContractAddress = contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined;

  const {
    writeContract,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Check for successful claim in transaction receipt
  useEffect(() => {
    if (receipt && gameId) {
      // Look for GameFinished event in the transaction receipt
      for (const log of receipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: TURN_BASED_SCRATCHER_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decodedLog.eventName === 'GameFinished') {
            const args = decodedLog.args as unknown as { gameId: bigint; totalPayout: bigint; byHole: boolean };
            if (args.gameId === BigInt(gameId) && !args.byHole) {
              // Successful claim detected!
              setClaimSuccess({ amount: args.totalPayout, gameId });
              break;
            }
          }
        } catch (e) {
          // Not a log from our contract, ignore
        }
      }
    }
  }, [receipt, gameId]);

  const handleWrite = useCallback((functionName: string, args: any[]) => {
    if (!gameId) {
      setError('No game ID provided.');
      return;
    }
    if (!validContractAddress) {
      setError('Contract not deployed on this network.');
      return;
    }
    reset();
    setClaimSuccess(null); // Clear previous success state
    writeContract({
      address: validContractAddress,
      abi: TURN_BASED_SCRATCHER_ABI,
      functionName,
      args: [gameId, ...args],
    }, {
      onSuccess: setTxHash,
      onError: (e) => setError(e.message)
    });
  }, [gameId, validContractAddress, reset, writeContract, setTxHash]);

  const setHouseOffer = useCallback((offerAmount: bigint) => handleWrite('setHouseOffer', [offerAmount]), [handleWrite]);
  const acceptOffer = useCallback(() => handleWrite('acceptOffer', []), [handleWrite]);
  const finishGame = useCallback(() => handleWrite('finishGameAndClaimPayout', []), [handleWrite]);

  // Clear claim success state
  const clearClaimSuccess = useCallback(() => {
    setClaimSuccess(null);
  }, []);

  const handleLog = (log: any) => {
    const eventName = log.eventName;
    const args = log.args as any;

    if (args.gameId !== BigInt(gameId!)) return;

    if (eventName === 'OfferSet') {
      setGameState(prev => ({ ...prev, currentOffer: args.offer }));
    } else if (eventName === 'GameFinished') {
      setGameState(prev => ({ ...prev, totalPayout: args.totalPayout, isFinished: true }));
    }
  }

  useWatchContractEvent({
    address: validContractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    eventName: 'OfferSet',
    onLogs: (logs) => logs.forEach(handleLog),
  });

  useWatchContractEvent({
    address: validContractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    eventName: 'GameFinished',
    onLogs: (logs) => logs.forEach(handleLog),
  });

  useEffect(() => {
    if (writeError) {
      setError(getErrorMessage(writeError));
    }
  }, [writeError]);

  return {
    setHouseOffer,
    acceptOffer,
    finishGame,
    gameState,
    isLoading: isPending || isConfirming,
    isConfirmed,
    claimSuccess,
    clearClaimSuccess,
    error,
  };
}; 