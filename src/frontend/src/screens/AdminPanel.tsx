import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { createActorWithConfig } from "@/config";
import { Storage } from "@/lib/storage";
import {
  CheckCircle2,
  Cloud,
  CloudUpload,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Megaphone,
  MinusCircle,
  PlusCircle,
  Settings,
  Shield,
  Users,
  Zap,
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

  // Password change state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Cloud/Platform state
  const [cloudMode, setCloudMode] = useState(Storage.getCloudMode());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(Storage.getLastCloudSync());

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

  const handleChangePassword = () => {
    const sec = Storage.getSecurity();
    const savedPwd = sec?.adminPassword || "admin123";

    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("All fields are required");
      return;
    }
    if (currentPwd !== savedPwd) {
      toast.error("Current password is incorrect");
      setCurrentPwd("");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("New passwords do not match");
      setConfirmPwd("");
      return;
    }
    if (sec) {
      Storage.setSecurity({ ...sec, adminPassword: newPwd });
    } else {
      Storage.setSecurity({
        type: "pin",
        pin: "",
        pattern: [],
        adminPassword: newPwd,
        securityQA: [],
        biometricEnabled: false,
      });
    }
    toast.success("Admin password changed successfully!");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  const handleToggleCloud = (enabled: boolean) => {
    Storage.setCloudMode(enabled);
    setCloudMode(enabled);
    toast.success(enabled ? "Cloud Mode enabled" : "Cloud Mode disabled");
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const actor = await createActorWithConfig();
      const users = Storage.getUsers();
      let count = 0;
      for (const user of users) {
        try {
          await actor.register(user.phone, user.name);
          count++;
        } catch {
          // skip individual failures
        }
      }
      const now = Date.now();
      Storage.setLastCloudSync(now);
      setLastSync(now);
      toast.success(
        `Synced ${count} user${count !== 1 ? "s" : ""} to ICP canister`,
      );
    } catch {
      toast.error("Sync failed. Check network connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const users = Storage.getUsers();
  const balance = Storage.getBalance();

  const formatSyncTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  return (
    <div className="vpay-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
            <Shield size={16} className="text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold leading-tight">
              ADMIN PANEL
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe size={10} />
              ICP Platform · Online
            </p>
          </div>
        </div>
        <Button
          data-ocid="admin.logout_button"
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
          <TabsList className="w-full mb-4 bg-muted/50 grid grid-cols-6">
            <TabsTrigger
              value="mint"
              data-ocid="admin.mint.tab"
              className="text-xs"
            >
              Mint
            </TabsTrigger>
            <TabsTrigger
              value="burn"
              data-ocid="admin.burn.tab"
              className="text-xs"
            >
              Burn
            </TabsTrigger>
            <TabsTrigger
              value="broadcast"
              data-ocid="admin.broadcast.tab"
              className="text-xs"
            >
              Cast
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="admin.users.tab"
              className="text-xs"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="platform"
              data-ocid="admin.platform.tab"
              className="text-xs"
            >
              Platform
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              data-ocid="admin.settings.tab"
              className="text-xs"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Mint Tab */}
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
                    Add V to a user&apos;s balance
                  </p>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Phone Number</Label>
                <Input
                  data-ocid="admin.mint_phone.input"
                  placeholder="+91 98765 43210"
                  value={mintPhone}
                  onChange={(e) => setMintPhone(e.target.value)}
                  className="bg-input"
                />
              </div>
              <div>
                <Label className="mb-1 block">Amount (V)</Label>
                <Input
                  data-ocid="admin.mint_amount.input"
                  placeholder="1000"
                  type="number"
                  min="1"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="bg-input"
                />
              </div>
              <Button
                data-ocid="admin.mint.button"
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

          {/* Burn Tab */}
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
                    Remove V from a user&apos;s balance
                  </p>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Phone Number</Label>
                <Input
                  data-ocid="admin.burn_phone.input"
                  placeholder="+91 98765 43210"
                  value={burnPhone}
                  onChange={(e) => setBurnPhone(e.target.value)}
                  className="bg-input"
                />
              </div>
              <div>
                <Label className="mb-1 block">Amount (V)</Label>
                <Input
                  data-ocid="admin.burn_amount.input"
                  placeholder="500"
                  type="number"
                  min="1"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="bg-input"
                />
              </div>
              <Button
                data-ocid="admin.burn.button"
                variant="destructive"
                className="w-full"
                onClick={handleBurn}
              >
                <MinusCircle size={16} className="mr-2" /> Burn V from Account
              </Button>
            </motion.div>
          </TabsContent>

          {/* Broadcast Tab */}
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
                  data-ocid="admin.broadcast.textarea"
                  placeholder="System announcement..."
                  value={broadcast}
                  onChange={(e) => setBroadcast(e.target.value)}
                  className="bg-input resize-none"
                  rows={3}
                />
              </div>
              <Button
                data-ocid="admin.broadcast.button"
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

          {/* Users Tab */}
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
                <p
                  data-ocid="admin.users.empty_state"
                  className="text-muted-foreground text-sm text-center py-8"
                >
                  No registered users yet
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
                      {users.map((u, idx) => (
                        <TableRow
                          key={u.phone}
                          data-ocid={`admin.users.item.${idx + 1}`}
                          className="border-border"
                        >
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

          {/* Platform Tab */}
          <TabsContent value="platform">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">ICP Platform</h3>
                  <p className="text-xs text-muted-foreground">
                    Your server is already live — no domain needed
                  </p>
                </div>
              </div>

              {/* Status Card */}
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Platform Status
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hosting</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <Zap size={12} className="text-primary" />
                    Internet Computer (ICP)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Database</span>
                  <span className="font-medium">On-chain Canister</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Online
                  </span>
                </div>
              </div>

              {/* Cloud Storage Toggle */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cloud size={20} className="text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Enable Cloud Mode</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sync user accounts to the ICP canister for cross-device
                        recovery
                      </p>
                    </div>
                  </div>
                  <Switch
                    data-ocid="admin.cloud_mode.switch"
                    checked={cloudMode}
                    onCheckedChange={handleToggleCloud}
                  />
                </div>

                {cloudMode && (
                  <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
                    <Button
                      data-ocid="admin.sync_users.button"
                      className="w-full vpay-btn-primary"
                      onClick={handleSyncAll}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <CloudUpload size={16} className="mr-2" />
                          Sync All Users ({users.length})
                        </>
                      )}
                    </Button>
                    {lastSync && (
                      <p className="text-xs text-muted-foreground text-center">
                        Last synced: {formatSyncTime(lastSync)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Cloud Stats */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Local Storage Stats
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Users</span>
                  <span className="font-bold text-primary">{users.length}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  View full details in the{" "}
                  <span className="font-medium text-foreground">Users</span> tab
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">
                      No domain or hosting fees.
                    </span>{" "}
                    This app runs on ICP — a decentralized cloud platform. Your
                    canister IS the server and database. Enable Cloud Mode above
                    to let users recover their old V account from any device
                    using their phone number.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Change Admin Password</h3>
                  <p className="text-xs text-muted-foreground">
                    Update your admin login password
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 flex flex-col gap-4">
                <div>
                  <Label className="mb-1 block text-sm">Current Password</Label>
                  <Input
                    data-ocid="admin.current_pwd.input"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-sm">New Password</Label>
                  <Input
                    data-ocid="admin.new_pwd.input"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-sm">
                    Confirm New Password
                  </Label>
                  <Input
                    data-ocid="admin.confirm_pwd.input"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="bg-input"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleChangePassword()
                    }
                  />
                </div>
                <Button
                  data-ocid="admin.change_pwd.button"
                  className="w-full vpay-btn-primary"
                  onClick={handleChangePassword}
                >
                  <Settings size={16} className="mr-2" /> Update Password
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Default password is{" "}
                <span className="font-mono font-bold">admin123</span>. Change it
                for security.
              </p>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
