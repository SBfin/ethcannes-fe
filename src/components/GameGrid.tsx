import React from 'react';
import { RevealedCell, CellAnimationStyles } from './RevealedCell';
import { getSymbolByPayout, SYMBOL_MAPPING } from '../utils/symbolMapping';

interface GameGridProps {
  revealedCells?: Array<{
    cellIndex: number;
    randomValue: number;
    payout: number;
  }>;
  selectedCells?: number[];
  onCellClick?: (cellIndex: number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showCellNumbers?: boolean;
  isAwaitingVRF?: boolean;
}

export const GameGrid: React.FC<GameGridProps> = ({
  revealedCells = [],
  selectedCells = [],
  onCellClick,
  disabled = false,
  size = 'medium',
  showCellNumbers = true,
  isAwaitingVRF = false
}) => {
  // Create a map of revealed cells for quick lookup
  const revealedCellMap = new Map(
    revealedCells.map(cell => [cell.cellIndex, cell])
  );

  // Grid layout: 3x3 grid with cells numbered 0-8
  const gridCells = Array.from({ length: 9 }, (_, index) => {
    const revealedCell = revealedCellMap.get(index);
    const isRevealed = !!revealedCell;
    const isSelected = selectedCells.includes(index);
    
    // Get symbol info based on actual payout instead of random value
    const symbolInfo = isRevealed 
      ? getSymbolByPayout(revealedCell.payout)  // Use actual payout from contract
      : SYMBOL_MAPPING[0]; // Default to unknown

    return {
      cellIndex: index,
      isRevealed,
      isSelected,
      symbolInfo,
      revealedData: revealedCell
    };
  });

  const handleCellClick = (cellIndex: number) => {
    if (!disabled && onCellClick && !revealedCellMap.has(cellIndex)) {
      onCellClick(cellIndex);
    }
  };

  return (
    <>
      <CellAnimationStyles />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          padding: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxWidth: 'fit-content',
          margin: '0 auto',
        }}
      >
        {gridCells.map(({ cellIndex, isRevealed, isSelected, symbolInfo, revealedData }) => (
          <div
            key={cellIndex}
            style={{
              position: 'relative',
              transform: isSelected && !isRevealed ? 'scale(0.95)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
          >
            {/* Selection indicator */}
            {isSelected && !isRevealed && (
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '-6px',
                  right: '-6px',
                  bottom: '-6px',
                  borderRadius: '18px',
                  zIndex: 1,
                  animation: 'pulseGlow 2s infinite',
                  boxShadow: '0 0 15px 3px rgba(255, 215, 0, 0.6)',
                  pointerEvents: 'none',
                }}
              />
            )}
            
            <RevealedCell
              symbolInfo={symbolInfo}
              cellIndex={showCellNumbers ? cellIndex : -1}
              isRevealed={isRevealed}
              onClick={() => handleCellClick(cellIndex)}
              size={size}
              actualPayout={revealedData ? revealedData.payout / 1e6 : undefined}
              isAwaitingVRF={isAwaitingVRF}
              isSelected={isSelected}
            />
          </div>
        ))}
      </div>

      {/* Game stats */}
      {revealedCells.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.9)',
              whiteSpace: 'nowrap'
            }}>
              Total Payout: ${(() => {
                // Check if any cell is a hole (payout = 0)
                const hasHole = revealedCells.some(cell => {
                  const symbolInfo = getSymbolByPayout(cell.payout);
                  return symbolInfo.payoutUSDC === 0;
                });
                
                // If hole found, total payout is 0
                if (hasHole) return '0.00';
                
                // Use the actual payout values from revealed cells data (converted from microUSDC)
                return revealedCells.reduce((sum, cell) => {
                  return sum + (cell.payout / 1e6); // Convert from microUSDC to USDC
                }, 0).toFixed(2);
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px 3px rgba(255, 215, 0, 0.6); }
          50% { box-shadow: 0 0 20px 5px rgba(255, 215, 0, 0.8); }
        }
      `}</style>
    </>
  );
}; 