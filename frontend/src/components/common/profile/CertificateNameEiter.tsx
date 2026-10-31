import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useUserStore } from "../../../store/user.store";
import {
  useGetNameConfirmation,
  useConfirmAndGenerate,
  useUpdateCertificateName,
} from "../../../hooks/certificate-name-editor/certificateNameEditor";

const CertificateNameEiter = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId") || "default-course-id";

  const user = useUserStore((state) => state.user);
  const userId = user?.id || "";

  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Get name confirmation
  const { data: nameData, isLoading: isNameLoading } = useGetNameConfirmation(userId, !!userId);

  // Confirm/Generate mutation
  const confirmGenerateMutation = useConfirmAndGenerate();

  // Update name / OTP trigger mutation
  const updateNameMutation = useUpdateCertificateName();

  useEffect(() => {
    if (nameData?.data?.currentName) {
      setName(nameData.data.currentName);
    }
  }, [nameData]);

  const handleGenerateProof = async () => {
    if (!confirmed || !userId || !courseId) return;
    setErrorMsg("");

    try {
      await confirmGenerateMutation.mutateAsync({
        userId,
        courseId,
        confirmedName: name,
      });
      navigate(`/course-completed?courseId=${courseId}`);
    } catch (err: any) {
      console.error("Failed to generate proof:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to confirm and generate certificate");
    }
  };

  const handleSendVerificationCode = async () => {
    if (!name.trim()) return;
    setErrorMsg("");

    try {
      const response = await updateNameMutation.mutateAsync(name);
      if (response.data?.otpRequired) {
        navigate("/certificate-name-verify-otp", {
          state: {
            certificateName: name,
            courseId,
          },
        });
      } else {
        // Direct update without OTP
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error("Failed to trigger update:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to trigger certificate name change");
    }
  };

  if (isNameLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <p className="text-gray-500 font-medium">Loading details...</p>
      </div>
    );
  }

  // ==========================
  // EDIT NAME SCREEN
  // ==========================
  if (isEditing) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="border border-gray-300 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Edit certificate name
            </h2>

            <p className="mt-3 text-gray-600">
              This name appears on all future certificates.
              Changing it requires verification.
            </p>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                {errorMsg}
              </div>
            )}

            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-400 rounded-md px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <p className="mt-6 text-sm text-gray-500 leading-6">
              Use your name exactly as it appears on official ID.
              Changing this name applies to future certificates only.
            </p>

            <button
              onClick={handleSendVerificationCode}
              disabled={updateNameMutation.isPending}
              className="w-full mt-8 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50"
            >
              {updateNameMutation.isPending ? "Sending code..." : "Send verification code"}
            </button>

            <button
              onClick={() => {
                setIsEditing(false);
                setErrorMsg("");
              }}
              className="w-full mt-3 border border-gray-300 py-4 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  // CONFIRM NAME SCREEN
  // ==========================
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-stone-900 text-[#FCF7AE] flex items-center justify-center text-[8px] font-bold">
              NX
            </div>

            <span className="font-semibold text-lg tracking-wide">
              Nexus Academy
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-[34px] font-bold text-gray-900 leading-tight">
          Confirm your name for this course completion proof
        </h1>

        <p className="mt-4 text-center text-sm text-gray-600 leading-6 max-w-md mx-auto">
          This is the name that will appear on your course completion proof.
          Once issued, it cannot be edited on this certificate.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Name Preview */}
        <div className="mt-8 border border-gray-300 rounded-lg bg-[#fafafa] p-5">
          <p className="uppercase text-[11px] tracking-[0.2em] text-gray-500 mb-3">
            Name as it will appear
          </p>

          <h2 className="font-serif text-[42px] font-bold text-gray-900">
            {name}
          </h2>
        </div>

        {/* Confirmation */}
        <div className="mt-6 flex items-start gap-3">
          <input
            id="confirm-name"
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer"
          />

          <label
            htmlFor="confirm-name"
            className="text-sm text-gray-700 leading-6 cursor-pointer"
          >
            I confirm this name is correct as it appears on my official ID.
            I understand future certificates will use this name unless I
            update it in my profile.
          </label>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleGenerateProof}
            disabled={!confirmed || confirmGenerateMutation.isPending}
            className={`w-full rounded-lg py-4 font-semibold transition-all ${
              confirmed && !confirmGenerateMutation.isPending
                ? "bg-black text-white hover:bg-gray-900"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {confirmGenerateMutation.isPending ? "Generating..." : "Confirm and generate proof"}
          </button>

          <button
            onClick={() => {
              setIsEditing(true);
              setErrorMsg("");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white py-4 font-medium text-gray-900 hover:bg-gray-50 transition-all"
          >
            Edit name first
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateNameEiter;