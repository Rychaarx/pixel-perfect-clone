import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Check, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const getAvatarPublicUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;

const ProfileSelect = () => {
  const { user } = useAuth();
  const { profiles, loading, addProfile, removeProfile, updateProfile } = useProfiles();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-muted-foreground">Você precisa estar logado para gerenciar perfis.</p>
        <Button onClick={() => navigate("/login")} className="gradient-neon text-primary-foreground">Entrar</Button>
      </div>
    );
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Erro ao enviar imagem: " + error.message);
      return null;
    }
    return getAvatarPublicUrl(path);
  };

  const handleFileSelect = (file: File | undefined, setFile: (f: File | null) => void, setPreview: (s: string | null) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB)");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Nome obrigatório"); return; }
    setCreating(true);
    let avatarUrl: string | undefined;
    if (newAvatarFile) {
      const url = await uploadAvatar(newAvatarFile);
      if (url) avatarUrl = url;
    }
    await addProfile(newName.trim(), avatarUrl);
    setNewName("");
    setNewAvatarFile(null);
    setNewAvatarPreview(null);
    setShowCreate(false);
    setCreating(false);
    toast.success("Perfil criado!");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    let avatarUrl: string | null = editAvatarPreview;
    if (editAvatarFile) {
      const url = await uploadAvatar(editAvatarFile);
      if (url) avatarUrl = url;
    }
    await updateProfile(id, { name: editName.trim(), avatar_url: avatarUrl });
    setEditingId(null);
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    toast.success("Perfil atualizado!");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir perfil "${name}"?`)) return;
    await removeProfile(id);
    toast.success("Perfil removido!");
  };

  const startEdit = (p: { id: string; name: string; avatar_url: string | null }) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditAvatarFile(null);
    setEditAvatarPreview(p.avatar_url);
  };

  const AvatarPicker = ({ preview, onPickClick, size = "w-16 h-16" }: { preview: string | null; onPickClick: () => void; size?: string }) => (
    <button type="button" onClick={onPickClick} className={`${size} rounded-xl bg-muted flex items-center justify-center overflow-hidden relative group/avatar border-2 border-dashed border-border hover:border-primary transition-colors`}>
      {preview ? (
        <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <Camera className="w-5 h-5 text-muted-foreground group-hover/avatar:text-primary transition-colors" />
      )}
      {preview && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
          <Camera className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 neon-text">Quem está assistindo?</h1>
        <p className="text-muted-foreground text-sm mb-8">Selecione ou crie um perfil</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-5 flex-wrap justify-center mb-8">
            {profiles.map((p) => (
              <div key={p.id} className="relative group">
                {editingId === p.id ? (
                  <div className="glass rounded-xl border border-border/30 p-4 w-40 space-y-3">
                    <div className="flex justify-center">
                      <AvatarPicker
                        preview={editAvatarPreview}
                        onPickClick={() => editFileRef.current?.click()}
                      />
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0], setEditAvatarFile, setEditAvatarPreview)}
                      />
                    </div>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome"
                      className="bg-secondary/50 border-border/50 text-sm h-8"
                    />
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleUpdate(p.id)} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingId(null); setEditAvatarFile(null); setEditAvatarPreview(null); }} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => navigate("/")} className="flex flex-col items-center gap-3 group/btn">
                    <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center text-3xl font-display text-primary group-hover/btn:ring-2 ring-primary transition-all overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.name[0]?.toUpperCase()
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground group-hover/btn:text-foreground transition-colors">{p.name}</span>
                  </button>
                )}

                {editingId !== p.id && (
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(p)} className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {!showCreate && (
              <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-3 group/add">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center transition-colors group-hover/add:border-primary">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover/add:text-primary transition-colors" />
                </div>
                <span className="text-sm text-muted-foreground group-hover/add:text-foreground transition-colors">Adicionar</span>
              </button>
            )}
          </div>
        )}

        {showCreate && (
          <div className="glass rounded-xl border border-border/30 p-6 max-w-sm mx-auto space-y-4 animate-scale-in">
            <h3 className="font-display text-sm font-bold text-foreground">Novo Perfil</h3>
            <div className="flex justify-center">
              <AvatarPicker
                preview={newAvatarPreview}
                onPickClick={() => createFileRef.current?.click()}
                size="w-20 h-20"
              />
              <input
                ref={createFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0], setNewAvatarFile, setNewAvatarPreview)}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">Toque para escolher uma foto</p>
            <Input
              placeholder="Nome do perfil *"
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 50))}
              className="bg-secondary/50 border-border/50"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setNewName(""); setNewAvatarFile(null); setNewAvatarPreview(null); }}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()} className="gradient-neon text-primary-foreground gap-1">
                {creating ? <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                Criar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSelect;
