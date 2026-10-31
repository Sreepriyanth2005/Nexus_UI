import { useState, useEffect } from "react";
import { AppRoutes } from "../routes/index";
import { WifiOff } from "lucide-react";
import { JSX } from "react/jsx-runtime";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { useSessionRevocation } from "../hooks/useSessionRevocation";

export const App = (): JSX.Element => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useRealtimeSync();
  useSessionRevocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
            <WifiOff size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">No Internet Connection</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Please check your network settings and make sure you are connected to the internet. We'll automatically reconnect you when you're back online.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppRoutes />
  );
};
