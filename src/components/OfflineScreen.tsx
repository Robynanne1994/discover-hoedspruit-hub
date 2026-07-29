import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Full-screen overlay shown when the device loses internet connectivity.
 * Helps meet Apple App Store guideline 4.2 (Minimum Functionality).
 */
const OfflineScreen = () => {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="No internet connection"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#E6E0CC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        textAlign: "center",
        fontFamily:
          '"Helvetica Neue", Helvetica, Arial, sans-serif',
        color: "#1A1A1A",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <WifiOff size={32} color="#715a3d" strokeWidth={1.75} />
      </div>
      <h1
        style={{
          fontFamily: "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          margin: 0,
          marginBottom: 10,
        }}
      >
        No Internet Connection
      </h1>
      <p
        style={{
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.5,
          color: "#2b2420",
          margin: 0,
          maxWidth: 320,
        }}
      >
        You're currently offline. Please check your connection — Hello
        Hoedspruit will reconnect automatically once you're back online.
      </p>
      <button
        type="button"
        onClick={() => {
          if (navigator.onLine) {
            setOnline(true);
          } else {
            // Trigger a reload attempt; if still offline, screen stays.
            window.location.reload();
          }
        }}
        style={{
          marginTop: 28,
          background: "#715a3d",
          color: "#ffffff",
          border: "none",
          borderRadius: 999,
          padding: "12px 28px",
          fontSize: 14,
          fontFamily: "inherit",
          fontWeight: 400,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
};

export default OfflineScreen;
