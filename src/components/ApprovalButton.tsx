import React from 'react';
import { useApproval } from '../hooks';

interface ApprovalButtonProps {
  amount?: string;
  chainId?: number;
  spenderOverride?: string;
  onApprovalSuccess?: () => void;
  onApprovalError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ApprovalButton: React.FC<ApprovalButtonProps> = ({
  amount = '1.00',
  chainId,
  spenderOverride,
  onApprovalSuccess,
  onApprovalError,
  className = '',
  disabled = false,
  children
}) => {
  const {
    isApproving,
    isApproved,
    needsApproval,
    currentAllowance,
    approve,
    error,
  } = useApproval({
    amount,
    chainId,
    spenderOverride: spenderOverride as `0x${string}` | undefined
  });

  // Handle approval success
  React.useEffect(() => {
    if (isApproved && !isApproving) {
      onApprovalSuccess?.();
    }
  }, [isApproved, isApproving, onApprovalSuccess]);

  // Handle approval error
  React.useEffect(() => {
    if (error) {
      onApprovalError?.(error);
    }
  }, [error, onApprovalError]);

  // Show success state if already approved
  if (isApproved && !needsApproval) {
    return (
      <div className={`approval-button approved ${className}`}>
        <div className="approval-info">
          <p className="success-text">✅ USDC Approved</p>
          <p className="allowance">Allowance: {(Number(currentAllowance) / 1000000).toFixed(2)} USDC</p>
          {children && <div className="children">{children}</div>}
        </div>
      </div>
    );
  }

  // Show approval buttons if approval is needed
  return (
    <div className={`approval-button needs-approval ${className}`}>
      <div className="approval-content">
        <div className="approval-info">
          <p className="info-text">Approve USDC to play the game</p>
          <p className="amount">Amount: {amount} USDC</p>
          {currentAllowance > 0 && (
            <p className="current-allowance">
              Current allowance: {(Number(currentAllowance) / 1000000).toFixed(2)} USDC
            </p>
          )}
        </div>

        <div className="approval-buttons">
          <button
            onClick={approve}
            disabled={disabled || isApproving}
            className="approve-button"
            type="button"
          >
            {isApproving ? (
              <span className="loading">
                <span className="spinner"></span>
                Approving...
              </span>
            ) : (
              'Approve USDC'
            )}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p className="error-text">❌ Approval Failed</p>
            <p className="error-details">{error.message}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .approval-button {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: white;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .insufficient-balance {
          border-color: #fee2e2;
          background: #fef2f2;
        }

        .approved {
          border-color: #dcfce7;
          background: #f0fdf4;
        }

        .needs-approval {
          border-color: #fef3c7;
          background: #fffbeb;
        }

        .approval-info p {
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .error-text {
          color: #dc2626;
          font-weight: 600;
        }

        .success-text {
          color: #059669;
          font-weight: 600;
        }

        .info-text {
          color: #92400e;
          font-weight: 600;
        }

        .balance, .allowance, .current-allowance, .amount {
          color: #6b7280;
        }

        .approval-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .approve-button {
          flex: 1;
          min-width: 140px;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .exact-amount {
          background: #3b82f6;
          color: white;
        }

        .exact-amount:hover:not(:disabled) {
          background: #2563eb;
        }

        .max-amount {
          background: #6366f1;
          color: white;
        }

        .max-amount:hover:not(:disabled) {
          background: #5b21b6;
        }

        .approve-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .error-message {
          margin-top: 12px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 8px;
        }

        .error-details {
          font-size: 12px;
          color: #991b1b;
          margin-top: 4px;
        }

        .transaction-info {
          margin-top: 12px;
          padding: 8px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .tx-info {
          font-size: 12px;
          color: #64748b;
        }

        .tx-link {
          color: #3b82f6;
          text-decoration: none;
        }

        .tx-link:hover {
          text-decoration: underline;
        }

        .children {
          margin-top: 16px;
        }

        @media (max-width: 640px) {
          .approval-buttons {
            flex-direction: column;
          }

          .approve-button {
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
}; 