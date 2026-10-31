import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "../../../store/user.store";
import { useVerifyProfileOtp, useResendProfileOtp } from "../../../hooks/certificate-name-editor/certificateNameEditor";
import { Loader2 } from "lucide-react";

const RESEND_INTERVAL_SECONDS = 60;

const CertificateNameVerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const user = useUserStore((state) => state.user);
  const userEmail = user?.email || "your email";

  const { courseId, careerPathId, certificateName } = (location.state as any) || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(RESEND_INTERVAL_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const verifyOtpMutation = useVerifyProfileOtp();
  const resendOtpMutation = useResendProfileOtp();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (canResend) return;

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
  }, [canResend]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
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
    const otpValue = otp.join("");
    setErrorMsg("");
    setSuccessMsg("");

    if (otpValue.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      await verifyOtpMutation.mutateAsync(otpValue);
      setSuccessMsg("Certificate name updated successfully!");

      queryClient.invalidateQueries({ queryKey: ["certificateName"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      setTimeout(() => {
        if (courseId) {
          navigate(`/certificate-detail?courseId=${courseId}${careerPathId ? `&careerPathId=${careerPathId}` : ""}`);
        } else {
          navigate(-1);
        }
      }, 1200);
    } catch (err: any) {
      console.error("Verification failed:", err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || err.message || "Invalid or expired OTP");
    }
  };

  const handleResend = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await resendOtpMutation.mutateAsync();
      setSuccessMsg("A new verification code has been sent!");
      setTimer(RESEND_INTERVAL_SECONDS);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error("Resend failed:", err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to resend verification code");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-(--surface-3) flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-(--paper) border border-(--line) rounded-2xl p-8 shadow-card">
        <div>
          
          {/* Status Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
              {successMsg}
            </div>
          )}

          <p className="text-[12px] font-bold text-(--ink-mute) uppercase tracking-widest mb-2">
            LEARNING CREDENTIAL
          </p>

          <h1 className="text-[24px] font-bold text-(--ink) leading-tight mb-2">
            Verify Your Identity
          </h1>

          {/* Description */}
          <p className="text-(--ink-soft) text-[15px] mb-2">
            Verification code sent to{" "}
            <span className="font-semibold text-(--ink)">
              {userEmail}
            </span>
          </p>

          <p className="text-(--ink-mute) text-[14px] mb-6">
            Enter the 6-digit code to confirm your certificate name change{certificateName ? ` to "${certificateName}"` : ""}.
          </p>

          {/* OTP Inputs */}
          <div className="flex gap-2.5 justify-center mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) =>
                  handleChange(e.target.value, index)
                }
                onKeyDown={(e) =>
                  handleKeyDown(e, index)
                }
                onPaste={handlePaste}
                className="w-12 h-14 border-[1.5px] border-(--line) focus:border-(--ink) rounded-[10px] text-center text-2xl font-bold bg-(--paper) text-(--ink) focus:outline-none transition-colors"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
            className="inline-flex w-full justify-center items-center gap-2 px-[18px] py-[14px] bg-(--btn) hover:bg-(--btn-hover) text-(--ink) font-bold text-[16px] rounded-full border-[1.5px] border-[#c99b2e8c] shadow-[0_4px_16px_-4px_#2a11081f] hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[160ms] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            {verifyOtpMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying and saving...</span>
              </>
            ) : (
              "Verify and save"
            )}
          </button>

          {/* Resend */}
          <div className="flex justify-center mt-5">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resendOtpMutation.isPending}
                className="text-sm font-semibold text-(--ink) underline hover:text-black cursor-pointer disabled:opacity-50"
              >
                {resendOtpMutation.isPending ? "Resending..." : "Resend code"}
              </button>
            ) : (
              <span className="text-sm text-(--ink-mute)">
                Resend code in <strong className="text-(--ink)">{timer}s</strong>
              </span>
            )}
          </div>
        </div>

        {/* Cancel */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleCancel}
            className="inline-flex w-full justify-center items-center gap-2 px-[18px] py-[14px] bg-(--paper) hover:bg-(--surface-3) text-(--ink) font-bold text-[16px] rounded-full border-[1.5px] border-(--line) hover:border-(--ink-mute) shadow-none hover:shadow-sm hover:-translate-y-[2px] transition-all duration-[160ms] cursor-pointer"
          >
            Cancel, go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateNameVerifyOtp;