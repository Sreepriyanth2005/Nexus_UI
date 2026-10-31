import React from 'react';

type EmailErrorProps = {
  message: string;
  onRetry?: () => void;
};

const EmailError: React.FC<EmailErrorProps> = ({ message, onRetry }) => {
  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#fff5f5',
      border: '1px solid #feb2b2',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'shake 0.4s ease-in-out',
      fontFamily: '"Inter", sans-serif'
    }}>
      {/* Error Icon */}
      <div style={{ color: '#e53e3e', marginTop: '2px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#c53030', marginBottom: '4px' }}>
          Authentication Failed
        </div>
        <div style={{ fontSize: '13px', color: '#9b2c2c', lineHeight: 1.4 }}>
          {message}
        </div>
        {onRetry && (
          <button 
            onClick={onRetry}
            style={{
              marginTop: '8px',
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#c53030',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Try another account
          </button>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default EmailError;
