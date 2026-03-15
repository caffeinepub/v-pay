// Google Drive backup/restore utility for V-PAY
// Uses Google Identity Services (GIS) implicit OAuth flow
// To enable: replace CLIENT_ID with your Google Cloud OAuth 2.0 client ID
// (Web application type, with the app's URL as an authorized origin)

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";
const BACKUP_FILENAME = "vpay-backup.json";

export const GDRIVE_CONFIGURED =
  CLIENT_ID.length > 0 && CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID";

export interface GDriveBackup {
  version: number;
  timestamp: number;
  user: unknown;
  security: unknown;
  balance: unknown;
  transactions: unknown;
  users: unknown;
  announcements: unknown;
}

/** Get Google OAuth access token via GIS popup */
export async function getGoogleToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = (window as unknown as { google: unknown }).google as
      | {
          accounts: {
            oauth2: {
              initTokenClient: (config: unknown) => {
                requestAccessToken: () => void;
              };
            };
          };
        }
      | undefined;

    if (!google?.accounts?.oauth2) {
      reject(
        new Error(
          "Google Identity Services not loaded. Please refresh and try again.",
        ),
      );
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: { error?: string; access_token?: string }) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(response.error ?? "Failed to get Google access token"),
          );
        } else {
          resolve(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  });
}

/** Save backup JSON to Drive appDataFolder */
export async function saveBackupToDrive(
  token: string,
  data: GDriveBackup,
): Promise<void> {
  // Check if file already exists
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'${BACKUP_FILENAME}'`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) throw new Error("Failed to check existing backup");
  const listData = (await listRes.json()) as { files?: { id: string }[] };
  const existingFile = listData.files?.[0];

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });

  if (existingFile) {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: blob,
      },
    );
    if (!res.ok) throw new Error("Failed to update backup");
  } else {
    const meta = { name: BACKUP_FILENAME, parents: ["appDataFolder"] };
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(meta)], { type: "application/json" }),
    );
    form.append("file", blob);
    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );
    if (!res.ok) throw new Error("Failed to create backup");
  }
}

/** Load backup from Drive appDataFolder */
export async function loadBackupFromDrive(
  token: string,
): Promise<GDriveBackup | null> {
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'${BACKUP_FILENAME}'`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) throw new Error("Failed to access Google Drive");
  const listData = (await listRes.json()) as { files?: { id: string }[] };
  const file = listData.files?.[0];
  if (!file) return null;

  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!fileRes.ok) throw new Error("Failed to download backup");
  return (await fileRes.json()) as GDriveBackup;
}
