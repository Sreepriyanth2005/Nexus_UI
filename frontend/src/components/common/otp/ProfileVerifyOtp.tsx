// // src/components/common/otp/ProfileVerifyOtp.tsx

// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router";
// import { useProfile } from "../../../hooks/profile/useProfile";

// const ProfileVerifyOtp: React.FC = () => {
//   const navigate = useNavigate();

//   const {
//     verifyOtp,
//     resendOtp,
//     cancelPendingUpdate,
//     getProfile,
//     loading,
//   } = useProfile();

//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [timer, setTimer] = useState(60);

//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

//   useEffect(() => {
//     if (timer <= 0) return;

//     const interval = setInterval(() => {
//       setTimer((prev) => prev - 1);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [timer]);

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;

//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };

//   const handleChange = (
//     value: string,
//     index: number
//   ) => {
//     if (!/^\d*$/.test(value)) return;

//     setErrorMsg("");

//     const newOtp = [...otp];
//     newOtp[index] = value.slice(-1);

//     setOtp(newOtp);

//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (
//     e: React.KeyboardEvent<HTMLInputElement>,
//     index: number
//   ) => {
//     if (
//       e.key === "Backspace" &&
//       !otp[index] &&
//       index > 0
//     ) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const handleVerify = async () => {
//     const code = otp.join("");

//     if (code.length !== 6) {
//       setErrorMsg("Please enter the 6-digit OTP.");
//       return;
//     }

//     try {
//       setErrorMsg("");

//       await verifyOtp({
//         otp: code,
//       });

//       await getProfile();

//       navigate("/profile");
//     } catch (err: any) {
//       setErrorMsg(
//         err.response?.data?.message ??
//           err.message ??
//           "Invalid OTP"
//       );
//     }
//   };

//   const handleResend = async () => {
//     try {
//       setErrorMsg("");

//       await resendOtp();

//       setTimer(60);
//       setOtp(["", "", "", "", "", ""]);

//       inputRefs.current[0]?.focus();
//     } catch (err: any) {
//       setErrorMsg(
//         err.response?.data?.message ??
//           err.message ??
//           "Failed to resend OTP"
//       );
//     }
//   };

//   const handleCancel = async () => {
//     try {
//       setErrorMsg("");

//       await cancelPendingUpdate();

//       navigate("/profile");
//     } catch (err: any) {
//       setErrorMsg(
//         err.response?.data?.message ??
//           err.message ??
//           "Failed to cancel profile update"
//       );
//     }
//   };

//   return (
//     <div className="min-h-screen flex w-screen items-center justify-center bg-slate-950 text-slate-100">
//       <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
//         <h2 className="mb-3 text-2xl font-bold">
//           Verify Profile Update
//         </h2>

//         <p className="mb-8 text-sm text-slate-400">
//           Enter the 6-digit OTP sent to your registered email.
//         </p>

//         <div className="mb-6 flex justify-between gap-2">
//           {otp.map((digit, index) => (
//             <input
//               key={index}
//               ref={(el) => {
//                 inputRefs.current[index] = el;
//               }}
//               type="text"
//               inputMode="numeric"
//               maxLength={1}
//               value={digit}
//               onChange={(e) =>
//                 handleChange(
//                   e.target.value,
//                   index
//                 )
//               }
//               onKeyDown={(e) =>
//                 handleKeyDown(e, index)
//               }
//               className="h-14 w-12 rounded-lg border border-slate-700 bg-slate-950 text-center text-xl font-bold text-white focus:border-rose-500 focus:outline-none"
//             />
//           ))}
//         </div>

//         {errorMsg && (
//           <div className="mb-6 rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-sm text-rose-400">
//             {errorMsg}
//           </div>
//         )}

//         <button
//           onClick={handleVerify}
//           disabled={loading}
//           className="mb-4 w-full rounded-lg bg-rose-600 py-3 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
//         >
//           {loading ? "Verifying..." : "Verify OTP"}
//         </button>

//         <div className="flex gap-4">
//           <button
//             onClick={handleCancel}
//             disabled={loading}
//             className="flex-1 rounded-lg bg-slate-800 py-3 text-sm font-semibold hover:bg-slate-700 disabled:opacity-60"
//           >
//             Cancel Update
//           </button>

//           <button
//             onClick={handleResend}
//             disabled={loading || timer > 0}
//             className="flex-1 rounded-lg bg-slate-800 py-3 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
//           >
//             {loading
//               ? "Sending..."
//               : timer > 0
//               ? `Resend in ${formatTime(timer)}`
//               : "Resend OTP"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileVerifyOtp;