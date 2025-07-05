import React from 'react';

interface HoleFoundMessageProps {
  gameId: number;
  onPlayAgain: () => void;
}

export const HoleFoundMessage: React.FC<HoleFoundMessageProps> = ({
  gameId,
  onPlayAgain,
}) => {
  const isMobile = window.innerWidth <= 768;

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
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        borderRadius: '16px',
        padding: isMobile ? '20px 15px' : '40px',
        textAlign: 'center',
        maxWidth: isMobile ? '100%' : '400px',
        margin: isMobile ? '10px' : '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        overflow: 'hidden',
        maxHeight: isMobile ? '90%' : 'auto',
      }}>
        <div style={{
          fontSize: isMobile ? '40px' : '60px',
          marginBottom: isMobile ? '15px' : '20px',
          animation: 'shake 0.5s ease-in-out',
        }}>
          🕳️
        </div>
        
        <h2 style={{
          fontSize: isMobile ? '24px' : '32px',
          marginBottom: isMobile ? '15px' : '20px',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}>
          Hole Found!
        </h2>
        
        <p style={{
          fontSize: isMobile ? '14px' : '18px',
          marginBottom: isMobile ? '12px' : '15px',
          opacity: 0.9,
        }}>
          Game #{gameId} ended when you hit a hole. Better luck next time!
        </p>
        
        <div style={{
          fontSize: isMobile ? '18px' : '24px',
          fontWeight: 'bold',
          color: '#FFD700',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          marginBottom: isMobile ? '20px' : '30px',
          padding: isMobile ? '10px' : '15px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}>
          Game Over
        </div>
        
        <p style={{
          fontSize: isMobile ? '12px' : '16px',
          marginBottom: isMobile ? '20px' : '30px',
          opacity: 0.8,
        }}>
          Do not worry, you can always try again with a new game!
        </p>
        
{!isMobile && (
          <button
            onClick={onPlayAgain}
            style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            }}
          >
            🎮 Play Again
          </button>
        )}
        
        <style jsx>{`
          @keyframes shake {
            0%, 100% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(-5px);
            }
            75% {
              transform: translateX(5px);
            }
          }
        `}</style>
      </div>
    </div>
  );
}; 