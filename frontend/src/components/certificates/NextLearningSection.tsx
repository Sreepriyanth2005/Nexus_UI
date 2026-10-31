import React from "react";
import { useNavigate } from "react-router";

const NextLearningSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 mb-6">
      <h3 className="font-semibold text-base mb-4 text-gray-900">
        What's next on your CDMP path
      </h3>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Next Tier Card */}
        <div className="bg-[#f4f4f4] rounded-md p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              NEXT TIER
            </p>

            <h4 className="font-semibold text-gray-900 mb-1">
              CDMP Master
            </h4>

            <p className="text-xs text-gray-500">
              3 courses · ~80 study hours · Speaking + governance access
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={() => navigate("/member-learning")}
              className="bg-black text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              Enrol →
            </button>
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="bg-[#f4f4f4] rounded-md p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
              NEXT STEPS
            </p>

            <h4 className="font-semibold text-gray-900 mb-1">
              Keep building your portfolio
            </h4>

            <p className="text-xs text-gray-500">
              Explore the catalog to keep learning
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={() => navigate("/member-learning")}
              className="border border-gray-400 bg-white px-4 py-2 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Browse catalog
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Or <a href="#" className="underline decoration-gray-400 underline-offset-2">recommend Nexus Academy to your team</a> · 28 of your colleagues at Bank Muscat have certified.
      </p>
    </div>
  );
};

export default NextLearningSection;
