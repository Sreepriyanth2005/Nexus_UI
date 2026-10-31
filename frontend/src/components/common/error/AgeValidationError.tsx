import React from 'react';

interface AgeValidationErrorProps {
    message?: string;
    onRetry?: () => void;
}

const AgeValidationError: React.FC<AgeValidationErrorProps> = ({
    message = "You must be at least 16 years old to register.",
    onRetry
}) => {
    return (
        <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
        }}>
            <div style={{ color: '#ef4444', fontSize: '20px', lineHeight: '1' }}>⚠️</div>

            <div style={{ flex: 1 }}>
                <div style={{
                    color: '#b91c1c',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '4px'
                }}>
                    Age Requirement Not Met
                </div>
                <p style={{
                    color: '#991b1b',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: '1.5'
                }}>
                    {message}
                </p>
            </div>

            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Try Again
                </button>
            )}
        </div>
    );
};

export default AgeValidationError;