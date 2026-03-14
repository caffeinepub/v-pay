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

export const Storage = {
  getUser: (): VPayUser | null => {
    try {
      const data = localStorage.getItem("vpay_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: VPayUser) => {
    localStorage.setItem("vpay_user", JSON.stringify(user));
  },

  getSecurity: (): VPaySecurity | null => {
    try {
      const data = localStorage.getItem("vpay_security");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setSecurity: (sec: VPaySecurity) => {
    localStorage.setItem("vpay_security", JSON.stringify(sec));
  },

  getBalance: (): Record<string, number> => {
    try {
      const data = localStorage.getItem("vpay_balance");
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  setBalance: (bal: Record<string, number>) => {
    localStorage.setItem("vpay_balance", JSON.stringify(bal));
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
      const data = localStorage.getItem("vpay_transactions");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addTransaction: (tx: VPayTransaction) => {
    const txs = Storage.getTransactions();
    txs.unshift(tx);
    localStorage.setItem(
      "vpay_transactions",
      JSON.stringify(txs.slice(0, 500)),
    );
  },

  getUsers: (): VPayUser[] => {
    try {
      const data = localStorage.getItem("vpay_users");
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
    localStorage.setItem("vpay_users", JSON.stringify(users));
  },
  findUserByPhone: (phone: string): VPayUser | null => {
    const users = Storage.getUsers();
    return users.find((u) => u.phone === phone) || null;
  },

  getAnnouncements: (): VPayAnnouncement[] => {
    try {
      const data = localStorage.getItem("vpay_announcements");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addAnnouncement: (ann: VPayAnnouncement) => {
    const anns = Storage.getAnnouncements();
    anns.unshift(ann);
    localStorage.setItem(
      "vpay_announcements",
      JSON.stringify(anns.slice(0, 100)),
    );
  },

  clearAll: () => {
    const keys = [
      "vpay_user",
      "vpay_security",
      "vpay_balance",
      "vpay_transactions",
      "vpay_users",
      "vpay_announcements",
    ];
    for (const k of keys) {
      localStorage.removeItem(k);
    }
  },
};
