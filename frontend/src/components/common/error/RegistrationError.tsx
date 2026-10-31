import React from 'react';

type RegistrationErrorProps = {
  message: string;
  onClose?: () => void;
};

const RegistrationError: React.FC<RegistrationErrorProps> = ({ message, onClose }) => {
  return (
    <div style={{
      padding: '16px',
      background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
      border: '1px solid #fee2e2',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.05), 0 4px 6px -2px rgba(220, 38, 38, 0.02)',
      animation: 'slideIn 0.3s ease-out',
      fontFamily: '"Outfit", "Inter", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        backgroundColor: '#ef4444'
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        flexShrink: 0
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#991b1b', marginBottom: '2px' }}>
          Validation Error
        </div>
        <div style={{ fontSize: '13px', color: '#b91c1c', opacity: 0.8, lineHeight: 1.5 }}>
          {message}
        </div>
      </div>

      {onClose && (
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#ef4444',
            cursor: 'pointer',
            opacity: 0.6,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RegistrationError;
