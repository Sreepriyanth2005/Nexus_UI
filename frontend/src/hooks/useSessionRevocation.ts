import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../core/integrations/firebase";

export const useSessionRevocation = () => {
  // In static wireframe mode, bypass Firestore session revocation check
  return;
  useEffect(() => {
    // We assume the sessionId is stored in localStorage. 
    // You may need to adjust this depending on how you store your current session ID.
    const currentSessionId = localStorage.getItem("session_id");

    if (!currentSessionId) {
      return; // Not logged in or no session tracking
    }

    const sessionRef = doc(db, "user_sessions", currentSessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const sessionData = docSnapshot.data();

          if (sessionData.status === "revoked") {
            console.warn("Session was revoked by another device. Logging out...");

            // 1. Stop listening to Firestore
            unsubscribe();

            // 2. Clear Local Storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("keycloak_session_auth");
            localStorage.removeItem("session_id");
            localStorage.removeItem("user_data");

            // 3. Optional: Show an alert so the user knows WHY they were logged out
            alert("You have been logged out because you signed in from another device.");

            // 4. Redirect to login
            window.location.href = "/";
          }
        } else {
          // Document deleted
          unsubscribe();
          localStorage.removeItem("accessToken");
          localStorage.removeItem("keycloak_session_auth");
          localStorage.removeItem("session_id");
          window.location.href = "/";
        }
      },
      (error) => {
        console.warn("[useSessionRevocation] Firestore listener error:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);
};

