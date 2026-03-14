import { Toaster } from "@/components/ui/sonner";
import { Storage } from "@/lib/storage";
import AdminError from "@/screens/AdminError";
import AdminPanel from "@/screens/AdminPanel";
import Dashboard from "@/screens/Dashboard";
import History from "@/screens/History";
import LockScreen from "@/screens/LockScreen";
import MyQR from "@/screens/MyQR";
import OnboardingFlow from "@/screens/OnboardingFlow";
import ProfileScreen from "@/screens/ProfileScreen";
import QRScanner from "@/screens/QRScanner";
import SendV from "@/screens/SendV";
import { useEffect, useState } from "react";

type Screen =
  | "onboarding"
  | "lock"
  | "dashboard"
  | "sendV"
  | "myQR"
  | "scanner"
  | "history"
  | "profile"
  | "adminError"
  | "adminPanel";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [scannedPhone, setScannedPhone] = useState<string | undefined>();
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const user = Storage.getUser();
    if (!user?.setupDone) {
      setScreen("onboarding");
    } else {
      setScreen("lock");
    }
  }, []);

  const handleOnboardingComplete = () => {
    setIsUnlocked(true);
    setScreen("dashboard");
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    setScreen("dashboard");
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setScreen("lock");
  };

  const navigate = (s: Screen) => setScreen(s);

  const handleQRScan = (phone: string) => {
    setScannedPhone(phone);
    setScreen("sendV");
  };

  return (
    <div className="vpay-app">
      {screen === "onboarding" && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
      {screen === "lock" && <LockScreen onUnlock={handleUnlock} />}
      {screen === "dashboard" && isUnlocked && (
        <Dashboard
          onNavigate={(s) => navigate(s as Screen)}
          onLogout={handleLogout}
        />
      )}
      {screen === "sendV" && (
        <SendV
          prefilledPhone={scannedPhone}
          onBack={() => {
            setScannedPhone(undefined);
            setScreen("dashboard");
          }}
        />
      )}
      {screen === "myQR" && <MyQR onBack={() => setScreen("dashboard")} />}
      {screen === "scanner" && (
        <QRScanner
          onScan={handleQRScan}
          onBack={() => setScreen("dashboard")}
        />
      )}
      {screen === "history" && (
        <History onBack={() => setScreen("dashboard")} />
      )}
      {screen === "profile" && (
        <ProfileScreen onBack={() => setScreen("dashboard")} />
      )}
      {screen === "adminError" && (
        <AdminError
          onAdminAccess={() => setScreen("adminPanel")}
          onBack={() => setScreen("dashboard")}
        />
      )}
      {screen === "adminPanel" && (
        <AdminPanel onLogout={() => setScreen("dashboard")} />
      )}
      <Toaster richColors position="top-center" />
    </div>
  );
}
