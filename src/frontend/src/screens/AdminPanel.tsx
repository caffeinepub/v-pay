import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Storage } from "@/lib/storage";
import {
  LogOut,
  Megaphone,
  MinusCircle,
  PlusCircle,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: Props) {
  const [mintPhone, setMintPhone] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [burnPhone, setBurnPhone] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [virusMsg, setVirusMsg] = useState("");

  const handleMint = () => {
    const amt = Number.parseInt(mintAmount, 10);
    if (!mintPhone || !amt || amt <= 0) {
      toast.error("Enter valid phone and amount");
      return;
    }
    Storage.adjustBalance(mintPhone, amt);
    toast.success(`Minted ${amt} V to ${mintPhone}`);
    setMintPhone("");
    setMintAmount("");
  };

  const handleBurn = () => {
    const amt = Number.parseInt(burnAmount, 10);
    if (!burnPhone || !amt || amt <= 0) {
      toast.error("Enter valid phone and amount");
      return;
    }
    const current = Storage.getUserBalance(burnPhone);
    if (current < amt) {
      toast.error(`User only has ${current} V`);
      return;
    }
    Storage.adjustBalance(burnPhone, -amt);
    toast.success(`Burned ${amt} V from ${burnPhone}`);
    setBurnPhone("");
    setBurnAmount("");
  };

  const handleBroadcast = () => {
    if (!broadcast.trim()) {
      toast.error("Enter a message");
      return;
    }
    Storage.addAnnouncement({ message: broadcast, timestamp: Date.now() });
    toast.success("Announcement sent!");
    setBroadcast("");
  };

  const handleVirus = () => {
    if (!virusMsg.trim()) {
      toast.error("Enter virus command");
      return;
    }
    Storage.addAnnouncement({
      message: `[SYSTEM COMMAND] ${virusMsg}`,
      timestamp: Date.now(),
    });
    toast.success("Command broadcast sent!");
    setVirusMsg("");
  };

  const users = Storage.getUsers();
  const balance = Storage.getBalance();

  return (
    <div className="vpay-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
            <Shield size={16} className="text-destructive" />
          </div>
          <h1 className="text-xl font-display font-bold">ADMIN PANEL</h1>
        </div>
        <Button
          data-ocid="admin.burn_button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-muted-foreground gap-2"
        >
          <LogOut size={16} /> Logout
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Tabs defaultValue="mint">
          <TabsList className="w-full mb-4 bg-muted/50 grid grid-cols-4">
            <TabsTrigger
              value="mint"
              data-ocid="admin.mint_button"
              className="text-xs"
            >
              Mint V
            </TabsTrigger>
            <TabsTrigger value="burn" className="text-xs">
              Burn V
            </TabsTrigger>
            <TabsTrigger
              value="broadcast"
              data-ocid="admin.broadcast_button"
              className="text-xs"
            >
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mint">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <PlusCircle size={24} className="text-success" />
                <div>
                  <h3 className="font-semibold">Generate V</h3>
                  <p className="text-xs text-muted-foreground">
                    Add V to a user's balance
                  </p>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={mintPhone}
                  onChange={(e) => setMintPhone(e.target.value)}
                  className="bg-input"
                />
              </div>
              <div>
                <Label className="mb-1 block">Amount (V)</Label>
                <Input
                  placeholder="1000"
                  type="number"
                  min="1"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="bg-input"
                />
              </div>
              <Button
                data-ocid="admin.mint_button"
                className="w-full"
                style={{
                  background: "oklch(0.72 0.18 145)",
                  color: "oklch(0.08 0.01 145)",
                }}
                onClick={handleMint}
              >
                <PlusCircle size={16} className="mr-2" /> Mint V to Account
              </Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="burn">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <MinusCircle size={24} className="text-destructive" />
                <div>
                  <h3 className="font-semibold">Delete V</h3>
                  <p className="text-xs text-muted-foreground">
                    Remove V from a user's balance
                  </p>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={burnPhone}
                  onChange={(e) => setBurnPhone(e.target.value)}
                  className="bg-input"
                />
              </div>
              <div>
                <Label className="mb-1 block">Amount (V)</Label>
                <Input
                  placeholder="500"
                  type="number"
                  min="1"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="bg-input"
                />
              </div>
              <Button
                data-ocid="admin.burn_button"
                variant="destructive"
                className="w-full"
                onClick={handleBurn}
              >
                <MinusCircle size={16} className="mr-2" /> Burn V from Account
              </Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="broadcast">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <Megaphone size={24} className="text-primary" />
                <div>
                  <h3 className="font-semibold">Broadcast Message</h3>
                  <p className="text-xs text-muted-foreground">
                    Send system-wide announcement
                  </p>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Announcement</Label>
                <Textarea
                  data-ocid="admin.broadcast_button"
                  placeholder="System announcement..."
                  value={broadcast}
                  onChange={(e) => setBroadcast(e.target.value)}
                  className="bg-input resize-none"
                  rows={3}
                />
              </div>
              <Button
                data-ocid="admin.broadcast_button"
                className="vpay-btn-primary w-full"
                onClick={handleBroadcast}
              >
                <Megaphone size={16} className="mr-2" /> Send Announcement
              </Button>

              <div className="border-t border-border pt-4">
                <Label className="mb-1 block text-destructive">
                  Command Broadcast (Virus)
                </Label>
                <Textarea
                  placeholder="System command..."
                  value={virusMsg}
                  onChange={(e) => setVirusMsg(e.target.value)}
                  className="bg-input resize-none border-destructive/30"
                  rows={2}
                />
                <Button
                  variant="destructive"
                  className="w-full mt-2"
                  onClick={handleVirus}
                >
                  Spread Command
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="users">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 mb-4">
                <Users size={24} className="text-primary" />
                <div>
                  <h3 className="font-semibold">Registered Users</h3>
                  <p className="text-xs text-muted-foreground">
                    {users.length} total users
                  </p>
                </div>
              </div>
              {users.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No registered users
                </p>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs">
                          Name
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs">
                          Phone
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">
                          Balance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.phone} className="border-border">
                          <TableCell className="text-sm font-medium">
                            {u.name}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {u.phone}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-primary">
                            {balance[u.phone] ?? 0} V
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
