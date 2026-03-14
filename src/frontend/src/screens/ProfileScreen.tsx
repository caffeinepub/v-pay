import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Storage } from "@/lib/storage";
import { ArrowLeft, Edit2, ExternalLink, Plus, Save, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: Props) {
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
              {user.storageChoice === "gdrive" ? "☁ Google Drive" : "💾 Local"}
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
      </motion.div>
    </div>
  );
}
