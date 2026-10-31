import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../config/axios";
import { useUserStore } from "../../store/user.store";
import { toast } from "sonner";
import { Check, Edit2, ShieldCheck, ArrowRight, X, Award, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";
import CertificateNameEditer from "./CertificateNameEditer";

interface CertificateNameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  careerPathId?: string;
}

const CertificateNameChangeModal: React.FC<CertificateNameChangeModalProps> = ({
  isOpen,
  onClose,
  courseId,
  careerPathId
}) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch certificate name
  const { data: nameData, refetch } = useQuery({
    queryKey: ["certificateName", user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/certificates/name-confirmation/${user!.id}`);
      return data;
    },
    enabled: isOpen && !!user?.id,
  });

  const confirmedName = nameData?.data?.displayName || nameData?.data?.currentName || (user?.firstName ? `${user.firstName} ${user.lastName}` : "");

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        userId: user!.id,
        courseId: courseId || undefined,
        careerPathId: careerPathId || undefined,
        confirmedName,
      };
      const { data } = await api.post("/certificates/confirm-and-generate", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Certificate generated successfully!");
      onClose();
      const targetUrl = careerPathId
        ? `/certificate-detail?careerPathId=${careerPathId}`
        : `/certificate-detail?courseId=${courseId || ''}`;
      navigate(targetUrl);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "";
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("exists")
      ) {
        toast.info("Certificate is already available!");
        onClose();
        const targetUrl = careerPathId
          ? `/certificate-detail?careerPathId=${careerPathId}`
          : `/certificate-detail?courseId=${courseId || ''}`;
        navigate(targetUrl);
        return;
      }
      toast.error(msg || "Failed to generate certificate.");
    },
  });

  const handleGenerate = () => {
    if (!isConfirmed) return;
    generateMutation.mutate();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 z-[9990] font-sans">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/80 p-8 relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Award className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100">
            Digital Certificate Verification
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Confirm Your Legal Name
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            This name will be permanently stamped on your tamper-proof credential and verified with your digital QR code.
          </p>
        </div>

        {/* Name Display Card */}
        <div className="my-6 p-5 bg-gradient-to-tr from-slate-50 to-indigo-50/40 border border-indigo-100 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Certificate Recipient Name
          </span>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {confirmedName || "Loading..."}
          </p>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
          <input 
            type="checkbox" 
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
          />
          <span className="text-xs text-slate-600 leading-relaxed font-medium">
            I confirm that this is my official employee name and should appear on my digital certification proof.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowEditModal(true)}
            className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Name</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={!isConfirmed || generateMutation.isPending}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{generateMutation.isPending ? "Generating..." : "Generate & View Certificate"}</span>
          </button>
        </div>

      </div>

      {showEditModal && (
        <CertificateNameEditer 
          initialName={confirmedName} 
          onClose={() => setShowEditModal(false)}
          onSubmit={(newName) => {
            refetch();
          }}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CertificateNameChangeModal;
