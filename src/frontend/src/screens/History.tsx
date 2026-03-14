import { Storage } from "@/lib/storage";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Clock } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onBack: () => void;
}

export default function History({ onBack }: Props) {
  const user = Storage.getUser();
  const txs = Storage.getTransactions();
  const myTxs = txs.filter(
    (t) => t.senderPhone === user?.phone || t.receiverPhone === user?.phone,
  );

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <h2 className="text-2xl font-display font-bold mb-6">
        Transaction History
      </h2>

      {myTxs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center flex-1 py-20"
          data-ocid="history.empty_state"
        >
          <Clock size={48} className="text-muted mb-4" />
          <p className="text-muted-foreground text-center">
            No transactions yet.
          </p>
          <p className="text-muted-foreground text-sm text-center mt-1">
            Start sending or receiving V!
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {myTxs.map((tx, i) => {
            const isSent = tx.senderPhone === user?.phone;
            const other = isSent ? tx.receiverPhone : tx.senderPhone;
            const otherUser = Storage.findUserByPhone(other);
            const ocid =
              i === 0
                ? "history.item.1"
                : i === 1
                  ? "history.item.2"
                  : `history.item.${i + 1}`;
            return (
              <motion.div
                key={tx.id}
                data-ocid={ocid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="vpay-card p-4 flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSent ? "bg-destructive/20" : "bg-success/20"}`}
                >
                  {isSent ? (
                    <ArrowUpRight size={20} className="text-destructive" />
                  ) : (
                    <ArrowDownLeft size={20} className="text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {isSent ? "Sent to" : "Received from"}{" "}
                    {otherUser?.name ?? other}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {other}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(tx.timestamp)}
                  </p>
                </div>
                <div
                  className={`font-display font-bold text-lg flex-shrink-0 ${isSent ? "text-destructive" : "text-success"}`}
                >
                  {isSent ? "-" : "+"}
                  {tx.amount} V
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
