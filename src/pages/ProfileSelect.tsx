import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const ProfileSelect = () => {
  const { user } = useAuth();
  const { profiles, loading, addProfile, removeProfile, updateProfile } = useProfiles();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [creating, setCreating] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-muted-foreground">Você precisa estar logado para gerenciar perfis.</p>
        <Button onClick={() => navigate("/login")} className="gradient-neon text-primary-foreground">Entrar</Button>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Nome obrigatório"); return; }
    setCreating(true);
    await addProfile(newName.trim(), newAvatar.trim() || undefined);
    setNewName("");
    setNewAvatar("");
    setShowCreate(false);
    setCreating(false);
    toast.success("Perfil criado!");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateProfile(id, { name: editName.trim(), avatar_url: editAvatar.trim() || null });
    setEditingId(null);
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
    setEditAvatar(p.avatar_url || "");
  };

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
                  <div className="glass rounded-xl border border-border/30 p-4 w-36 space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome"
                      className="bg-secondary/50 border-border/50 text-sm h-8"
                    />
                    <Input
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="URL avatar"
                      className="bg-secondary/50 border-border/50 text-sm h-8"
                    />
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleUpdate(p.id)} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
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

                {/* Edit/delete controls */}
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

            {/* Add profile button */}
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

        {/* Create form */}
        {showCreate && (
          <div className="glass rounded-xl border border-border/30 p-6 max-w-sm mx-auto space-y-4 animate-scale-in">
            <h3 className="font-display text-sm font-bold text-foreground">Novo Perfil</h3>
            <Input
              placeholder="Nome do perfil *"
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 50))}
              className="bg-secondary/50 border-border/50"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Input
              placeholder="URL do avatar (opcional)"
              value={newAvatar}
              onChange={(e) => setNewAvatar(e.target.value)}
              className="bg-secondary/50 border-border/50"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setNewName(""); setNewAvatar(""); }}>
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
      <BottomNav />
    </div>
  );
};

export default ProfileSelect;
