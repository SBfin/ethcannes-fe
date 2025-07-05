import React from 'react';
import { SymbolInfo, formatPayout, getRarityColor } from '../utils/symbolMapping';

interface RevealedCellProps {
  symbolInfo: SymbolInfo;
  cellIndex: number;
  isRevealed: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  actualPayout?: number; // Optional actual payout from contract
  isAwaitingVRF?: boolean;
  isSelected?: boolean;
}

export const RevealedCell: React.FC<RevealedCellProps> = ({
  symbolInfo,
  cellIndex,
  isRevealed,
  onClick,
  size = 'medium',
  actualPayout,
  isAwaitingVRF = false,
  isSelected = false
}) => {
  const sizeClasses = {
    small: { width: '60px', height: '60px', fontSize: '24px' },
    medium: { width: '80px', height: '80px', fontSize: '32px' },
    large: { width: '100px', height: '100px', fontSize: '40px' }
  };

  const dimensions = sizeClasses[size];
  const rarityColor = getRarityColor(symbolInfo.rarity);

  // Use actual payout if provided, otherwise fall back to symbol's default payout
  const displayPayout = actualPayout !== undefined ? actualPayout : symbolInfo.payoutUSDC;

  return (
    <div
      onClick={onClick}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        border: `3px solid ${isRevealed ? rarityColor : 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isRevealed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isRevealed 
          ? `0 4px 8px rgba(0, 0, 0, 0.2), 0 0 20px ${rarityColor}40`
          : '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 0 8px rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        animation: isAwaitingVRF && !isRevealed && isSelected ? 'vrfRotation 2s infinite ease-in-out' : 'none',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Background glow for special items */}
      {isRevealed && symbolInfo.rarity !== 'Common' && symbolInfo.rarity !== 'Hole' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle, ${rarityColor}20 0%, transparent 70%)`,
            zIndex: 0,
          }}
        />
      )}

      {/* Content */}
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        {isRevealed ? (
          <>
            {/* Symbol */}
            <div 
              style={{ 
                fontSize: dimensions.fontSize,
                marginBottom: '4px',
                filter: symbolInfo.rarity === 'Ultra Legendary' ? 'drop-shadow(0 0 8px #ff6b9d)' :
                        symbolInfo.rarity === 'Legendary' ? 'drop-shadow(0 0 6px #ffd700)' :
                        symbolInfo.rarity === 'Epic' ? 'drop-shadow(0 0 4px #ff8c00)' : 'none'
              }}
            >
              {symbolInfo.symbol}
            </div>
            
            {/* Payout */}
            <div 
              style={{ 
                fontSize: size === 'small' ? '10px' : size === 'medium' ? '12px' : '14px',
                fontWeight: 'bold',
                color: displayPayout > 0 ? '#2d5a3d' : '#666',
                lineHeight: 1,
              }}
            >
              {formatPayout(displayPayout)}
            </div>

            {/* Rarity indicator for rare items */}
            {symbolInfo.rarity !== 'Common' && symbolInfo.rarity !== 'Hole' && (
              <div 
                style={{
                  fontSize: size === 'small' ? '8px' : '9px',
                  color: rarityColor,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: '2px',
                }}
              >
                {symbolInfo.rarity === 'Ultra Legendary' ? 'ULTRA' : 
                 symbolInfo.rarity === 'Legendary' ? 'LEGEND' :
                 symbolInfo.rarity}
              </div>
            )}
          </>
        ) : (
          /* Unrevealed state */
          <div 
            style={{ 
              fontSize: dimensions.fontSize,
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 'bold',
            }}
          >
            ⚷
          </div>
        )}
      </div>

      {/* Cell index label */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '4px',
          fontSize: '10px',
          color: isRevealed ? '#666' : 'rgba(255, 255, 255, 0.5)',
          fontWeight: 'bold',
        }}
      >
        {cellIndex}
      </div>

      {/* Special effects for rare items */}
      {isRevealed && symbolInfo.rarity === 'Ultra Legendary' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 107, 157, 0.1) 50%, transparent 70%)',
            animation: 'sparkle 2s infinite',
            zIndex: 0,
          }}
        />
      )}
    </div>
  );
};

// Add sparkle animation styles (you can add this to your global CSS)
const sparkleKeyframes = `
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: translateX(-100%); }
    50% { opacity: 1; transform: translateX(100%); }
  }

  @keyframes vrfRotation {
    0% { transform: rotateY(0deg) rotateX(0deg); }
    25% { transform: rotateY(90deg) rotateX(0deg); }
    50% { transform: rotateY(180deg) rotateX(90deg); }
    75% { transform: rotateY(270deg) rotateX(0deg); }
    100% { transform: rotateY(360deg) rotateX(0deg); }
  }
`;

// Helper component to inject the animation styles
export const CellAnimationStyles: React.FC = () => (
  <style>{sparkleKeyframes}</style>
); 