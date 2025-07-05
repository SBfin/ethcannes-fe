'use client';

import { useState } from 'react';
import styles from '../styles/RoninWalletConnect.module.css';
import Image from 'next/image';

interface RoninWalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  connectedAddress?: string;
}

export default function RoninWalletConnect({
  onConnect,
  onDisconnect,
  isConnected,
  connectedAddress,
}: RoninWalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectRoninWallet = async () => {
    setIsConnecting(true);
    try {
      // Check if Ronin Wallet is installed
      if (typeof window !== 'undefined' && (window as any).ronin) {
        const ronin = (window as any).ronin;
        
        // Request account access
        const accounts = await ronin.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0]);
        }
      } else {
        // Ronin Wallet not installed, redirect to install page
        window.open('https://wallet.roninchain.com/', '_blank');
      }
    } catch (error) {
      console.error('Failed to connect to Ronin Wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onDisconnect();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <div className={styles.container}>
      {isConnected && connectedAddress ? (
        <div className={styles.connectedInfo}>
          <span className={styles.addressText}>{formatAddress(connectedAddress)}</span>
          <button onClick={disconnectWallet} className={styles.disconnectButton}>
            <Image src="/icons/disconnect.svg" alt="Disconnect" width={16} height={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={connectRoninWallet}
          disabled={isConnecting}
          className={styles.connectButton}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
} 