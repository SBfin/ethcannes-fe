import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  roninWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { defineChain } from 'viem';

export const ronin = defineChain({
  id: 2020,
  name: 'Ronin',
  nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.roninchain.com/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Ronin Explorer', url: 'https://app.roninchain.com' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 26020753,
    },
  },
});

export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [ronin],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [roninWallet],
    },
    {
      groupName: 'Other',
      wallets: [injectedWallet, walletConnectWallet],
    },
  ],
  ssr: true,
});
