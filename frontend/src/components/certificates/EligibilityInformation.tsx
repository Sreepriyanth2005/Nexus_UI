import React from "react";

const EligibilityInformation: React.FC = () => {
  return (
    <div className="border border-yellow-400 border-dashed bg-[#fffdf0] rounded-md p-4 text-xs text-gray-700 leading-relaxed">
      <span className="font-bold text-gray-900">Eligibility:</span> Cert only downloadable when (a) 100% lessons completed, (b) all assessments passed, (c) <span className="font-bold text-gray-900">mandatory profile fields complete</span> (name, DOB, gender, city, phone, photo). Optional fields like LinkedIn URL enhance your professional profile but don't gate the certificate.
    </div>
  );
};

export default EligibilityInformation;
