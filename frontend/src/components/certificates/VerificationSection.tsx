import React from "react";

interface VerificationSectionProps {
  verificationUrl: string;
}

const VerificationSection: React.FC<VerificationSectionProps> = ({ verificationUrl }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!verificationUrl) return;
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 mb-6">
      <h3 className="font-semibold text-sm mb-2 text-gray-900">
        Verification
      </h3>

      <p className="text-xs text-gray-500 mb-4">
        Anyone can verify this credential without logging in.
      </p>

      <div className="flex gap-3">
        <input
          readOnly
          value={verificationUrl}
          className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-xs bg-gray-50 text-gray-600 font-mono focus:outline-none"
        />

        <button
          onClick={handleCopy}
          className="border border-gray-300 px-5 py-2 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors min-w-[80px]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
};

export default VerificationSection;
