import React from 'react';
import { isUserRejectedError } from '../utils/errorHandling';

interface ErrorMessageProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  onDismiss, 
  className = '' 
}) => {
  if (!error) return null;

  const isRejection = error === 'User rejected the request';
  
  return (
    <div className={`error-message ${isRejection ? 'rejection-error' : 'general-error'} ${className}`}>
      <div className="error-content">
        <div className="error-icon">
          {isRejection ? '🚫' : '⚠️'}
        </div>
        <div className="error-text">
          <p className="error-title">
            {isRejection ? 'Transaction Cancelled' : 'Error'}
          </p>
          <p className="error-description">{error}</p>
        </div>
        {onDismiss && (
          <button 
            className="error-dismiss" 
            onClick={onDismiss}
            title="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      <style jsx>{`
        .error-message {
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
          font-family: system-ui, -apple-system, sans-serif;
          animation: slideIn 0.3s ease-out;
        }

        .rejection-error {
          background: linear-gradient(135deg, #fef7cd 0%, #fef3c7 100%);
          border: 1px solid #fbbf24;
          color: #92400e;
        }

        .general-error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 1px solid #f87171;
          color: #991b1b;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-icon {
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-text {
          flex: 1;
          min-width: 0;
        }

        .error-title {
          font-weight: 600;
          font-size: 14px;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }

        .error-description {
          font-size: 13px;
          margin: 0;
          line-height: 1.4;
          opacity: 0.9;
          word-wrap: break-word;
        }

        .error-dismiss {
          background: none;
          border: none;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: inherit;
          opacity: 0.7;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .error-dismiss:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .error-message {
            margin: 8px 0;
            padding: 12px;
          }

          .error-content {
            gap: 8px;
          }

          .error-icon {
            font-size: 18px;
          }

          .error-title {
            font-size: 13px;
          }

          .error-description {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}; 