import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import {
  TURN_BASED_SCRATCHER_ABI,
  getTurnBasedContractAddress,
  GAME_CONFIG,
  getUSDCAddress,
  isNetworkSupported,
} from '../../contracts/config';
import { useApproval } from '../useApproval';
import { decodeEventLog, createPublicClient, http, SimulateContractReturnType, Hash, ContractFunctionArgs } from 'viem';
import { ronin } from 'viem/chains';
import { ERC20_ABI } from '../../contracts/erc20.abi';
import { getErrorMessage } from '../../utils/errorHandling';

interface GameStartedEvent {
  eventName: string;
  args: [bigint, string]; // [gameId, player]
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
  const [startGameTxHash, setStartGameTxHash] = useState<Hash | undefined>();

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

  // Add debug logging for gameFee
  useEffect(() => {
    if (gameFee !== undefined) {
      console.log('📖 [useStartGame] gameFee success:', {
        contractAddress,
        chainId,
        gameFee: gameFee.toString(),
        timestamp: new Date().toISOString()
      });
    }
    if (gameFeeError) {
      console.error('❌ [useStartGame] gameFee error:', {
        contractAddress,
        chainId,
        error: gameFeeError,
        timestamp: new Date().toISOString()
      });
    }
  }, [gameFee, gameFeeError, contractAddress, chainId]);

  // Get VRF fee estimate
  const { data: vrfFee, isLoading: isVrfFeeLoading, error: vrfFeeError } = useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'estimateVRFFee',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: bigint | undefined; isLoading: boolean; error: Error | null };

  // Add debug logging for VRF fee
  useEffect(() => {
    if (vrfFee !== undefined) {
      console.log('📖 [useStartGame] estimateVRFFee success:', {
        contractAddress,
        chainId,
        vrfFee: vrfFee.toString(),
        timestamp: new Date().toISOString()
      });
    }
    if (vrfFeeError) {
      console.error('❌ [useStartGame] estimateVRFFee error:', {
        contractAddress,
        chainId,
        error: vrfFeeError,
        timestamp: new Date().toISOString()
      });
    }
  }, [vrfFee, vrfFeeError, contractAddress, chainId]);

  // Read the contract's USDC address to verify it matches our approval
  const { data: contractUsdcAddress } = useReadContract({
    address: contractAddress,
    abi: TURN_BASED_SCRATCHER_ABI,
    functionName: 'usdc',
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: `0x${string}` | undefined };

  // Add debug logging for USDC address
  useEffect(() => {
    if (contractUsdcAddress !== undefined) {
      console.log('📖 [useStartGame] usdc address success:', {
        contractAddress,
        chainId,
        contractUsdcAddress,
        expectedUsdcAddress: usdcAddress,
        timestamp: new Date().toISOString()
      });
    }
  }, [contractUsdcAddress, contractAddress, chainId, usdcAddress]);

  // Check contract's USDC balance
  const { data: contractUsdcBalance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: contractAddress ? [contractAddress] : undefined,
    query: {
      enabled: !!contractAddress,
    },
  }) as { data: bigint | undefined };

  // Add debug logging for USDC balance
  useEffect(() => {
    if (contractUsdcBalance !== undefined) {
      console.log('📖 [useStartGame] contract USDC balance success:', {
        contractAddress,
        chainId,
        usdcAddress,
        balance: contractUsdcBalance.toString(),
        timestamp: new Date().toISOString()
      });
    }
  }, [contractUsdcBalance, contractAddress, chainId, usdcAddress]);

  // Direct allowance check for debugging
  const { data: directAllowance, refetch: refetchDirectAllowance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  }) as { data: bigint | undefined; refetch: () => void };

  // Add debug logging for allowance
  useEffect(() => {
    if (directAllowance !== undefined) {
      console.log('📖 [useStartGame] USDC allowance success:', {
        contractAddress,
        chainId,
        usdcAddress,
        owner: address,
        allowance: directAllowance.toString(),
        timestamp: new Date().toISOString()
      });
    }
  }, [directAllowance, contractAddress, chainId, usdcAddress, address]);

  const approval = useApproval({
    amount: gameFee ? (Number(gameFee) / 10**GAME_CONFIG.DECIMALS).toFixed(2) : '1.00', // Default to 1 USDC instead of '0'
    spenderOverride: contractAddress,
    chainId: chainId,
  });

  const {
    writeContract,
    data: writeHash,
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
    console.log('🎮 [useStartGame] Starting new game:', {
      cellIndexes,
      address,
      chainId,
      contractAddress,
      timestamp: new Date().toISOString()
    });

    // Reset any previous transaction state first
    setError(null);
    setStartGameTxHash(undefined);
    if (resetStartGame) resetStartGame();
    
    // Small delay to ensure state is reset
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!address || !chainId) {
      console.warn('⚠️ [useStartGame] No wallet connected');
      setError('Please connect your wallet.');
      return;
    }
    
    if (!contractAddress) {
      console.warn('⚠️ [useStartGame] Contract not deployed');
      setError('The contract is not deployed on this network.');
      return;
    }
    
    if (cellIndexes.length !== 3) {
      console.warn('⚠️ [useStartGame] Invalid cell count:', cellIndexes.length);
      setError('Please select exactly 3 cells.');
      return;
    }
    
    if (!approval.isApproved) {
      console.warn('⚠️ [useStartGame] Game fee not approved');
      setError('Please approve the game fee before starting.');
      return;
    }

    try {
      // Simulate the transaction first
      console.log('🔄 [useStartGame] Simulating transaction...');
      const simulation = await simulateTransaction(cellIndexes);
      
      if (!simulation?.success || !simulation?.request) {
        console.error('❌ [useStartGame] Simulation failed:', simulation?.error);
        setError(simulation?.error || 'Simulation failed without error message');
        return;
      }

      // Write the contract with proper typing
      console.log('📝 [useStartGame] Sending transaction via writeContract...');
      writeContract(simulation.request);

    } catch (error: any) {
      console.error('❌ [useStartGame] Transaction error:', error);
      setError(error.message || 'Failed to start game');
    }
  }, [address, chainId, contractAddress, approval.isApproved, simulateTransaction, writeContract, resetStartGame]);

  // Extract game ID from transaction receipt
  useEffect(() => {
    console.log('🧾 [useStartGame] Transaction status:', {
      txHash: startGameTxHash,
      isConfirming,
      isConfirmed,
      hasReceipt: !!receipt,
      timestamp: new Date().toISOString()
    });

    if (receipt && isConfirmed) {
      try {
        // Look for the GameStarted event
        const gameStartedLog = receipt.logs?.find(log => {
          try {
            const decoded = decodeEventLog({
              abi: TURN_BASED_SCRATCHER_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === 'GameStarted';
          } catch {
            return false;
          }
        });

        if (gameStartedLog) {
          const decoded = decodeEventLog({
            abi: TURN_BASED_SCRATCHER_ABI,
            data: gameStartedLog.data,
            topics: gameStartedLog.topics,
          }) as GameStartedEvent;
          
          if (decoded.eventName === 'GameStarted' && decoded.args) {
            // viem returns args as an object (named params + numeric keys). Prefer named keys.
            const argsObj = decoded.args as Record<string, any>;
            const rawGameId = argsObj.gameId ?? argsObj[0];
            const rawPlayer = argsObj.player ?? argsObj[1];

            if (rawGameId !== undefined) {
              const parsedGameId = Number(rawGameId);
              console.log('🎲 [useStartGame] Game started:', {
                gameId: parsedGameId,
                player: rawPlayer,
                txHash: startGameTxHash,
                timestamp: new Date().toISOString()
              });
              setGameId(parsedGameId);
            } else {
              console.error('❌ [useStartGame] Could not parse gameId from event args:', decoded.args);
            }
          } else {
            console.warn('⚠️ [useStartGame] No GameStarted event found in receipt');
          }
        } else {
          console.warn('⚠️ [useStartGame] No GameStarted event found in receipt');
        }
      } catch (error) {
        console.error('❌ [useStartGame] Error parsing receipt:', error);
      }
    }
  }, [receipt, isConfirmed, startGameTxHash, isConfirming]);

  // Handle errors
  useEffect(() => {
    if (startGameError) {
      console.error('❌ [useStartGame] Start game error:', startGameError);
      setError(startGameError.message || 'Unknown error occurred');
    }
    if (confirmationError) {
      console.error('❌ [useStartGame] Confirmation error:', confirmationError);
      setError(confirmationError.message || 'Unknown error occurred');
    }
  }, [startGameError, confirmationError]);

  // Update startGameTxHash when we get it from writeContract
  useEffect(() => {
    if (writeHash) {
      console.log('📥 [useStartGame] Received tx hash from writeContract:', writeHash);
      setStartGameTxHash(writeHash as Hash);
    }
  }, [writeHash]);

  return {
    startGame,
    gameId,
    isLoading: isStartingGame || isConfirming,
    error,
    isConfirmed,
  };
}; 