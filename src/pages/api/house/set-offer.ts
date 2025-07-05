import { NextApiRequest, NextApiResponse } from 'next';
import { getHousePrivateKey } from '../../../utils/houseKey';
import { getTurnBasedContractAddress, TURN_BASED_SCRATCHER_ABI } from '../../../contracts/config';
import { createPublicClient, http, createWalletClient, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ronin } from 'viem/chains';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { gameId, offerAmount } = req.body;

    if (typeof gameId !== 'number' || gameId <= 0 || typeof offerAmount !== 'number' || offerAmount <= 0) {
      return res.status(400).json({ error: 'Invalid gameId or offerAmount' });
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
    if (!contractAddress) return res.status(500).json({ error: 'Missing contract address' });

    const game = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: TURN_BASED_SCRATCHER_ABI,
      functionName: 'getGame',
      args: [BigInt(gameId)],
    });


    const offerAmountWei = BigInt(Math.floor(offerAmount * 1e6));

    const GAS_LIMIT = BigInt(800000);

    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: TURN_BASED_SCRATCHER_ABI,
      functionName: 'setHouseOffer',
      args: [BigInt(gameId), offerAmountWei],
      account,
      gas: GAS_LIMIT,
    });

    console.log('Estimated gas:', request?.gas?.toString());

    // Send with explicit higher gas limit
    const hash = await walletClient.writeContract({ ...request, gas: GAS_LIMIT });

    console.log(`Transaction sent with high gas. Hash: ${hash}. Waiting for receipt...`);
    console.log(`View on Ronin Explorer: https://explorer.roninchain.com/tx/${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      return res.status(200).json({ success: true, hash, offerAmount: offerAmountWei.toString() });
    } else {
      return res.status(500).json({ error: 'Transaction failed', hash, status: receipt.status });
    }

  } catch (err: any) {
    console.error('--- API ERROR: /api/house/set-offer ---');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Request Body:', req.body);
    console.error('Error Object:', err);
    console.error('------------------------------------------');

    // Provide a more specific error message if available
    const details = err.shortMessage || err.message || 'An unknown server error occurred.';
    
    return res.status(500).json({
      error: 'Server error',
      details: details,
    });
  }
}
