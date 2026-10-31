import React from 'react';

type EmailVerificationErrorProps = {
  message: string;
  onRetry: () => void;
};

const EmailVerificationError: React.FC<EmailVerificationErrorProps> = ({ message, onRetry }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      maxWidth: '400px',
      margin: '0 auto',
      border: '1px solid #fee2e2',
      animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: '"Outfit", "Inter", sans-serif'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        backgroundColor: '#fee2e2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        color: '#ef4444',
        position: 'relative'
      }}>
        {/* Pulsing effect */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          opacity: 0.5,
          animation: 'pulse 2s infinite'
        }} />
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px', letterSpacing: '-0.02em' }}>
        Email Verification Required
      </h3>
      
      <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, marginBottom: '32px' }}>
        {message}
      </p>

      <button
        onClick={onRetry}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'transform 0.2s, background-color 0.2s',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#000')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
      >
        GO BACK & FIX EMAIL
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationError;
