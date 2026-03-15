import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Storage } from "@/lib/storage";
import {
  ArrowLeft,
  CheckCircle,
  DatabaseBackup,
  Edit2,
  ExternalLink,
  LogOut,
  Plus,
  Save,
  Shield,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const PATTERN_SIZE = 3;
const PATTERN_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

function ChangeSecurityDialog() {
  const [open, setOpen] = useState(false);
  const [secType, setSecType] = useState<"pin" | "pattern">("pin");

  // PIN state
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Pattern state
  const [newPattern, setNewPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPhase, setDrawingPhase] = useState<"first" | "confirm">(
    "first",
  );
  const [firstPattern, setFirstPattern] = useState<number[]>([]);
  const [patternError, setPatternError] = useState("");
  const [patternDone, setPatternDone] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const resetState = () => {
    setSecType("pin");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setNewPattern([]);
    setFirstPattern([]);
    setDrawingPhase("first");
    setPatternError("");
    setPatternDone(false);
    setIsDrawing(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    setOpen(v);
  };

  const handleSecTypeChange = (v: string) => {
    setSecType(v as "pin" | "pattern");
    setPinError("");
    setNewPin("");
    setConfirmPin("");
    setNewPattern([]);
    setFirstPattern([]);
    setDrawingPhase("first");
    setPatternError("");
    setPatternDone(false);
  };

  const handleSavePin = () => {
    if (newPin.length !== 6) {
      setPinError("PIN must be exactly 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match. Please try again.");
      return;
    }
    const existing = Storage.getSecurity();
    Storage.setSecurity({
      ...(existing ?? {
        type: "pin",
        pin: "",
        pattern: [],
        adminPassword: "admin123",
        securityQA: [],
        biometricEnabled: false,
      }),
      type: "pin",
      pin: newPin,
    });
    toast.success("PIN updated successfully!");
    handleOpenChange(false);
  };

  const getDotIndex = (clientX: number, clientY: number): number => {
    const grid = gridRef.current;
    if (!grid) return -1;
    const rect = grid.getBoundingClientRect();
    const cellW = rect.width / PATTERN_SIZE;
    const cellH = rect.height / PATTERN_SIZE;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);
    if (col < 0 || col >= PATTERN_SIZE || row < 0 || row >= PATTERN_SIZE)
      return -1;
    return row * PATTERN_SIZE + col;
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
      const existing = Storage.getSecurity();
      Storage.setSecurity({
        ...(existing ?? {
          type: "pattern",
          pin: "",
          pattern: [],
          adminPassword: "admin123",
          securityQA: [],
          biometricEnabled: false,
        }),
        type: "pattern",
        pattern: newPattern,
      });
      setPatternDone(true);
      toast.success("Pattern updated successfully!");
      setTimeout(() => handleOpenChange(false), 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full border-primary/30 text-foreground hover:bg-primary/10 transition-colors"
          data-ocid="profile.change_security.open_modal_button"
        >
          <Shield size={16} className="mr-2 text-primary" /> Change Security
        </Button>
      </DialogTrigger>

      <DialogContent
        data-ocid="profile.change_security.dialog"
        className="bg-card border-border max-w-sm mx-auto rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-display">
            <Shield size={18} /> Change Security Method
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Switch between PIN and Pattern lock, or update your current
            credential.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Security Type
          </Label>
          <RadioGroup
            value={secType}
            onValueChange={handleSecTypeChange}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="pin"
                id="sec-pin"
                data-ocid="profile.change_security.pin.radio"
              />
              <Label htmlFor="sec-pin" className="text-sm cursor-pointer">
                PIN
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="pattern"
                id="sec-pattern"
                data-ocid="profile.change_security.pattern.radio"
              />
              <Label htmlFor="sec-pattern" className="text-sm cursor-pointer">
                Pattern
              </Label>
            </div>
          </RadioGroup>
        </div>

        <AnimatePresence mode="wait">
          {secType === "pin" ? (
            <motion.div
              key="pin-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  New PIN (6 digits)
                </Label>
                <Input
                  data-ocid="profile.change_security.pin.input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  className="tracking-widest text-center h-10"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Confirm New PIN
                </Label>
                <Input
                  data-ocid="profile.change_security.pin.confirm.input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  className="tracking-widest text-center h-10"
                />
              </div>
              {pinError && (
                <p className="text-destructive text-xs">{pinError}</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pattern-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              {patternDone ? (
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm font-medium text-primary text-center py-4"
                >
                  ✓ Pattern saved!
                </motion.p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground text-center">
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
                        key={`csdot-${pos}`}
                        className={`pattern-dot ${
                          newPattern.includes(pos) ? "selected" : ""
                        }`}
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
                    <p className="text-destructive text-xs text-center">
                      {patternError}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
            data-ocid="profile.change_security.cancel_button"
          >
            Cancel
          </Button>
          {secType === "pin" && (
            <Button
              type="button"
              className="flex-1 vpay-btn-primary"
              onClick={handleSavePin}
              data-ocid="profile.change_security.save_button"
            >
              Save PIN
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocalBackupSection() {
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(
    Storage.getLocalBackupTime(),
  );
  const [justSaved, setJustSaved] = useState(false);

  const formatTime = (ts: number | null) => {
    if (!ts) return "Auto-save pending";
    return new Date(ts).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleManualBackup = () => {
    Storage.saveLocalBackup();
    const now = Storage.getLocalBackupTime();
    setLastBackupTime(now);
    setJustSaved(true);
    toast.success("Backup saved to device storage!");
    setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DatabaseBackup size={18} className="text-primary" />
          <p className="text-sm font-semibold">Local Backup</p>
        </div>
        <Badge
          variant="outline"
          className="text-xs border-primary/30 text-primary"
        >
          Auto-Save ON
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Your V balance, transactions, and account data are automatically saved
        to this device's storage on every change. Tap Backup Now to save a
        manual snapshot anytime.
      </p>

      <div className="flex items-center gap-2 text-xs">
        <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
        <span className="text-muted-foreground">
          Last saved:{" "}
          <span className="text-foreground font-medium">
            {formatTime(lastBackupTime)}
          </span>
        </span>
      </div>

      <Button
        data-ocid="profile.local_backup.button"
        type="button"
        size="sm"
        className="vpay-btn-primary w-full"
        onClick={handleManualBackup}
      >
        {justSaved ? (
          <span className="flex items-center gap-2">
            <CheckCircle size={14} /> Saved!
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <DatabaseBackup size={14} /> Backup Now
          </span>
        )}
      </Button>
    </div>
  );
}

export default function ProfileScreen({ onBack, onLogout }: Props) {
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(Storage.getUser()!);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [links, setLinks] = useState<string[]>(
    user.links?.length ? user.links : [""],
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const updated = { ...user, name, bio, links: links.filter(Boolean) };
    Storage.setUser(updated);
    Storage.addOrUpdateUser(updated);
    setUser(updated);
    setEditing(false);
    toast.success("Profile updated!");
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...user, photoBase64: ev.target?.result as string };
      Storage.setUser(updated);
      Storage.addOrUpdateUser(updated);
      setUser(updated);
    };
    reader.readAsDataURL(file);
  };

  const balance = Storage.getUserBalance(user.phone);

  return (
    <div className="vpay-screen bg-background flex flex-col px-5 pt-6">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <button
          type="button"
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className="flex items-center gap-2 text-primary text-sm font-medium"
        >
          {editing ? (
            <>
              <Save size={16} /> Save
            </>
          ) : (
            <>
              <Edit2 size={16} /> Edit
            </>
          )}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col"
      >
        <div className="flex items-center gap-5 mb-6">
          <button
            type="button"
            className="w-20 h-20 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-primary/30 cursor-pointer"
            onClick={() => editing && fileRef.current?.click()}
            aria-label="Change profile photo"
          >
            {user.photoBase64 ? (
              <img
                src={user.photoBase64}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
          </button>
          <div>
            {editing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input font-bold text-xl h-9 mb-1"
              />
            ) : (
              <h3 className="text-xl font-display font-bold">{user.name}</h3>
            )}
            <p className="text-muted-foreground text-sm font-mono">
              {user.phone}
            </p>
            <Badge
              variant="outline"
              className="mt-1 text-xs border-primary/30 text-primary"
            >
              💾 Local Storage
            </Badge>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhoto}
        />

        <div className="balance-display mb-5">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Balance
          </p>
          <span className="text-3xl font-display font-bold text-primary">
            {balance} V
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
              Email
            </Label>
            <p className="text-sm">{user.email}</p>
          </div>
          {user.birthdate && (
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
                Date of Birth
              </Label>
              <p className="text-sm">
                {new Date(user.birthdate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
              Bio
            </Label>
            {editing ? (
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-input resize-none"
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {user.bio || "No bio yet"}
              </p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
              Links
            </Label>
            {editing ? (
              <div>
                {links.map((l, i) => (
                  <div
                    key={`edit-link-${l.slice(0, 6)}-${i}`}
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
                        onClick={() =>
                          setLinks(links.filter((_, j) => j !== i))
                        }
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
            ) : (
              <div className="flex flex-col gap-1">
                {user.links?.length ? (
                  user.links.map((l, i) => (
                    <a
                      key={`view-link-${l.slice(0, 8)}-${i}`}
                      href={l}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-sm flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={12} /> {l}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No links added
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {editing && (
          <Button
            type="button"
            className="vpay-btn-primary mt-6 w-full"
            onClick={handleSave}
          >
            <Save size={16} className="mr-2" /> Save Profile
          </Button>
        )}

        {/* Local Backup */}
        <div className="mt-6">
          <LocalBackupSection />
        </div>

        {/* Change Security */}
        <div className="mt-4 mb-3">
          <ChangeSecurityDialog />
        </div>

        {/* Log Out */}
        <div className="mb-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                data-ocid="profile.delete_button"
              >
                <LogOut size={16} className="mr-2" /> Log Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="profile.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out of V-PAY?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out? You will need to enter your
                  PIN to access your account again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="profile.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onLogout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="profile.confirm_button"
                >
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </div>
  );
}
