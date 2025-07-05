import React from 'react';
import styles from '../styles/WinningMessage.module.css';

interface AcceptedOfferMessageProps {
  amount: bigint;
  gameId: number;
  onPlayAgain: () => void;
}

export const AcceptedOfferMessage: React.FC<AcceptedOfferMessageProps> = ({
  amount,
  gameId,
  onPlayAgain,
}) => {
  const isMobile = window.innerWidth <= 768;
  
  const formatAmount = (amount: bigint): string => {
    // Convert from 6 decimal USDC to regular number
    const value = Number(amount) / 1_000_000;
    return value.toFixed(2);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.icon}>🤝</div>
          <h2 className={styles.title}>Deal Accepted!</h2>
          <div className={styles.amount}>
            <span className={styles.currency}>$</span>
            <span className={styles.value}>{formatAmount(amount)}</span>
          </div>
          <p className={styles.message}>
            You have successfully accepted the house offer for Game #{gameId}
          </p>
          {!isMobile && (
            <button 
              className={styles.playAgainButton}
              onClick={onPlayAgain}
            >
              Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 