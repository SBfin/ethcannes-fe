import React, { useState } from 'react';
import { ApprovalButton } from './ApprovalButton';
// import { useScratcherGame } from '../hooks'; // Hook doesn't exist

export const GameApprovalExample: React.FC = () => {
  const [isApproved, setIsApproved] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Placeholder for non-existent hook
  const mockGameData = {
    isPlaying: false,
    canPlay: true,
    lastResult: null as any,
    play: () => console.log('Mock play function'),
    formatTicketPrice: () => '1.00',
    formatPrizePool: () => '100.00',
    getSymbolEmoji: (index: any) => '🎰',
    error: null as any
  };

  const {
    isPlaying,
    canPlay,
    lastResult,
    play,
    formatTicketPrice,
    formatPrizePool,
    getSymbolEmoji,
    error: gameError
  } = mockGameData;

  const handleApprovalSuccess = () => {
    setIsApproved(true);
    setApprovalError(null);
    console.log('USDC approval successful!');
  };

  const handleApprovalError = (error: Error) => {
    setApprovalError(error.message);
    console.error('Approval failed:', error);
  };

  const handlePlay = () => {
    if (canPlay) {
      play();
    }
  };

  return (
    <div className="game-approval-example">
      <div className="game-header">
        <h2>🎮 Scratcher Game</h2>
        <div className="game-info">
          <p>Ticket Price: {formatTicketPrice()} USDC</p>
          <p>Prize Pool: {formatPrizePool()} USDC</p>
        </div>
      </div>

      <div className="approval-section">
        <ApprovalButton
          amount="1.00"
          onApprovalSuccess={handleApprovalSuccess}
          onApprovalError={handleApprovalError}
          className="game-approval"
        >
          {isApproved && canPlay && (
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="play-button"
              type="button"
            >
              {isPlaying ? (
                <span className="loading">
                  <span className="spinner"></span>
                  Playing...
                </span>
              ) : (
                '🎲 Play Game'
              )}
            </button>
          )}
        </ApprovalButton>

        {approvalError && (
          <div className="error-alert">
            <p>Approval Error: {approvalError}</p>
          </div>
        )}

        {gameError && (
          <div className="error-alert">
            <p>Game Error: {gameError.message}</p>
          </div>
        )}
      </div>

      {lastResult && (
        <div className="game-result">
          <h3>🎉 Game Result</h3>
          <div className="result-details">
            <p className="prize">
              Prize: <span className="amount">{lastResult.prizeFormatted} USDC</span>
            </p>
            <div className="symbols">
              <p>Symbols:</p>
              <div className="symbol-display">
                {lastResult.symbols.map((symbolIndex: any, index: number) => (
                  <span key={index} className="symbol">
                    {getSymbolEmoji(symbolIndex)}
                  </span>
                ))}
              </div>
            </div>
            <p className="symbol-names">
              {lastResult.symbolNames.join(', ')}
            </p>
            {lastResult.prize > 0 && (
              <p className="win-message">🎊 Congratulations! You won!</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .game-approval-example {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .game-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .game-header h2 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 24px;
        }

        .game-info {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .game-info p {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #64748b;
        }

        .game-info p:last-child {
          margin-bottom: 0;
        }

        .approval-section {
          margin-bottom: 24px;
        }

        .play-button {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .play-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
        }

        .play-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-alert {
          margin-top: 12px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }

        .game-result {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .game-result h3 {
          margin: 0 0 16px 0;
          color: #059669;
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .prize {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .amount {
          color: #059669;
          font-size: 20px;
        }

        .symbols p {
          margin: 0 0 8px 0;
          font-weight: 500;
          color: #374151;
        }

        .symbol-display {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .symbol {
          font-size: 32px;
          padding: 8px;
          background: white;
          border-radius: 8px;
          border: 2px solid #dcfce7;
        }

        .symbol-names {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .win-message {
          color: #059669;
          font-weight: 600;
          font-size: 16px;
          margin: 0;
        }

        @media (max-width: 640px) {
          .game-approval-example {
            padding: 16px;
          }

          .symbol {
            font-size: 28px;
            padding: 6px;
          }
        }
      `}</style>
    </div>
  );
}; 