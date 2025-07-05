import { NextApiRequest, NextApiResponse } from 'next';
import { getHousePrivateKey } from '../../../utils/houseKey';
import { getTurnBasedContractAddress, TURN_BASED_SCRATCHER_ABI } from '../../../contracts/config';
import { createPublicClient, http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ronin } from 'viem/chains';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameId } = req.body;

    if (typeof gameId !== 'number' || gameId <= 0) {
      return res.status(400).json({ error: 'Invalid gameId' });
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

    const GAS_LIMIT = BigInt(500000);

    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: TURN_BASED_SCRATCHER_ABI,
      functionName: 'acceptOffer',
      args: [BigInt(gameId)],
      account,
      gas: GAS_LIMIT,
    });

    const hash = await walletClient.writeContract({ ...request, gas: GAS_LIMIT });
    console.log(`House accepting offer for game ${gameId}. Tx: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      return res.status(200).json({ success: true, hash });
    } else {
      return res.status(500).json({ error: 'Transaction failed', hash, status: receipt.status });
    }

  } catch (err: any) {
    console.error('--- API ERROR: /api/house/accept-offer ---', err);
    const details = err.shortMessage || err.message || 'An unknown server error occurred.';
    return res.status(500).json({
      error: 'Server error',
      details: details,
    });
  }
} 