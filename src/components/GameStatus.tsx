import React from 'react';
import { useSimpleGameWatcher } from '../hooks/turn-based-scratcher/useSimpleGameWatcher';
import { formatUSDC } from '../utils/formatting';
import { Badge } from './Badge';

interface GameStatusProps {
  gameId: number | null;
}

const GameStatus: React.FC<GameStatusProps> = ({ gameId }) => {
  const {
    gameData,
    gameState,
    isAwaitingVRF,
    isInNegotiation,
    isFinished,
    lastUpdate,
    currentRound,
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

  const renderPayouts = () => (
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
  );

  const renderOffers = () => (
    gameData.offeredPayouts && gameData.offeredPayouts.some((offer: bigint) => offer > 0) && (
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
    )
  );

  return (
    <div className="game-status">
      <div className="game-header">
        <h3>Game #{gameId}</h3>
        <div className="game-state">
          <Badge className={`${isAwaitingVRF ? 'awaiting' : isInNegotiation ? 'negotiation' : isFinished ? 'finished' : ''}`}>
            {gameState}
          </Badge>
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

      {gameData && (
        <div className="game-details">
          <h4>Game Progress:</h4>
          {renderPayouts()}
          {renderOffers()}
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

        .hole-found-notice p {
          margin: 0;
          font-weight: bold;
          color: #991b1b;
        }

        .game-finished {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          text-align: center;
        }

        .game-finished h4 {
          margin: 0 0 8px 0;
          color: #14532d;
        }

        .game-finished p {
          margin: 0;
          color: #166534;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export const MemoizedGameStatus = React.memo(GameStatus); 