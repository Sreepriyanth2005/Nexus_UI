import { Modal } from "antd";
import type { NavigateFunction } from "react-router";

export function showProfileIncompleteModal(
  navigate: NavigateFunction,
  message?: string,
  _percentage?: number
) {
  const displayMsg =
    message ||
    "Your profile is not 80% completed. Please update your profile first, then enroll.";

  Modal.warning({
    title: (
      <span className="text-[17px] font-bold text-gray-900">
        Profile Completion Required
      </span>
    ),
    width: 440,
    centered: true,
    content: (
      <div className="py-2">
        <p className="text-[14px] text-gray-700 leading-relaxed font-medium">
          {displayMsg}
        </p>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[12px] text-amber-800">
            <strong>Note:</strong> Members must complete at least <strong>80%</strong> of their profile before enrolling in any course or career path.
          </p>
        </div>
      </div>
    ),
    okText: "Update Profile",
    okButtonProps: {
      style: { backgroundColor: "#dc2626", borderColor: "#dc2626", fontWeight: 600 },
    },
    onOk: () => {
      navigate("/profile");
    },
  });
}
