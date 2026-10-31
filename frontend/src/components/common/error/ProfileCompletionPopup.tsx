import React from "react";
import { useNavigate } from "react-router";

type Props = {
  percentage: number;
  onClose: () => void;
};

const ProfileCompletionPopup: React.FC<Props> = ({
  percentage,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        width: "360px",
        background: "#fff",
        borderRadius: "14px",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.12)",
        padding: "20px",
        zIndex: 9999,
        borderLeft: "6px solid #f59e0b",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Profile {percentage}% Complete
      </h3>

      <p
        style={{
          marginTop: "8px",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Complete your profile to unlock all
        platform features and recommendations.
      </p>

      <div
        style={{
          height: "10px",
          borderRadius: "8px",
          background: "#e5e7eb",
          overflow: "hidden",
          marginTop: "14px",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: "#f59e0b",
            transition: "0.3s",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "18px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => {
            navigate("/profile");
            onClose();
          }}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "#dc2626",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Complete Profile
        </button>

        <button onClick={onClose}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "#f3f4f6",
            cursor: "pointer",
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default ProfileCompletionPopup;
