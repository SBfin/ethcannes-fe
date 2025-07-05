import React from 'react';
import { useSimpleGameWatcher } from '../hooks/turn-based-scratcher/useSimpleGameWatcher';
import { formatUnits } from 'viem';

interface GameStatusProps {
  gameId: number | null;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameId }) => {
  const {
    gameData,
    gameState,
    currentRound,
    isAwaitingVRF,
    isInNegotiation,
    isFinished,
    lastUpdate,
  } = useSimpleGameWatcher(gameId);

  if (!gameId) {
    return null;
  }

  if (!gameData) {
    return (
      <div className="game-status loading">
        <p>Loading game data...</p>
      </div>
    );
  }

  const formatUSDC = (amount: bigint) => {
    return parseFloat(formatUnits(amount, 6)).toFixed(2);
  };

  return (
    <div className="game-status">
      <div className="game-header">
        <h3>Game #{gameId}</h3>
        <div className="game-state">
          <span className={`state-badge ${isAwaitingVRF ? 'awaiting' : isInNegotiation ? 'negotiation' : isFinished ? 'finished' : ''}`}>
            {gameState}
          </span>
        </div>
      </div>

      {isAwaitingVRF && (
        <div className="vrf-waiting">
          <div className="spinner"></div>
          <p>Generating secure random numbers for Round {currentRound}...</p>
          <p className="vrf-details">This usually takes 30-60 seconds</p>
          <p className="last-update">Last checked: {new Date(lastUpdate).toLocaleTimeString()}</p>
          <p className="vrf-tip">Your transaction is confirmed. We&apos;re now waiting for the VRF oracle to provide random numbers.</p>
        </div>
      )}

      {gameData && gameData.revealedPayouts && (
        <div className="game-details">
          <h4>Game Progress:</h4>
          <div className="payouts-grid">
            {gameData.revealedPayouts.map((payout: bigint, index: number) => (
              <div key={index} className={`round-payout ${payout > 0 ? 'revealed' : 'pending'}`}>
                <span className="round-label">Round {index + 1}:</span>
                <span className="payout-amount">
                  {payout > 0 ? `${formatUSDC(payout)} USDC` : 'Pending...'}
                </span>
              </div>
            ))}
          </div>

          {gameData.offeredPayouts && gameData.offeredPayouts.some((offer: bigint) => offer > 0) && (
            <div className="offers">
              <h4>House Offers:</h4>
              {gameData.offeredPayouts.map((offer: bigint, index: number) => 
                offer > 0 ? (
                  <div key={index} className="offer">
                    Round {index + 1}: {formatUSDC(offer)} USDC
                  </div>
                ) : null
              )}
            </div>
          )}

          {gameData.holeFound && (
            <div className="hole-found-notice">
              <p>💥 Hole found! Game ended early.</p>
            </div>
          )}
        </div>
      )}

      {isFinished && (
        <div className="game-finished">
          <h4>🎉 Game Complete!</h4>
          <p>Check your transaction history for final payouts.</p>
        </div>
      )}

      <style jsx>{`
        .game-status {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
          background: white;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .game-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 18px;
        }

        .state-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .state-badge.awaiting {
          background: #fef3c7;
          color: #92400e;
        }

        .state-badge.negotiation {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .state-badge.finished {
          background: #dcfce7;
          color: #166534;
        }

        .vrf-waiting {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #fef7cd 0%, #fef3c7 100%);
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #fbbf24;
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        .vrf-details {
          font-size: 14px;
          color: #92400e;
          margin: 8px 0 0 0;
        }

        .last-update {
          font-size: 12px;
          color: #6b7280;
          margin: 8px 0 0 0;
        }

        .vrf-tip {
          font-size: 14px;
          color: #92400e;
          margin: 8px 0 0 0;
          font-style: italic;
        }

        .game-details h4 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 16px;
        }

        .payouts-grid {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
        }

        .round-payout {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .round-payout.revealed {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .round-payout.pending {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }

        .round-label {
          font-weight: 600;
        }

        .offers {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .offer {
          padding: 8px 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .hole-found-notice {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 12px;
          margin-top: 16px;
          text-align: center;
        }

        .hole-found-notice::before {
          content: '💥';
          margin-right: 8px;
          font-size: 20px;
        }

        .hole-found-notice p {
          margin: 0;
          color: #dc2626;
          font-weight: 600;
        }

        .game-finished {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .game-finished h4 {
          margin: 0 0 12px 0;
          color: #065f46;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #64748b;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .game-status {
            padding: 16px;
            margin: 12px 0;
          }

          .game-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .payouts-grid {
            gap: 6px;
          }

          .round-payout {
            padding: 6px 10px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}; 