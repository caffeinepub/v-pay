import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Storage, type VPaySecurity, type VPayUser } from "@/lib/storage";
import {
  Check,
  ChevronRight,
  HardDrive,
  Plus,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  onComplete: () => void;
}

const STEP_POSITIONS = [0, 1, 2, 3, 4];
const PATTERN_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const RECOVERY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was your first pet's name?",
  "What city were you born in?",
];

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [storageChoice, setStorageChoice] = useState<"local" | "gdrive">(
    "local",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [photoBase64, setPhotoBase64] = useState("");
  const [secType, setSecType] = useState<"pin" | "pattern">("pin");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pattern, setPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [securityAnswers, setSecurityAnswers] = useState<string[]>([
    "",
    "",
    "",
  ]);
  const gridRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getDotIndex = (clientX: number, clientY: number): number => {
    const grid = gridRef.current;
    if (!grid) return -1;
    const rect = grid.getBoundingClientRect();
    const cols = 3;
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
    setPattern((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const point = "touches" in e ? e.touches[0] : e;
    addDot(getDotIndex(point.clientX, point.clientY));
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = "touches" in e ? e.touches[0] : e;
    addDot(getDotIndex(point.clientX, point.clientY));
  };

  const handleComplete = () => {
    if (!name || !phone) {
      toast.error("Name and phone are required");
      return;
    }
    if (secType === "pin" && pin.length !== 6) {
      toast.error("PIN must be 6 digits");
      return;
    }
    if (secType === "pin" && pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    if (secType === "pattern" && pattern.length < 4) {
      toast.error("Pattern too short (min 4 points)");
      return;
    }
    if (securityAnswers.some((a) => !a.trim())) {
      toast.error("Please answer all recovery questions");
      return;
    }

    const user: VPayUser = {
      email,
      name,
      phone,
      birthdate,
      bio,
      links: links.filter(Boolean),
      photoBase64,
      setupDone: true,
      storageChoice,
    };
    const sec: VPaySecurity = {
      type: secType,
      pin,
      pattern,
      adminPassword: "",
      securityQA: [
        { q: RECOVERY_QUESTIONS[0], a: securityAnswers[0].trim() },
        { q: RECOVERY_QUESTIONS[1], a: securityAnswers[1].trim() },
        { q: RECOVERY_QUESTIONS[2], a: securityAnswers[2].trim() },
      ],
      biometricEnabled: false,
    };
    Storage.setUser(user);
    Storage.setSecurity(sec);
    Storage.addOrUpdateUser(user);
    const bal = Storage.getBalance();
    if (!bal[phone]) {
      bal[phone] = 0;
      Storage.setBalance(bal);
    }
    setStep(5);
    setTimeout(onComplete, 1500);
  };

  return (
    <div className="vpay-screen bg-background flex flex-col px-6 py-8">
      <div className="flex gap-1 mb-8">
        {STEP_POSITIONS.map((pos) => (
          <div
            key={`step-${pos}`}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${pos < step ? "bg-primary" : pos === step ? "bg-primary/60" : "bg-muted"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col flex-1"
          >
            <h2 className="text-3xl font-display font-bold mb-2">
              Welcome to <span className="text-primary">V-PAY</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Digital currency for the future. Let&apos;s get you started.
            </p>
            <Label className="mb-2">Email Address</Label>
            <Input
              data-ocid="onboarding.email_input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border text-lg h-12"
            />
            <Button
              data-ocid="onboarding.next_button"
              type="button"
              className="vpay-btn-primary mt-6 w-full"
              onClick={() => {
                if (!email.includes("@")) {
                  toast.error("Enter a valid email");
                  return;
                }
                setStep(1);
              }}
            >
              Continue <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="gdrive"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col flex-1 items-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <HardDrive size={40} className="text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2 text-center">
              Backup with Google Drive
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-8 leading-relaxed">
              Store your account balance and data securely on Google Drive for
              automatic backup and recovery across devices.
            </p>
            <div className="w-full flex flex-col gap-3">
              <Button
                data-ocid="gdrive.allow_button"
                type="button"
                className="vpay-btn-primary w-full"
                onClick={() => {
                  setStorageChoice("gdrive");
                  setStep(2);
                }}
              >
                <Check size={16} className="mr-2" /> Allow Google Drive Access
              </Button>
              <Button
                data-ocid="gdrive.skip_button"
                type="button"
                variant="outline"
                className="w-full border-border"
                onClick={() => {
                  setStorageChoice("local");
                  setStep(2);
                }}
              >
                Skip for now — Use Local Storage
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col gap-4"
          >
            <h2 className="text-2xl font-display font-bold mb-1">
              Set Up Profile
            </h2>
            <p className="text-muted-foreground text-sm mb-2">
              Your phone number is your V account ID.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="w-20 h-20 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-border hover:border-primary transition-colors"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                aria-label="Upload profile photo"
              >
                {photoBase64 ? (
                  <img
                    src={photoBase64}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload size={24} className="text-muted-foreground" />
                )}
              </button>
              <div>
                <p className="text-sm font-medium">Profile Photo</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-primary text-xs"
                >
                  Upload photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Full Name *</Label>
              <Input
                data-ocid="profile_setup.name_input"
                placeholder="Aryan Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input"
              />
            </div>
            <div>
              <Label className="mb-1 block">Phone Number * (your V-ID)</Label>
              <Input
                data-ocid="profile_setup.phone_input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-input"
                type="tel"
              />
            </div>
            <div>
              <Label className="mb-1 block">Date of Birth</Label>
              <Input
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="bg-input"
                type="date"
              />
            </div>
            <div>
              <Label className="mb-1 block">Bio</Label>
              <Textarea
                placeholder="Tell people about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-input resize-none"
                rows={2}
              />
            </div>
            <div>
              <Label className="mb-1 block">Links</Label>
              {links.map((l, i) => (
                <div
                  key={`link-input-${l.slice(0, 8)}-${i}`}
                  className="flex gap-2 mb-2"
                >
                  <Input
                    placeholder="https://..."
                    value={l}
                    onChange={(e) => {
                      const nl = [...links];
                      nl[i] = e.target.value;
                      setLinks(nl);
                    }}
                    className="bg-input"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLinks(links.filter((_, j) => j !== i))}
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinks([...links, ""])}
                className="text-primary text-xs flex items-center gap-1"
              >
                <Plus size={12} /> Add link
              </button>
            </div>
            <Button
              data-ocid="profile_setup.submit_button"
              type="button"
              className="vpay-btn-primary mt-2 w-full"
              onClick={() => {
                if (!name || !phone) {
                  toast.error("Name and phone required");
                  return;
                }
                setStep(3);
              }}
            >
              Next — Set Security <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield size={28} className="text-primary" />
              <div>
                <h2 className="text-2xl font-display font-bold">
                  Security Setup
                </h2>
                <p className="text-muted-foreground text-sm">
                  Choose how to lock your app
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSecType("pin")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${secType === "pin" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
              >
                PIN (6 digit)
              </button>
              <button
                type="button"
                onClick={() => setSecType("pattern")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${secType === "pattern" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
              >
                Pattern
              </button>
            </div>
            {secType === "pin" ? (
              <div className="flex flex-col gap-3">
                <div>
                  <Label className="mb-1 block">Set 6-digit PIN</Label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="bg-input text-center text-2xl tracking-widest"
                  />
                </div>
                <div>
                  <Label className="mb-1 block">Confirm PIN</Label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    className="bg-input text-center text-2xl tracking-widest"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Draw a pattern (min 4 points)
                </p>
                <div
                  ref={gridRef}
                  className="grid grid-cols-3 gap-6 p-4 select-none touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  onTouchStart={startDraw}
                  onTouchMove={moveDraw}
                  onTouchEnd={() => setIsDrawing(false)}
                >
                  {PATTERN_POSITIONS.map((pos) => (
                    <div
                      key={`setup-dot-${pos}`}
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
                {pattern.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPattern([])}
                    className="text-xs text-muted-foreground mt-2"
                  >
                    Reset pattern
                  </button>
                )}
              </div>
            )}
            <Button
              type="button"
              className="vpay-btn-primary w-full mt-2"
              onClick={() => {
                if (secType === "pin" && pin.length !== 6) {
                  toast.error("PIN must be 6 digits");
                  return;
                }
                if (secType === "pin" && pin !== confirmPin) {
                  toast.error("PINs do not match");
                  return;
                }
                if (secType === "pattern" && pattern.length < 4) {
                  toast.error("Pattern too short (min 4 points)");
                  return;
                }
                setStep(4);
              }}
            >
              Next — Recovery Setup <ChevronRight size={16} className="ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="recovery-setup"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield size={28} className="text-primary" />
              <div>
                <h2 className="text-2xl font-display font-bold">
                  Recovery Setup
                </h2>
                <p className="text-muted-foreground text-sm">
                  Answer these if you ever forget your PIN or pattern
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {RECOVERY_QUESTIONS.map((question, i) => (
                <div key={question} className="flex flex-col gap-1.5">
                  <Label className="text-sm leading-snug">
                    {i + 1}. {question}
                  </Label>
                  <Input
                    data-ocid={
                      `recovery_setup.answer_input.${i + 1}` as `recovery_setup.answer_input.${1 | 2 | 3}`
                    }
                    placeholder="Your answer"
                    value={securityAnswers[i]}
                    onChange={(e) => {
                      const next = [...securityAnswers];
                      next[i] = e.target.value;
                      setSecurityAnswers(next);
                    }}
                    className="bg-input"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Answers are case-insensitive. Keep these safe — they are your only
              way to recover your account.
            </p>
            <Button
              data-ocid="recovery_setup.submit_button"
              type="button"
              className="vpay-btn-primary w-full mt-2"
              onClick={handleComplete}
            >
              Complete Setup <Check size={16} className="ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="done"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col flex-1 items-center justify-center"
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Check size={48} className="text-success" />
            </motion.div>
            <h2 className="text-3xl font-display font-bold text-center">
              All Set!
            </h2>
            <p className="text-muted-foreground mt-2 text-center">
              Welcome to V-PAY, {name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
