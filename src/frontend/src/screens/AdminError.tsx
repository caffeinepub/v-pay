import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Storage } from "@/lib/storage";
import { ArrowLeft, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onAdminAccess: () => void;
  onBack: () => void;
}

const DEFAULT_ADMIN_PASSWORD = "admin123";
const QA_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_QA: { q: string; a: string }[] = [
  { q: "What is the first V transaction ID?", a: "TX001" },
  { q: "System founder name?", a: "VPAY" },
  { q: "Admin secret code word?", a: "GENESIS" },
  { q: "What is the base currency?", a: "V" },
  { q: "Server initialization year?", a: "2024" },
  { q: "Primary encryption key prefix?", a: "VPK" },
  { q: "Admin access tier?", a: "TIER1" },
  { q: "Emergency shutdown code?", a: "HALT99" },
  { q: "Verification phrase?", a: "VERIFIED" },
];

export default function AdminError({ onAdminAccess, onBack }: Props) {
  const [errorClicks, setErrorClicks] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [step, setStep] = useState<"password" | "qa">("password");
  const [password, setPassword] = useState("");
  const [qaStep, setQAStep] = useState(0);
  const [qaAnswer, setQAAnswer] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);

  const security = Storage.getSecurity();
  const adminPwd = security?.adminPassword || DEFAULT_ADMIN_PASSWORD;
  const secQA =
    security?.securityQA?.length === 9 ? security.securityQA : DEFAULT_QA;

  const handleErrorClick = () => {
    const next = errorClicks + 1;
    setErrorClicks(next);
    if (next >= 9) {
      setErrorClicks(0);
      setShowLoginModal(true);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === adminPwd) {
      setStep("qa");
      setPassword("");
    } else {
      setFailedAttempts((f) => f + 1);
      toast.error("Incorrect password");
      setPassword("");
    }
  };

  const handleQASubmit = () => {
    const expected = secQA[qaStep]?.a?.toLowerCase().trim();
    const entered = qaAnswer.toLowerCase().trim();
    if (entered === expected) {
      if (qaStep < 8) {
        setQAStep((q) => q + 1);
        setQAAnswer("");
      } else {
        setShowLoginModal(false);
        onAdminAccess();
      }
    } else {
      setFailedAttempts((f) => f + 1);
      toast.error(`Incorrect answer (attempt ${failedAttempts + 1})`);
      setQAAnswer("");
    }
  };

  return (
    <div className="vpay-screen bg-background flex flex-col">
      <button
        type="button"
        onClick={onBack}
        className="absolute top-5 left-5 text-muted-foreground hover:text-foreground z-10"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="flex-1 flex items-center justify-center">
        <motion.button
          type="button"
          onClick={handleErrorClick}
          className="text-center select-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.h1
            className="text-6xl font-display font-black text-destructive"
            animate={{
              textShadow: [
                "0 0 20px oklch(0.6 0.22 25 / 0.3)",
                "0 0 40px oklch(0.6 0.22 25 / 0.6)",
                "0 0 20px oklch(0.6 0.22 25 / 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            ERROR...
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-4 opacity-30">
            {errorClicks > 0
              ? `${9 - errorClicks} more clicks...`
              : "System error occurred"}
          </p>
        </motion.button>
      </div>

      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Shield size={20} className="text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold">
                    Admin Authentication
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {step === "password"
                      ? "Enter admin password"
                      : `Security question ${qaStep + 1} of 9`}
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === "password" ? (
                  <motion.div
                    key="pwd"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Label className="mb-2 block">Admin Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input mb-4"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handlePasswordSubmit()
                      }
                    />
                    <Button
                      type="button"
                      className="vpay-btn-primary w-full"
                      onClick={handlePasswordSubmit}
                    >
                      Verify Password
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="qa"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex gap-1 mb-4">
                      {QA_POSITIONS.map((pos) => (
                        <div
                          key={`qa-step-${pos}`}
                          className={`h-1 flex-1 rounded-full ${pos < qaStep ? "bg-primary" : pos === qaStep ? "bg-primary/60" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <Label className="mb-2 block text-sm">
                      {secQA[qaStep]?.q}
                    </Label>
                    <Input
                      placeholder="Your answer"
                      value={qaAnswer}
                      onChange={(e) => setQAAnswer(e.target.value)}
                      className="bg-input mb-4"
                      onKeyDown={(e) => e.key === "Enter" && handleQASubmit()}
                    />
                    <Button
                      type="button"
                      className="vpay-btn-primary w-full"
                      onClick={handleQASubmit}
                    >
                      {qaStep < 8 ? "Next Question" : "Access Admin Panel"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setStep("password");
                  setQAStep(0);
                }}
                className="text-center text-xs text-muted-foreground mt-4 w-full hover:text-foreground"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
