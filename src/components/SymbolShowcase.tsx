import React from 'react';
import { SYMBOL_MAPPING } from '../utils/symbolMapping';

export const SymbolShowcase: React.FC = () => {
  // Sort symbols by payout (highest to lowest)
  const sortedSymbols = Object.entries(SYMBOL_MAPPING)
    .map(([payout, symbolInfo]) => ({ payout: Number(payout), symbolInfo }))
    .sort((a, b) => b.symbolInfo.payoutUSDC - a.symbolInfo.payoutUSDC);

  return (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.1)', 
      backdropFilter: 'blur(10px)',
      borderRadius: '12px', 
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'var(--creamy-white)'
    }}>
      <h3 style={{ 
        textAlign: 'center', 
        marginBottom: '16px', 
        color: 'var(--creamy-white)',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        💰 Payout Guide
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '8px'
      }}>
        {sortedSymbols.map(({ symbolInfo }) => (
          <div
            key={symbolInfo.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{symbolInfo.symbol}</span>
              <span style={{ fontWeight: '500' }}>${symbolInfo.payoutUSDC}</span>
            </div>
            <span style={{ 
              fontSize: '12px', 
              opacity: 0.8,
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {symbolInfo.probability}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}; 