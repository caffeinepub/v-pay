import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Storage } from "@/lib/storage";
import { Check, Delete, Fingerprint, KeyRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  onUnlock: () => void;
}

const PATTERN_SIZE = 3;
const PIN_POSITIONS = [0, 1, 2, 3, 4, 5];
const NUMPAD_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "",
  "0",
  "del",
];
const PATTERN_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

type RecoveryStep = "identity" | "set-pin" | "set-pattern" | "done";

function RecoveryModal({
  open,
  onClose,
  onRecovered,
}: {
  open: boolean;
  onClose: () => void;
  onRecovered: () => void;
}) {
  const security = Storage.getSecurity();

  const [step, setStep] = useState<RecoveryStep>("identity");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [passkey, setPasskey] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPattern, setNewPattern] = useState<number[]>([]);
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPhase, setDrawingPhase] = useState<"first" | "confirm">(
    "first",
  );
  const [firstPattern, setFirstPattern] = useState<number[]>([]);
  const [patternError, setPatternError] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setStep("identity");
    setPhone("");
    setEmail("");
    setBirthdate("");
    setPasskey("");
    setIdentityError("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setNewPattern([]);
    setFirstPattern([]);
    setDrawingPhase("first");
    setPatternError("");
    onClose();
  };

  const verifyIdentity = () => {
    const user = Storage.getUser();
    if (!user) {
      setIdentityError("No user profile found. Please contact support.");
      return;
    }
    const phoneMatch = phone.trim() === user.phone;
    const emailMatch =
      email.trim().toLowerCase() === (user.email ?? "").toLowerCase();
    const dobMatch = birthdate === user.birthdate;
    const passkeyMatch =
      !security?.recoveryPasskey || passkey === security.recoveryPasskey;
    if (phoneMatch && emailMatch && dobMatch && passkeyMatch) {
      setIdentityError("");
      if (security?.type === "pattern") {
        setStep("set-pattern");
      } else {
        setStep("set-pin");
      }
    } else {
      setIdentityError("Details do not match. Please check and try again.");
    }
  };

  const submitNewPin = () => {
    if (newPin.length !== 6) {
      setPinError("PIN must be 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match.");
      return;
    }
    const updated = { ...(security ?? { type: "pin" as const }), pin: newPin };
    Storage.setSecurity(updated as Parameters<typeof Storage.setSecurity>[0]);
    setStep("done");
  };

  const getDotIndex = (clientX: number, clientY: number): number => {
    const grid = gridRef.current;
    if (!grid) return -1;
    const rect = grid.getBoundingClientRect();
    const cols = PATTERN_SIZE;
    const cellW = rect.width / cols;
    const cellH = rect.height / cols;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);
    if (col < 0 || col >= cols || row < 0 || row >= cols) return -1;
    return row * cols + col;
  };

  const addDot = (idx: number) => {
    if (idx < 0) return;
    setNewPattern((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setPatternError("");
    const point = "touches" in e ? e.touches[0] : e;
    addDot(getDotIndex(point.clientX, point.clientY));
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = "touches" in e ? e.touches[0] : e;
    addDot(getDotIndex(point.clientX, point.clientY));
  };

  const endDraw = () => {
    setIsDrawing(false);
    if (newPattern.length < 3) {
      setPatternError("Pattern too short — connect at least 3 dots.");
      setNewPattern([]);
      return;
    }
    if (drawingPhase === "first") {
      setFirstPattern([...newPattern]);
      setNewPattern([]);
      setDrawingPhase("confirm");
    } else {
      if (JSON.stringify(firstPattern) !== JSON.stringify(newPattern)) {
        setPatternError("Patterns don't match. Try again.");
        setNewPattern([]);
        setFirstPattern([]);
        setDrawingPhase("first");
        return;
      }
      const updated = {
        ...(security ?? { type: "pattern" as const }),
        pattern: newPattern,
      };
      Storage.setSecurity(updated as Parameters<typeof Storage.setSecurity>[0]);
      setStep("done");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="recovery.dialog"
        className="bg-card border-border max-w-sm mx-auto rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-display">
            <KeyRound size={18} />
            Account Recovery
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {step === "identity" &&
              "Verify your identity to reset your credentials."}
            {step === "set-pin" && "Set your new 6-digit PIN."}
            {step === "set-pattern" &&
              `${drawingPhase === "first" ? "Draw your new pattern" : "Confirm your pattern by drawing it again"}.`}
            {step === "done" &&
              "Your credentials have been reset successfully."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "identity" && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Phone Number
                </Label>
                <Input
                  data-ocid="recovery.phone.input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  data-ocid="recovery.email.input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Date of Birth
                </Label>
                <Input
                  data-ocid="recovery.dob.input"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  6-Digit Recovery Passkey
                </Label>
                <Input
                  data-ocid="recovery.passkey.input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={passkey}
                  onChange={(e) =>
                    setPasskey(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  className="h-9 text-sm text-center tracking-widest"
                />
              </div>
              {identityError && (
                <p
                  data-ocid="recovery.identity.error_state"
                  className="text-destructive text-xs mt-1"
                >
                  {identityError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  data-ocid="recovery.identity.cancel_button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="recovery.identity.confirm_button"
                  className="flex-1"
                  onClick={verifyIdentity}
                >
                  Verify Identity
                </Button>
              </div>
            </motion.div>
          )}

          {step === "set-pin" && (
            <motion.div
              key="set-pin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  New PIN (6 digits)
                </Label>
                <Input
                  data-ocid="recovery.pin.input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="tracking-widest text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Confirm PIN
                </Label>
                <Input
                  data-ocid="recovery.pin.confirm.input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="••••••"
                  className="tracking-widest text-center"
                />
              </div>
              {pinError && (
                <p
                  data-ocid="recovery.pin.error_state"
                  className="text-destructive text-xs"
                >
                  {pinError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  data-ocid="recovery.pin.cancel_button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="recovery.pin.save_button"
                  className="flex-1"
                  onClick={submitNewPin}
                >
                  Set PIN
                </Button>
              </div>
            </motion.div>
          )}

          {step === "set-pattern" && (
            <motion.div
              key="set-pattern"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-xs text-muted-foreground">
                {drawingPhase === "first"
                  ? "Draw a new pattern (min 3 dots)"
                  : "Draw it again to confirm"}
              </p>
              <div
                ref={gridRef}
                className="grid grid-cols-3 gap-8 p-4 select-none touch-none"
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={() => {
                  if (isDrawing) endDraw();
                }}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
              >
                {PATTERN_POSITIONS.map((pos) => (
                  <div
                    key={`rdot-${pos}`}
                    className={`pattern-dot ${newPattern.includes(pos) ? "selected" : ""}`}
                  >
                    {newPattern.includes(pos) && (
                      <span className="text-xs font-bold text-primary-foreground">
                        {newPattern.indexOf(pos) + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {patternError && (
                <p
                  data-ocid="recovery.pattern.error_state"
                  className="text-destructive text-xs text-center"
                >
                  {patternError}
                </p>
              )}
              <Button
                data-ocid="recovery.pattern.cancel_button"
                variant="outline"
                className="w-full"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center"
              >
                <KeyRound size={26} className="text-primary" />
              </motion.div>
              <p
                data-ocid="recovery.success_state"
                className="text-center text-sm font-medium text-foreground"
              >
                Credentials reset! You can now log in.
              </p>
              <Button
                data-ocid="recovery.done_button"
                className="w-full"
                onClick={() => {
                  handleClose();
                  onRecovered();
                }}
              >
                Continue to Login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default function LockScreen({ onUnlock }: Props) {
  const security = Storage.getSecurity();
  const [mode, setMode] = useState<"pin" | "pattern">(security?.type ?? "pin");
  const [pin, setPin] = useState("");
  const [pattern, setPattern] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const checkPin = useCallback(
    (val: string) => {
      const sec = Storage.getSecurity();
      if (sec?.pin === val) {
        onUnlock();
      } else {
        setError("Incorrect PIN");
        setPin("");
        setTimeout(() => setError(""), 2000);
      }
    },
    [onUnlock],
  );

  const pressNum = (n: string) => {
    if (n === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = pin + n;
    setPin(next);
    if (next.length === 6) checkPin(next);
  };

  const getDotIndex = (clientX: number, clientY: number): number => {
    const grid = gridRef.current;
    if (!grid) return -1;
    const rect = grid.getBoundingClientRect();
    const cols = PATTERN_SIZE;
    const cellW = rect.width / cols;
    const cellH = rect.height / cols;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);
    if (col < 0 || col >= cols || row < 0 || row >= cols) return -1;
    return row * cols + col;
  };

  const addDot = useCallback((idx: number) => {
    if (idx < 0) return;
    setPattern((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  }, []);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setError("");
    const point = "touches" in e ? e.touches[0] : e;
    addDot(getDotIndex(point.clientX, point.clientY));
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = "touches" in e ? e.touches[0] : e;
    addDot(getDotIndex(point.clientX, point.clientY));
  };

  const endDraw = () => {
    setIsDrawing(false);
    if (pattern.length < 3) {
      setError("Pattern too short");
      setPattern([]);
      setTimeout(() => setError(""), 2000);
      return;
    }
    const sec = Storage.getSecurity();
    if (
      sec?.pattern &&
      JSON.stringify(sec.pattern) === JSON.stringify(pattern)
    ) {
      onUnlock();
    } else {
      setError("Incorrect pattern");
      setTimeout(() => {
        setError("");
        setPattern([]);
      }, 1500);
    }
  };

  const user = Storage.getUser();

  return (
    <div className="vpay-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl font-display font-bold text-primary tracking-tight">
          V-PAY
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.name ? `Welcome back, ${user.name}` : "Secure Digital Wallet"}
        </p>
      </motion.div>

      <div className="flex gap-2 mb-8 bg-muted/50 p-1 rounded-xl">
        <button
          type="button"
          data-ocid="lock.pin.tab"
          onClick={() => {
            setMode("pin");
            setPin("");
            setError("");
          }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === "pin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          PIN
        </button>
        <button
          type="button"
          data-ocid="lock.pattern.tab"
          onClick={() => {
            setMode("pattern");
            setPattern([]);
            setError("");
          }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === "pattern" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Pattern
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "pin" ? (
          <motion.div
            key="pin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
          >
            <div className="flex gap-4 mb-8">
              {PIN_POSITIONS.map((pos) => (
                <div
                  key={`pin-${pos}`}
                  data-ocid="lock.pin_input"
                  className={`pin-dot ${pos < pin.length ? "filled" : "empty"}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {NUMPAD_KEYS.map((n, i) => (
                <button
                  key={n || `empty-${i}`}
                  type="button"
                  className={`numpad-btn ${n === "" ? "opacity-0 pointer-events-none" : ""}`}
                  onClick={() => n && pressNum(n)}
                >
                  {n === "del" ? <Delete size={20} /> : <span>{n}</span>}
                </button>
              ))}
            </div>
            <button
              type="button"
              data-ocid="lock.forgot_pin.button"
              onClick={() => setRecoveryOpen(true)}
              className="mt-5 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Forgot PIN?
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="pattern"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
          >
            <p className="text-muted-foreground text-sm mb-6">
              Draw your pattern
            </p>
            <div
              ref={gridRef}
              className="grid grid-cols-3 gap-8 p-4 select-none touch-none"
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={() => {
                if (isDrawing) endDraw();
              }}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            >
              {PATTERN_POSITIONS.map((pos) => (
                <div
                  key={`dot-${pos}`}
                  className={`pattern-dot ${pattern.includes(pos) ? "selected" : ""}`}
                >
                  {pattern.includes(pos) && (
                    <span className="text-xs font-bold text-primary-foreground">
                      {pattern.indexOf(pos) + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              data-ocid="lock.forgot_pattern.button"
              onClick={() => setRecoveryOpen(true)}
              className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Forgot Pattern?
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-destructive text-sm font-medium"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="mt-8 flex flex-col items-center gap-2 opacity-60 hover:opacity-90 transition-opacity"
      >
        <Fingerprint size={36} className="text-primary" />
        <span className="text-xs text-muted-foreground">
          Biometric (optional)
        </span>
      </button>

      <RecoveryModal
        open={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        onRecovered={() => {
          setRecoveryOpen(false);
          setPin("");
          setPattern([]);
          setError("");
        }}
      />
    </div>
  );
}
