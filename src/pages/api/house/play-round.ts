import { NextApiRequest, NextApiResponse } from 'next';
import { getHousePrivateKey } from '../../../utils/houseKey';
import { getTurnBasedContractAddress, TURN_BASED_SCRATCHER_ABI } from '../../../contracts/config';
import { createPublicClient, http, createWalletClient, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ronin } from 'viem/chains';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameId, cellIndexes } = req.body;

    if (
      typeof gameId !== 'number' ||
      gameId <= 0 ||
      !Array.isArray(cellIndexes) ||
      cellIndexes.length !== 3 ||
      !cellIndexes.every((i) => typeof i === 'number' && i >= 0 && i < 9)
    ) {
      return res.status(400).json({ error: 'Invalid gameId or cellIndexes' });
    }

    const privateKey = getHousePrivateKey();
    const rpcUrl = process.env.RPC_URL || 'https://api.roninchain.com/rpc';

    const account = privateKeyToAccount(`0x${privateKey}`);

    const walletClient = createWalletClient({
      account,
      chain: ronin,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: ronin,
      transport: http(rpcUrl),
    });

    const contractAddress = getTurnBasedContractAddress(ronin.id);
    if (!contractAddress) {
      return res.status(500).json({ error: 'Missing contract address' });
    }

    // Fetch VRF fee from contract
    const vrfFee = await publicClient.readContract({
      address: contractAddress,
      abi: TURN_BASED_SCRATCHER_ABI,
      functionName: 'estimateVRFFee',
    }) as bigint;

    // Use a higher gas limit to ensure ample allowance on Ronin
    const GAS_LIMIT = BigInt(800000);

    // Simulate the transaction with explicit high gas limit
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: TURN_BASED_SCRATCHER_ABI,
      functionName: 'playRound',
      args: [BigInt(gameId), cellIndexes],
      account,
      value: vrfFee,
      gas: GAS_LIMIT,
    });

    // Send the transaction with the same high gas limit override
    const hash = await walletClient.writeContract({ ...request, gas: GAS_LIMIT, value: vrfFee });

    console.log(`House playing round for game ${gameId}. Tx: ${hash}`);

    // Wait for the transaction to be confirmed
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      return res.status(200).json({ success: true, hash });
    } else {
      return res.status(500).json({ error: 'Transaction failed', hash, status: receipt.status });
    }

  } catch (err: any) {
    console.error('--- API ERROR: /api/house/play-round ---', err);
    const details = err.shortMessage || err.message || 'An unknown server error occurred.';
    return res.status(500).json({
      error: 'Server error',
      details: details,
    });
  }
} 