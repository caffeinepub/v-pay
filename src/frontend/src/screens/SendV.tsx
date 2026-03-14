import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Storage } from "@/lib/storage";
import { ArrowLeft, CheckCircle2, Search, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  prefilledPhone?: string;
  onBack: () => void;
}

export default function SendV({ prefilledPhone, onBack }: Props) {
  const [searchPhone, setSearchPhone] = useState(prefilledPhone ?? "");
  const [foundUser, setFoundUser] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"search" | "confirm" | "success">(
    prefilledPhone ? "confirm" : "search",
  );
  const [loading, setLoading] = useState(false);

  const currentUser = Storage.getUser();

  const handleSearch = () => {
    if (!searchPhone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    const user = Storage.findUserByPhone(searchPhone.trim());
    if (user) {
      setFoundUser({ name: user.name, phone: user.phone });
      setStep("confirm");
    } else {
      toast.error("User not found. They may not be registered on V-PAY.");
    }
  };

  const handleConfirm = async () => {
    const amt = Number.parseInt(amount, 10);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!currentUser) return;
    const senderBalance = Storage.getUserBalance(currentUser.phone);
    if (senderBalance < amt) {
      toast.error(`Insufficient balance. You have ${senderBalance} V.`);
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    Storage.adjustBalance(currentUser.phone, -amt);
    if (foundUser) Storage.adjustBalance(foundUser.phone, amt);
    const ts = Date.now();
    Storage.addTransaction({
      id: `tx_${ts}`,
      senderPhone: currentUser.phone,
      receiverPhone: foundUser?.phone ?? searchPhone,
      amount: amt,
      timestamp: ts,
      note: "",
      type: "sent",
    });
    setLoading(false);
    setStep("success");
  };

  if (step === "success") {
    const currentBalance = currentUser
      ? Storage.getUserBalance(currentUser.phone)
      : 0;
    return (
      <div className="vpay-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            <CheckCircle2 size={48} className="text-success" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold text-success mb-2">
            Sent! ✓
          </h2>
          <p className="text-muted-foreground mb-1">
            Receiver balance increased
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            Transaction complete
          </p>
          <div className="vpay-card p-5 w-full mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Amount sent</span>
              <span className="font-bold text-destructive">
                -{Number.parseInt(amount)} V
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium">
                {foundUser?.name ?? searchPhone}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your balance</span>
              <span className="font-bold text-primary">{currentBalance} V</span>
            </div>
          </div>
          <Button
            type="button"
            className="vpay-btn-primary w-full"
            onClick={onBack}
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="vpay-screen bg-background flex flex-col px-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>
      <h2 className="text-2xl font-display font-bold mb-6">Send V</h2>

      <AnimatePresence mode="wait">
        {step === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <div>
              <Label className="mb-2 block">Recipient Phone Number</Label>
              <Input
                data-ocid="send.phone_input"
                placeholder="+91 98765 43210"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="bg-input h-12 text-base"
                type="tel"
              />
            </div>
            <Button
              data-ocid="send.search_button"
              type="button"
              className="vpay-btn-primary w-full"
              onClick={handleSearch}
            >
              <Search size={16} className="mr-2" /> Search User
            </Button>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="vpay-card p-4 border-primary/30">
              <p className="text-xs text-muted-foreground mb-2">Sending to</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {foundUser?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-semibold">
                    {foundUser?.name ?? "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {foundUser?.phone ?? searchPhone}
                  </p>
                </div>
                <CheckCircle2 size={20} className="ml-auto text-success" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Amount (V)</Label>
              <div className="relative">
                <Input
                  data-ocid="send.amount_input"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  className="bg-input h-14 text-2xl font-bold text-center pr-10"
                  type="number"
                  min="1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
                  V
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available:{" "}
                {currentUser ? Storage.getUserBalance(currentUser.phone) : 0} V
              </p>
            </div>
            <Button
              data-ocid="send.confirm_button"
              type="button"
              className="vpay-btn-primary w-full h-12 text-base"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send size={16} /> Confirm & Send
                </span>
              )}
            </Button>
            <button
              type="button"
              onClick={() => setStep("search")}
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Change recipient
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
