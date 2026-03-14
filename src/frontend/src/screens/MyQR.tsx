import { Button } from "@/components/ui/button";
import { Storage } from "@/lib/storage";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

export default function MyQR({ onBack }: Props) {
  const user = Storage.getUser();
  const phone = user?.phone ?? "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(phone)}&bgcolor=0d1117&color=00c8ff&format=png`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `vpay-qr-${phone}.png`;
    link.click();
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "My V-PAY QR Code",
        text: `Scan to send V to ${user?.name} (${phone})`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(phone);
      toast.success("Phone number copied!");
    }
  };

  return (
    <div className="vpay-screen bg-background flex flex-col px-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <h2 className="text-2xl font-display font-bold mb-2">My QR Code</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Others scan this to send you V
      </p>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center"
      >
        <div className="p-4 bg-[#0d1117] rounded-3xl border border-border vpay-glow mb-6">
          <img
            src={qrUrl}
            alt="My QR Code"
            width={240}
            height={240}
            className="rounded-xl"
          />
        </div>
        <p className="text-xl font-display font-bold">{user?.name}</p>
        <p className="text-muted-foreground text-sm mt-1 font-mono">{phone}</p>
        <div className="flex gap-3 mt-8 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-border"
            onClick={handleDownload}
          >
            <Download size={16} className="mr-2" /> Save QR
          </Button>
          <Button
            type="button"
            className="vpay-btn-primary flex-1"
            onClick={handleShare}
          >
            <Share2 size={16} className="mr-2" /> Share
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
