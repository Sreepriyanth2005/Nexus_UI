import React from "react";
import { useNavigate } from "react-router";

interface ProfileWarningBannerProps {
  progressPercentage: number;
}

const ProfileWarningBanner: React.FC<ProfileWarningBannerProps> = ({ progressPercentage }) => {
  const navigate = useNavigate();

  return (
    <div className="border border-red-400 bg-[#fff5f5] rounded-md p-4 mb-6">
      <div className="flex items-start justify-between gap-6">
        {/* Left Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-red-600 mb-3">
            Complete your profile to unlock this proof
          </h3>

          {/* Progress Section */}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-72 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <span className="text-xs font-medium text-gray-700">
              {progressPercentage}%
            </span>
          </div>

          <p className="text-xs text-gray-600">
            Missing: Phone number, Date of birth. Required before proof can be issued.
          </p>
        </div>

        {/* Button */}
        <button
          onClick={() => navigate("/profile")}
          className="bg-black text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-gray-800 transition-colors shrink-0"
        >
          Complete profile →
        </button>
      </div>
    </div>
  );
};

export default ProfileWarningBanner;
