export interface VPayUser {
  email: string;
  name: string;
  phone: string;
  birthdate: string;
  bio: string;
  links: string[];
  photoBase64: string;
  setupDone: boolean;
  storageChoice: "local" | "gdrive";
}

export interface VPaySecurity {
  type: "pin" | "pattern";
  pin: string;
  pattern: number[];
  adminPassword: string;
  securityQA: { q: string; a: string }[];
  biometricEnabled: boolean;
  recoveryPasskey?: string;
}

export interface VPayTransaction {
  id: string;
  senderPhone: string;
  receiverPhone: string;
  amount: number;
  timestamp: number;
  note: string;
  type: "sent" | "received";
}

export interface VPayAnnouncement {
  message: string;
  timestamp: number;
}

export interface VPayUserRecord {
  user: VPayUser;
  sec: VPaySecurity;
  balance: number;
  transactions: VPayTransaction[];
}

export interface VPayServer {
  id: string;
  name: string;
  createdAt: number;
}

// ---- Server Management (global, not server-scoped) ----
const GLOBAL_SERVERS_KEY = "vpay_servers";
const GLOBAL_ACTIVE_SERVER_KEY = "vpay_active_server";

function getActiveServerId(): string {
  return localStorage.getItem(GLOBAL_ACTIVE_SERVER_KEY) || "default";
}

// Build a storage key scoped to the active server
function key(base: string): string {
  const id = getActiveServerId();
  // Default server keeps backward-compatible key names
  return id === "default" ? `vpay_${base}` : `vpay_${id}_${base}`;
}

// Internal helper: persist a recovery record without any external deps
function _persistRecord(record: VPayUserRecord) {
  try {
    const raw = localStorage.getItem(key("user_records"));
    const records: VPayUserRecord[] = raw ? JSON.parse(raw) : [];
    const idx = records.findIndex((r) => r.user.phone === record.user.phone);
    if (idx >= 0) records[idx] = record;
    else records.push(record);
    localStorage.setItem(key("user_records"), JSON.stringify(records));
  } catch {
    // silent
  }
}

// Internal helper: auto-save local backup snapshot
function _autoSaveLocalBackup() {
  try {
    const backup = {
      version: 1,
      timestamp: Date.now(),
      user: localStorage.getItem(key("user")),
      security: localStorage.getItem(key("security")),
      balance: localStorage.getItem(key("balance")),
      transactions: localStorage.getItem(key("transactions")),
      users: localStorage.getItem(key("users")),
      announcements: localStorage.getItem(key("announcements")),
      userRecords: localStorage.getItem(key("user_records")),
    };
    localStorage.setItem(key("local_backup"), JSON.stringify(backup));
    localStorage.setItem(key("local_backup_time"), Date.now().toString());
  } catch {
    // silent
  }
}

export const Storage = {
  // ---- Server Management ----
  getActiveServerId,

  getActiveServer(): VPayServer | null {
    const id = getActiveServerId();
    const servers = Storage.getServers();
    if (id === "default") {
      return { id: "default", name: "Default Server", createdAt: 0 };
    }
    return servers.find((s) => s.id === id) || null;
  },

  getServers(): VPayServer[] {
    try {
      const data = localStorage.getItem(GLOBAL_SERVERS_KEY);
      const list: VPayServer[] = data ? JSON.parse(data) : [];
      return list;
    } catch {
      return [];
    }
  },

  getAllServersIncludingDefault(): VPayServer[] {
    const custom = Storage.getServers();
    return [{ id: "default", name: "Default Server", createdAt: 0 }, ...custom];
  },

  addServer(name: string): VPayServer {
    const servers = Storage.getServers();
    const id = `srv_${Date.now()}`;
    const server: VPayServer = { id, name: name.trim(), createdAt: Date.now() };
    servers.push(server);
    localStorage.setItem(GLOBAL_SERVERS_KEY, JSON.stringify(servers));
    return server;
  },

  switchServer(id: string) {
    localStorage.setItem(GLOBAL_ACTIVE_SERVER_KEY, id);
  },

  deleteServer(id: string) {
    if (id === "default") return; // cannot delete default
    const servers = Storage.getServers().filter((s) => s.id !== id);
    localStorage.setItem(GLOBAL_SERVERS_KEY, JSON.stringify(servers));
    // If active server is deleted, switch to default
    if (getActiveServerId() === id) {
      Storage.switchServer("default");
    }
    // Clean up server-specific keys
    const prefix = `vpay_${id}_`;
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keysToDelete.push(k);
    }
    for (const k of keysToDelete) {
      localStorage.removeItem(k);
    }
  },

  getServerUserCount(serverId: string): number {
    try {
      const k =
        serverId === "default" ? "vpay_users" : `vpay_${serverId}_users`;
      const data = localStorage.getItem(k);
      return data ? (JSON.parse(data) as VPayUser[]).length : 0;
    } catch {
      return 0;
    }
  },

  // ---- User ----
  getUser: (): VPayUser | null => {
    try {
      const data = localStorage.getItem(key("user"));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: VPayUser) => {
    localStorage.setItem(key("user"), JSON.stringify(user));
    if (user.setupDone) {
      const sec = Storage.getSecurity();
      if (sec) Storage.saveUserRecord(user, sec);
    }
    _autoSaveLocalBackup();
  },

  getSecurity: (): VPaySecurity | null => {
    try {
      const data = localStorage.getItem(key("security"));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setSecurity: (sec: VPaySecurity) => {
    localStorage.setItem(key("security"), JSON.stringify(sec));
    const user = Storage.getUser();
    if (user?.setupDone) Storage.saveUserRecord(user, sec);
    _autoSaveLocalBackup();
  },

  getBalance: (): Record<string, number> => {
    try {
      const data = localStorage.getItem(key("balance"));
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  setBalance: (bal: Record<string, number>) => {
    localStorage.setItem(key("balance"), JSON.stringify(bal));
    const records: VPayUserRecord[] = Storage.getAllUserRecords();
    let changed = false;
    for (const record of records) {
      const newBal = bal[record.user.phone] ?? 0;
      if (record.balance !== newBal) {
        record.balance = newBal;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(key("user_records"), JSON.stringify(records));
    }
    _autoSaveLocalBackup();
  },
  getUserBalance: (phone: string): number => {
    const bal = Storage.getBalance();
    return bal[phone] ?? 0;
  },
  adjustBalance: (phone: string, delta: number) => {
    const bal = Storage.getBalance();
    bal[phone] = (bal[phone] ?? 0) + delta;
    Storage.setBalance(bal);
  },

  getTransactions: (): VPayTransaction[] => {
    try {
      const data = localStorage.getItem(key("transactions"));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addTransaction: (tx: VPayTransaction) => {
    const txs = Storage.getTransactions();
    txs.unshift(tx);
    const updated = txs.slice(0, 500);
    localStorage.setItem(key("transactions"), JSON.stringify(updated));
    const records: VPayUserRecord[] = Storage.getAllUserRecords();
    let changed = false;
    for (const record of records) {
      if (
        record.user.phone === tx.senderPhone ||
        record.user.phone === tx.receiverPhone
      ) {
        const userTxs = updated.filter(
          (t) =>
            t.senderPhone === record.user.phone ||
            t.receiverPhone === record.user.phone,
        );
        record.transactions = userTxs.slice(0, 500);
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(key("user_records"), JSON.stringify(records));
    }
    _autoSaveLocalBackup();
  },

  getUsers: (): VPayUser[] => {
    try {
      const data = localStorage.getItem(key("users"));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addOrUpdateUser: (user: VPayUser) => {
    const users = Storage.getUsers();
    const idx = users.findIndex((u) => u.phone === user.phone);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    localStorage.setItem(key("users"), JSON.stringify(users));
  },
  findUserByPhone: (phone: string): VPayUser | null => {
    const users = Storage.getUsers();
    return users.find((u) => u.phone === phone) || null;
  },

  // ---- Full user records for account recovery ----
  getAllUserRecords: (): VPayUserRecord[] => {
    try {
      const data = localStorage.getItem(key("user_records"));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveUserRecord: (user: VPayUser, sec: VPaySecurity) => {
    const bal = Storage.getBalance();
    const userBalance = bal[user.phone] ?? 0;
    const txs = Storage.getTransactions().filter(
      (t) => t.senderPhone === user.phone || t.receiverPhone === user.phone,
    );
    const record: VPayUserRecord = {
      user,
      sec,
      balance: userBalance,
      transactions: txs.slice(0, 500),
    };
    _persistRecord(record);
  },
  findUserRecord: (phone: string, email: string): VPayUserRecord | null => {
    const records = Storage.getAllUserRecords();
    return (
      records.find(
        (r) =>
          r.user.phone.trim() === phone.trim() &&
          r.user.email.trim().toLowerCase() === email.trim().toLowerCase(),
      ) || null
    );
  },

  getAnnouncements: (): VPayAnnouncement[] => {
    try {
      const data = localStorage.getItem(key("announcements"));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addAnnouncement: (ann: VPayAnnouncement) => {
    const anns = Storage.getAnnouncements();
    anns.unshift(ann);
    localStorage.setItem(
      key("announcements"),
      JSON.stringify(anns.slice(0, 100)),
    );
  },

  clearAll: () => {
    const keys = [
      key("user"),
      key("security"),
      key("balance"),
      key("transactions"),
      key("users"),
      key("announcements"),
      // NOTE: user_records and local_backup intentionally NOT cleared so recovery works
    ];
    for (const k of keys) {
      localStorage.removeItem(k);
    }
  },

  // ---- Local Backup ----
  saveLocalBackup: () => {
    _autoSaveLocalBackup();
  },

  getLocalBackupTime: (): number | null => {
    const v = localStorage.getItem(key("local_backup_time"));
    return v ? Number.parseInt(v) : null;
  },

  hasLocalBackup: (): boolean => {
    return !!localStorage.getItem(key("local_backup"));
  },

  createFullBackup: () => {
    return {
      version: 1,
      timestamp: Date.now(),
      user: Storage.getUser(),
      security: Storage.getSecurity(),
      balance: Storage.getBalance(),
      transactions: Storage.getTransactions(),
      users: Storage.getUsers(),
      announcements: Storage.getAnnouncements(),
    };
  },

  restoreFromFullBackup: (data: Record<string, unknown>) => {
    if (data.user) localStorage.setItem(key("user"), JSON.stringify(data.user));
    if (data.security)
      localStorage.setItem(key("security"), JSON.stringify(data.security));
    if (data.balance)
      localStorage.setItem(key("balance"), JSON.stringify(data.balance));
    if (data.transactions)
      localStorage.setItem(
        key("transactions"),
        JSON.stringify(data.transactions),
      );
    if (data.users)
      localStorage.setItem(key("users"), JSON.stringify(data.users));
    if (data.announcements)
      localStorage.setItem(
        key("announcements"),
        JSON.stringify(data.announcements),
      );
  },

  getLastBackupTime: (): number | null => {
    const v = localStorage.getItem(key("last_backup"));
    return v ? Number.parseInt(v) : null;
  },
  setLastBackupTime: (ts: number) => {
    localStorage.setItem(key("last_backup"), ts.toString());
  },
  // Cloud mode
  getCloudMode: (): boolean => {
    return localStorage.getItem("vpay_cloud_mode") === "true";
  },
  setCloudMode: (enabled: boolean) => {
    localStorage.setItem("vpay_cloud_mode", enabled ? "true" : "false");
  },
  getLastCloudSync: (): number | null => {
    const v = localStorage.getItem("vpay_last_cloud_sync");
    return v ? Number.parseInt(v) : null;
  },
  setLastCloudSync: (ts: number) => {
    localStorage.setItem("vpay_last_cloud_sync", ts.toString());
  },
};
