import React from 'react';
import { formatUnits } from 'viem';

type GameEndState = 'win' | 'hole' | 'offer';

interface GameEndMessageProps {
  state: GameEndState;
  amount: bigint;
  gameId: number;
  onPlayAgain: () => void;
}

export const GameEndMessage: React.FC<GameEndMessageProps> = ({ state, amount, gameId, onPlayAgain }) => {
  const isMobile = window.innerWidth <= 768;

  const formatAmount = (value: bigint) => parseFloat(formatUnits(value, 6)).toFixed(2);

  const messages = {
    win: {
      emoji: '🎉',
      title: 'Congratulations!',
      text: `You have successfully completed Game #${gameId} and claimed your payout!`,
      amountText: 'You Won:',
      amountColor: '#FFD700',
    },
    hole: {
      emoji: '🕳️',
      title: 'Hole Found!',
      text: `Game #${gameId} has ended. Better luck next time!`,
      amountText: 'Game Over',
      amountColor: '#ccc',
    },
    offer: {
      emoji: '💸',
      title: 'Offer Accepted!',
      text: `You accepted the house's offer for Game #${gameId}.`,
      amountText: 'You Received:',
      amountColor: '#86efac',
    },
  };

  const currentMessage = messages[state];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      borderRadius: isMobile ? '0' : '20px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: isMobile ? '20px 15px' : '40px',
        textAlign: 'center',
        maxWidth: isMobile ? '100%' : '400px',
        margin: isMobile ? '10px' : '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>{currentMessage.emoji}</div>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>{currentMessage.title}</h2>
        <p style={{ fontSize: '18px', marginBottom: '15px' }}>{currentMessage.text}</p>
        
        <div style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: currentMessage.amountColor,
          marginBottom: '30px',
        }}>
          {state !== 'hole' ? `$${formatAmount(amount)} USDC` : currentMessage.amountText}
        </div>

        {!isMobile && (
          <button onClick={onPlayAgain} className="play-again-button">
            🎮 Play Again
          </button>
        )}
      </div>
      <style>{`
        .play-again-button {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 15px 30px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        .play-again-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}; 