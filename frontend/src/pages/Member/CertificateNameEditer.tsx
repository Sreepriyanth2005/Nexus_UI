import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateCertificateName,
  useVerifyProfileOtp,
  useResendProfileOtp,
} from "../../hooks/certificate-name-editor/certificateNameEditor";
import { useUserStore } from "../../store/user.store";

interface CertificateNameEditerProps {
  initialName?: string;
  onClose?: () => void;
  onSubmit?: (newName: string) => void;
}

const RESEND_INTERVAL_SECONDS = 60;

const CertificateNameEditer = ({
  initialName = "",
  onClose,
  onSubmit,
}: CertificateNameEditerProps) => {
  const [name, setName] = useState(initialName);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(RESEND_INTERVAL_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const user = useUserStore((state) => state.user);
  const userEmail = user?.email || "your email";
  const queryClient = useQueryClient();

  const updateNameMutation = useUpdateCertificateName();
  const verifyOtpMutation = useVerifyProfileOtp();
  const resendOtpMutation = useResendProfileOtp();

  // Handle countdown timer for resend OTP
  useEffect(() => {
    if (step !== "otp" || canResend) return;

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
  }, [step, canResend]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  const handleSendCode = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name.");
      return;
    }

    setErrorMsg("");

    try {
      const response = await updateNameMutation.mutateAsync(name.trim());
      
      const isOtpRequired = (response as any)?.otpRequired ?? (response as any)?.data?.otpRequired;
      
      if (isOtpRequired === false) {
        toast.success("Name updated successfully!");
        if (onSubmit) onSubmit(name.trim());
        if (onClose) onClose();
      } else {
        toast.success("Verification code sent to your email.");
        setStep("otp");
        setTimer(RESEND_INTERVAL_SECONDS);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || "Failed to send code.");
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    setErrorMsg("");

    if (otpValue.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    try {
      const response = await verifyOtpMutation.mutateAsync(otpValue);
      toast.success("Certificate name updated successfully!");

      // Invalidate relevant queries so certificate preview and profile instantly update
      queryClient.invalidateQueries({ queryKey: ["certificateName"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      if (onSubmit) onSubmit(name.trim());
      if (onClose) onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Invalid or expired verification code.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg("");
    try {
      await resendOtpMutation.mutateAsync();
      toast.success("A new verification code has been sent to your email!");
      setTimer(RESEND_INTERVAL_SECONDS);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to resend verification code.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-(--scrim) backdrop-blur-sm p-4 z-[9999]">
      <div className="bg-(--paper) rounded-[24px] w-full max-w-[540px] shadow-card overflow-hidden animate-in fade-in zoom-in duration-200 p-8 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {step === "otp" && (
              <button
                onClick={() => {
                  setStep("input");
                  setErrorMsg("");
                }}
                className="p-1.5 hover:bg-(--surface-3) rounded-full transition-colors text-(--ink-mute) hover:text-(--ink) cursor-pointer mr-1"
                title="Back to edit name"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-[12px] font-bold text-(--ink-mute) uppercase tracking-widest">
              LEARNING CREDENTIAL
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-(--surface-3) rounded-full transition-colors text-(--ink-mute) hover:text-(--ink) cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {step === "input" ? (
          <>
            {/* Title Section */}
            <div className="mb-6">
              <h1 className="text-[24px] font-bold text-(--ink) leading-[1.2]">
                Edit the name on your Learning Credential
              </h1>
            </div>

            {/* Inner Form Container */}
            <div className="border border-(--line) rounded-[14px] p-6 mb-4 bg-(--paper)">
              <h3 className="text-[16px] font-bold text-(--ink) mb-1">
                Edit the name on your Learning Credential
              </h3>
              <p className="text-(--ink-mute) text-[16px] mb-6">
                This name appears on all future Learning Credentials.
              </p>

              <div className="mb-6">
                <label className="block text-[12px] font-bold text-(--ink-mute) uppercase tracking-widest mb-2">
                  NAME ON LEARNING CREDENTIAL
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-[18px] py-[14px] bg-(--paper) border-[1.5px] border-(--line) rounded-[10px] text-(--ink) font-bold text-[18px] focus:outline-none focus:border-(--ink) transition-colors"
                  placeholder="Enter your name"
                  autoFocus
                />
                <p className="text-(--ink-mute) text-[14px] mt-4 leading-relaxed">
                  Use your name exactly as it appears on official ID. Name changes apply only to future Learning Credentials.
                </p>
              </div>

              <button
                onClick={handleSendCode}
                disabled={updateNameMutation.isPending}
                className="inline-flex w-full justify-center items-center gap-2 px-[18px] py-[14px] bg-(--btn) hover:bg-(--btn-hover) text-(--ink) font-bold text-[16px] rounded-full border-[1.5px] border-[#c99b2e8c] shadow-[0_4px_16px_-4px_#2a11081f] hover:shadow-hover hover:-translate-y-[2px] transition-all duration-[160ms] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                {updateNameMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  "Send verification code"
                )}
              </button>
            </div>
            
            <div>
              <button
                onClick={onClose}
                className="inline-flex w-full justify-center items-center gap-2 px-[18px] py-[14px] bg-(--paper) hover:bg-(--surface-3) text-(--ink) font-bold text-[16px] rounded-full border-[1.5px] border-(--line) hover:border-(--ink-mute) shadow-none hover:shadow-sm hover:-translate-y-[2px] transition-all duration-[160ms] cursor-pointer"
              >
                Cancel, go back
              </button>
            </div>
          </>
        ) : (
          <>
            {/* OTP Verification Step */}
            <div className="mb-6">
              <h1 className="text-[24px] font-bold text-(--ink) leading-[1.2]">
                Verify Your Identity
              </h1>
              <p className="text-(--ink-mute) text-[14px] mt-1.5">
                We sent a 6-digit verification code to <span className="font-semibold text-(--ink)">{userEmail}</span>.
              </p>
            </div>

            <div className="border border-(--line) rounded-[14px] p-6 mb-4 bg-(--paper)">
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <p className="text-(--ink) text-[14px] mb-4">
                Enter the code below to confirm updating your certificate name to <strong className="text-(--ink)">"{name}"</strong>:
              </p>

              {/* 6-box OTP inputs */}
              <div className="flex gap-2.5 justify-center mb-6">
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
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-14 border-[1.5px] border-(--line) focus:border-(--ink) rounded-[10px] text-center text-2xl font-bold bg-(--paper) text-(--ink) focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
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

              {/* Resend Section */}
              <div className="text-center mt-5">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendOtpMutation.isPending}
                    className="text-sm font-semibold text-(--ink) underline hover:text-black cursor-pointer disabled:opacity-50"
                  >
                    {resendOtpMutation.isPending ? "Resending code..." : "Resend code"}
                  </button>
                ) : (
                  <span className="text-sm text-(--ink-mute)">
                    Resend code in <strong className="text-(--ink)">{timer}s</strong>
                  </span>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => {
                  setStep("input");
                  setErrorMsg("");
                }}
                className="inline-flex w-full justify-center items-center gap-2 px-[18px] py-[14px] bg-(--paper) hover:bg-(--surface-3) text-(--ink) font-bold text-[16px] rounded-full border-[1.5px] border-(--line) hover:border-(--ink-mute) shadow-none hover:shadow-sm hover:-translate-y-[2px] transition-all duration-[160ms] cursor-pointer"
              >
                Back to edit name
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default CertificateNameEditer;

