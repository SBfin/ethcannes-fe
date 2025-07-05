import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import {
  TURN_BASED_SCRATCHER_ABI,
  getTurnBasedContractAddress,
  GAME_CONFIG,
  getUSDCAddress,
  isNetworkSupported,
} from '../contracts/config';
import { useApproval } from './useApproval';
import { decodeEventLog, createPublicClient, http, Hash } from 'viem';
import { ronin } from 'viem/chains';
import { ERC20_ABI } from '../contracts/erc20.abi';
import { getErrorMessage } from '../utils/errorHandling';

interface GameStartedEvent {
  eventName: string;
  args: {
    gameId: bigint;
    player: `0x${string}`;
  };
}

interface SimulationResult {
  success: boolean;
  error?: string;
  request?: {
    address: `0x${string}`;
    abi: typeof TURN_BASED_SCRATCHER_ABI;
    functionName: 'startGame';
    args: [number[]];
    value: bigint;
    gas: bigint;
  };
}

export const useStartGame = () => {
  const { address, chainId } = useAccount();
  const [gameId, setGameId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = chainId ? getTurnBasedContractAddress(chainId) : undefined;
  const usdcAddress = getUSDCAddress(chainId || 2020);
  const isCurrentNetworkSupported = isNetworkSupported(chainId || 2020);
  
  // Get game fee
  const { data: gameFee, isLoading: isGameFeeLoading, error: gameFeeError } = useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'gameFee',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null };

  // Get VRF fee estimate
  const { data: vrfFee, isLoading: isVrfFeeLoading, error: vrfFeeError } = useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'estimateVRFFee',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null };

  const approval = useApproval({
    amount: gameFee ? (Number(gameFee) / 10**GAME_CONFIG.DECIMALS).toFixed(2) : '1.00',
    spenderOverride: contractAddress,
  });

  const {
    writeContract,
    data: startGameTxHash,
    isPending: isStartingGame,
    error: startGameError,
    reset: resetStartGame,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmationError,
  } = useWaitForTransactionReceipt({
    hash: startGameTxHash,
  });

  // Simulate transaction before sending
  const simulateTransaction = useCallback(async (cellIndexes: number[]): Promise<SimulationResult> => {
    if (!address) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (!chainId) {
      return { success: false, error: 'Chain ID not available' };
    }

    if (!contractAddress) {
      return { success: false, error: 'Contract not deployed on this network' };
    }

    if (!gameFee) {
      if (isGameFeeLoading) {
        return { success: false, error: 'Game fee is still loading from the contract - please wait a moment and try again' };
      } else if (gameFeeError) {
        return { success: false, error: `Failed to load game fee from contract: ${gameFeeError.message}` };
      } else {
        return { success: false, error: 'Game fee not available - contract may not be responding' };
      }
    }

    if (!vrfFee) {
      if (isVrfFeeLoading) {
        return { success: false, error: 'VRF fee is still loading from the contract - please wait a moment and try again' };
      } else if (vrfFeeError) {
        return { success: false, error: `Failed to load VRF fee from contract: ${vrfFeeError.message}` };
      } else {
        return { success: false, error: 'VRF fee not available - contract may not be responding' };
      }
    }

    try {
      const publicClient = createPublicClient({
        chain: ronin,
        transport: http('https://api.roninchain.com/rpc'),
      });

      // 1. Check USDC balance
      const balance = (await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      })) as bigint;

      const balanceFormatted = Number(balance) / 10**GAME_CONFIG.DECIMALS;
      const gameFeeFormatted = Number(gameFee) / 10**GAME_CONFIG.DECIMALS;
      
      if (balanceFormatted < gameFeeFormatted) {
        return { 
          success: false, 
          error: `Insufficient USDC balance. Have ${balanceFormatted.toFixed(2)} USDC, need ${gameFeeFormatted.toFixed(2)} USDC` 
        };
      }

      // 1.5. Check RON balance for VRF fee
      const ronBalance = await publicClient.getBalance({ address });
      const vrfFeeFormatted = Number(vrfFee) / 10**18; // RON has 18 decimals
      const ronBalanceFormatted = Number(ronBalance) / 10**18;
      
      if (ronBalanceFormatted < vrfFeeFormatted) {
        return { 
          success: false, 
          error: `Insufficient RON balance for VRF fee. Have ${ronBalanceFormatted.toFixed(4)} RON, need ${vrfFeeFormatted.toFixed(4)} RON` 
        };
      }

      // 2. Check allowance
      const allowance = (await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, contractAddress],
      })) as bigint;

      const allowanceFormatted = Number(allowance) / 10**GAME_CONFIG.DECIMALS;
      
      if (allowanceFormatted < gameFeeFormatted) {
        return { 
          success: false, 
          error: `Insufficient allowance. Have ${allowanceFormatted.toFixed(2)} USDC allowance, need ${gameFeeFormatted.toFixed(2)} USDC` 
        };
      }

      // 3. Try to simulate the actual transaction
      try {
        await publicClient.simulateContract({
          account: address,
          address: contractAddress,
          abi: TURN_BASED_SCRATCHER_ABI,
          functionName: 'startGame',
          args: [cellIndexes as [number, number, number]],
          value: vrfFee,
          gas: BigInt(500000), // Increased to match contract's CALLBACK_GAS_LIMIT
        });

        return {
          success: true,
          request: {
            address: contractAddress,
            abi: TURN_BASED_SCRATCHER_ABI,
            functionName: 'startGame',
            args: [cellIndexes],
            value: vrfFee,
            gas: BigInt(500000),
          },
        };
      } catch (err: any) {
        console.error("Transaction simulation failed:", err);
        const errorMessage = getErrorMessage(err);
        return { success: false, error: `Simulation failed: ${errorMessage}` };
      }
    } catch (error: any) {
      console.error("Pre-simulation check failed:", error);
      return { success: false, error: `Pre-flight check failed: ${error.message}` };
    }
  }, [address, chainId, contractAddress, gameFee, isGameFeeLoading, gameFeeError, vrfFee, isVrfFeeLoading, vrfFeeError, usdcAddress]);

  const startGame = useCallback(async (cellIndexes: number[]) => {
    // Reset any previous transaction state first
    setError(null);
    resetStartGame();
    
    if (!address || !chainId) {
      setError('Please connect your wallet.');
      return;
    }
    
    if (!contractAddress) {
      setError('The contract is not deployed on this network.');
      return;
    }
    
    if (cellIndexes.length !== 3) {
      setError('Please select exactly 3 cells.');
      return;
    }
    
    if (!approval.isApproved) {
      setError('Please approve the game fee before starting.');
      return;
    }

    try {
      // Simulate the transaction first
      const simulation = await simulateTransaction(cellIndexes);
      
      if (!simulation?.success || !simulation?.request) {
        setError(simulation?.error || 'Simulation failed without error message');
        return;
      }

      // Write the contract with proper typing
      writeContract(simulation.request);

    } catch (error: any) {
      setError(error.message || 'Failed to start game');
    }
  }, [address, chainId, contractAddress, approval.isApproved, simulateTransaction, writeContract, resetStartGame]);

  // Extract game ID from transaction receipt
  useEffect(() => {
    if (receipt && isConfirmed) {
      let gameStartedEventFound = false;
      for (const log of receipt.logs) {
        try {
          const decodedEvent = decodeEventLog({
            abi: TURN_BASED_SCRATCHER_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decodedEvent.eventName === 'GameStarted') {
            const gameStartedEvent = decodedEvent as unknown as GameStartedEvent;
            const gameIdArg = gameStartedEvent.args?.gameId;

            if (gameIdArg !== undefined) {
              setGameId(Number(gameIdArg));
              gameStartedEventFound = true;
              break; 
            }
          }
        } catch {
          // Ignore logs that don't match the ABI
        }
      }

      if (!gameStartedEventFound) {
        setError('GameStarted event not found in transaction receipt.');
      }
    }
  }, [receipt, isConfirmed]);

  // Handle errors
  useEffect(() => {
    if (startGameError) {
      setError(startGameError.message || 'Unknown error occurred');
    }
    if (confirmationError) {
      setError(confirmationError.message || 'Unknown error occurred');
    }
  }, [startGameError, confirmationError]);

  return {
    startGame,
    gameId,
    isLoading: isStartingGame || isConfirming,
    error,
    isConfirmed,
  };
}; 