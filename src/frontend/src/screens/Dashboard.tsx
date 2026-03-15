import { Storage } from "@/lib/storage";
import {
  Bell,
  History,
  LogOut,
  MessageSquare,
  Phone,
  QrCode,
  ScanLine,
  SendHorizontal,
  Share2,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type Screen =
  | "dashboard"
  | "sendV"
  | "myQR"
  | "scanner"
  | "history"
  | "profile"
  | "adminError"
  | "adminPanel";

interface Props {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export default function Dashboard({ onNavigate, onLogout }: Props) {
  const user = Storage.getUser();
  const balance = user ? Storage.getUserBalance(user.phone) : 0;
  const [dotClicks, setDotClicks] = useState(0);
  const announcements = Storage.getAnnouncements();
  const latestAnn = announcements[0];

  const handleDotClick = () => {
    const next = dotClicks + 1;
    setDotClicks(next);
    if (next >= 9) {
      setDotClicks(0);
      onNavigate("adminError");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "V-PAY",
        text: `Send V to ${user?.name} at ${user?.phone}`,
        url: window.location.href,
      });
    } catch {
      toast.info("Link copied to clipboard");
      navigator.clipboard.writeText(`V-PAY: ${user?.name} | ${user?.phone}`);
    }
  };

  const actions = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      ocid: "dashboard.profile_button",
      onClick: () => onNavigate("profile"),
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      ocid: "dashboard.profile_button",
      onClick: () => toast.info("Messages coming soon"),
    },
    {
      id: "call",
      label: "Call",
      icon: Phone,
      ocid: "dashboard.profile_button",
      onClick: () => toast.info("Calls coming soon"),
    },
    {
      id: "myqr",
      label: "My QR",
      icon: QrCode,
      ocid: "dashboard.myqr_button",
      onClick: () => onNavigate("myQR"),
    },
    {
      id: "scan",
      label: "Scan & Pay",
      icon: ScanLine,
      ocid: "dashboard.scan_button",
      onClick: () => onNavigate("scanner"),
    },
    {
      id: "send",
      label: "Send V",
      icon: SendHorizontal,
      ocid: "dashboard.send_button",
      onClick: () => onNavigate("sendV"),
    },
    {
      id: "history",
      label: "History",
      icon: History,
      ocid: "dashboard.history_button",
      onClick: () => onNavigate("history"),
    },
    {
      id: "share",
      label: "Share",
      icon: Share2,
      ocid: "dashboard.share_button",
      onClick: handleShare,
    },
  ];

  return (
    <div className="vpay-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <h1 className="text-2xl font-display font-bold text-primary">V-PAY</h1>
        <div className="flex items-center gap-3">
          {latestAnn && (
            <button
              type="button"
              onClick={() => toast.info(latestAnn.message)}
              className="relative"
            >
              <Bell size={20} className="text-muted-foreground" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={20} />
          </button>
          {/* Invisible admin dot - not keyboard accessible by design */}
          <button
            type="button"
            tabIndex={-1}
            onClick={handleDotClick}
            onKeyDown={handleDotClick}
            className="w-5 h-5 opacity-0 cursor-default"
            aria-label="."
          />
        </div>
      </div>

      <div className="px-5 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="balance-display vpay-glow"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">
            Available Balance
          </p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-display font-bold text-primary">
              {balance.toLocaleString()}
            </span>
            <span className="text-2xl font-display font-semibold text-primary/70 pb-1">
              V
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{user?.phone}</p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                user?.storageChoice === "gdrive"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {user?.storageChoice === "gdrive"
                ? "☁ Google Drive"
                : "💾 Local Storage"}
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 px-5 mt-5"
      >
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {user?.photoBase64 ? (
            <img
              src={user.photoBase64}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-primary">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
      </motion.div>

      <div className="px-5 mt-6 grid grid-cols-4 gap-3">
        {actions.map((action, i) => (
          <motion.button
            key={action.id}
            type="button"
            data-ocid={action.ocid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="action-grid-btn"
            onClick={action.onClick}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <action.icon size={20} className="text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {latestAnn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-5 mt-5 p-3 rounded-xl bg-primary/10 border border-primary/20"
        >
          <p className="text-xs font-medium text-primary mb-0.5">
            System Announcement
          </p>
          <p className="text-xs text-foreground/80 line-clamp-2">
            {latestAnn.message}
          </p>
        </motion.div>
      )}

      <div className="mt-auto px-5 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
