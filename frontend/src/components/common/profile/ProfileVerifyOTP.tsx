// src/features/profile/components/ProfileVerifyOTP.tsx

import React, { useEffect, useRef, useState } from "react";
import { useProfile } from "../../../hooks/profile/useProfile";
import "./ProfileVerifyOTP.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RESEND_SECONDS = 60;

const ProfileVerifyOTP: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  const {
    verifyOtp,
    resendOtp,
    cancelPendingUpdate,
    loading,
  } = useProfile();

  useEffect(() => {
    if (!isOpen) return;

    setOtp(Array(6).fill(""));
    setTimer(RESEND_SECONDS);
    setCanResend(false);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || canResend) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, canResend]);

  const handleChange = (
    index: number,
    value: string
  ) => {
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);

    const updated = [...otp];
    updated[index] = digit;

    setOtp(updated);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== 6) return;

    try {
      await verifyOtp({
        otp: code,
      });

      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp();

      setOtp(Array(6).fill(""));
      setTimer(RESEND_SECONDS);
      setCanResend(false);

      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPendingUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal">

        <h2>Verify Your Identity</h2>

        <p>
          Enter the 6-digit OTP sent to your registered email.
        </p>

        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                if (el) inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              className="otp-digit"
              onChange={(e) =>
                handleChange(index, e.target.value)
              }
              onKeyDown={(e) =>
                handleKeyDown(index, e)
              }
              onPaste={handlePaste}
            />
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend OTP"}
            </button>
          ) : (
            <small>
              You can resend OTP in{" "}
              <strong>{timer}s</strong>
            </small>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            onClick={handleVerify}
            disabled={
              loading || otp.join("").length !== 6
            }
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileVerifyOTP;