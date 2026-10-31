import React from "react";

type OtpErrorProps = {
    message: string;
    onRetry?: () => void;
};

const OtpError: React.FC<OtpErrorProps> = ({
    message,
    onRetry
}) => {
    return (
        <div
            style={{
                backgroundColor: "#fff5f5",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                boxShadow: "0 4px 12px rgba(220,38,38,0.08)"
            }}
        >
            {/* Sentry style icon */}
            <div
                style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "18px",
                    flexShrink: 0
                }}
            >
                !
            </div>

            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontWeight: 700,
                        color: "#991b1b",
                        marginBottom: "4px"
                    }}
                >
                    Verification Failed
                </div>

                <div
                    style={{
                        fontSize: "13px",
                        color: "#7f1d1d"
                    }}
                >
                    {message}
                </div>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        style={{
                            marginTop: "10px",
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0
                        }}
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
};

export default OtpError;