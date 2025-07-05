import { useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getUSDCAddress } from '../contracts/config';

import { ERC20_ABI } from '../contracts/erc20.abi';

const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export interface UseApprovalOptions {
  amount?: string;
  spenderOverride?: `0x${string}` | undefined;
}

export const useApproval = (options: UseApprovalOptions = {}) => {
  const { address, chainId } = useAccount();
  const {
    amount = '1.00',
    spenderOverride,
  } = options;

  const currentChainId = chainId || 2020; // Default to Ronin mainnet
  const usdcAddress = getUSDCAddress(currentChainId);
  const spenderAddress = spenderOverride;

  // Check if we have valid addresses
  const canCheckApproval = !!address && !!spenderAddress && !!usdcAddress && 
    spenderAddress !== `0x${'0'.repeat(40)}` && usdcAddress !== `0x${'0'.repeat(40)}`;

  const amountWei = BigInt(Math.floor(parseFloat(amount) * 1000000)); // Convert to USDC wei (6 decimals)

  // Read current allowance
  const { data: allowanceData = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: canCheckApproval ? [address, spenderAddress] : undefined,
    query: {
      enabled: canCheckApproval,
    }
  });

  // Write contract hook for approval
  const {
    writeContract,
    data: approvalTxHash,
    isPending: isApproving,
    error: approvalError,
    reset: resetApproval
  } = useWriteContract();

  // Wait for approval transaction
  const {
    isLoading: isWaitingForApproval,
    isSuccess: isApprovalConfirmed
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isApprovalConfirmed) {
      refetchAllowance();
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Approval function
  const approve = () => {
    if (!canCheckApproval) {
      console.error("Cannot approve: missing required addresses", {
        address,
        spenderAddress,
        usdcAddress,
        chainId: currentChainId
      });
      return;
    }

    writeContract({
      address: usdcAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, MAX_UINT256],
    });
  };

  // Derived state - Fixed logic
  const currentAllowance = allowanceData;
  // Only check approval if we can check and have a valid amount
  const needsApproval = canCheckApproval && amountWei > 0 && currentAllowance < amountWei;
  const isApproved = canCheckApproval && (amountWei === BigInt(0) || currentAllowance >= amountWei);

  return {
    // State
    isApproving,
    isApproved,
    currentAllowance,
    needsApproval,
    isWaitingForApproval,
    isApprovalConfirmed,
    
    // Actions
    approve,
    refetchAllowance,
    resetApproval,
    
    // Error handling
    error: approvalError,
  };
}; 