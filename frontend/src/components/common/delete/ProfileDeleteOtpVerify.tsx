import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "../../../hooks/profile/useProfile";
import { Trash2 } from "lucide-react";
import { useAuthStore } from "../../../core/auth/auth.store";

const ProfileDeleteOtpVerify: React.FC = () => {
  const navigate = useNavigate();
  const { profile, resendOtp, deleteAccount } = useProfile();
  const logout = useAuthStore((state) => state.logout);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(272); // 4:32 in seconds
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take only the last character if multiple are entered somehow
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);

      // Focus the next empty input or the last one
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");
  const userEmail = profile?.email || "your email";

  const handleResend = async () => {
    try {
      setIsResending(true);
      setErrorMsg("");
      await resendOtp();
      setTimeLeft(272); // Reset timer to 4:32
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isOtpComplete) {
      try {
        setIsDeleting(true);
        setErrorMsg("");

        await deleteAccount(otp.join(""));

        console.log("Account deletion confirmed");
        await logout();
        navigate("/login");
      } catch (err: any) {
        setErrorMsg(err.message || "Invalid OTP or deletion failed");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center ">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 md:p-5 max-w-[480px] w-full text-center">

        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-[#fceae9] border-[1.5px] border-[#d92d20] rounded-full flex items-center justify-center mb-6 text-[#d92d20]">
          <Trash2 size={24} strokeWidth={2} />
        </div>

        {/* Title & Description */}
        <h1 className="text-[24px] font-bold text-gray-900 mb-4 tracking-tight">
          Confirm account <span className="text-[#d92d20]">deletion</span>
        </h1>
        <p className="text-gray-600 text-[16px] mb-6 leading-relaxed max-w-[400px] mx-auto">
          We sent a 6-digit code to <span className="font-semibold text-gray-900">{userEmail}</span>.
          Enter it below to start the deletion process. Your account is soft-deleted first
          and stays recoverable during the grace window.
        </p>

        {/* OTP Input */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-11 h-14 sm:w-14 sm:h-16 bg-[#fafafa] border border-gray-200 rounded-xl text-center text-[22px] font-semibold text-gray-900 focus:border-[#d92d20] focus:ring-1 focus:ring-[#d92d20] focus:bg-white outline-none transition-all"
            />
          ))}
        </div>

        {/* Timer & Resend */}
        <div className="text-[14px] text-gray-500 mb-4">
          {timeLeft > 0 ? (
            <>Code expires in {formatTime(timeLeft)}</>
          ) : (
            <>Code <span className="text-[#d92d20]">expired</span></>
          )}
          {" · "}
          <button
            onClick={handleResend}
            disabled={isResending || timeLeft > 0}
            className={`${timeLeft > 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-gray-700 hover:underline cursor-pointer transition-colors"}`}
          >
            {isResending ? "Resending..." : "Resend"}
          </button>
        </div>

        {errorMsg && (
          <div className="text-sm text-red-600 mb-6 bg-red-50 p-2 rounded border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            disabled={!isOtpComplete || isDeleting}
            onClick={handleDeleteAccount}
            className={`w-full py-[14px] rounded-xl text-[16px] font-bold text-white transition-colors ${isOtpComplete && !isDeleting
              ? "bg-[#d92d20] hover:bg-[#b42318]"
              : "bg-[#e5a09a] cursor-not-allowed"
              }`}
          >
            {isDeleting ? "Deleting..." : "Delete my account"}
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full py-[14px] rounded-xl text-[16px] font-bold text-gray-900 bg-white border border-gray-400 hover:bg-gray-50 transition-colors"
          >
            Cancel deletion
          </button>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-[14px] text-gray-500 leading-relaxed max-w-[420px] mx-auto">
          A confirmation email will be sent to your inbox. The deletion timer starts immediately.
          Your account stays soft-deleted and can be reactivated within the 30-day grace window
          before it is permanently purged.
        </p>

      </div>
    </div>
  );
};

export default ProfileDeleteOtpVerify;
