import { useState, useEffect } from "react";
import { Settings, LogOut, Heart, ChevronRight, Pencil, X, Check } from "lucide-react";
import { AvatarPicker, avatarList } from "@/components/AvatarPicker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "selected_avatar";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(avatarList[0]);
  const [picking, setPicking] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(avatarList[0]);

  // Carrega avatar salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = avatarList.find((a) => a.id === saved);
        if (found) { setSelectedAvatar(found); setTempAvatar(found); }
      }
    } catch {}
  }, []);

  const handleConfirm = () => {
    setSelectedAvatar(tempAvatar);
    try { localStorage.setItem(STORAGE_KEY, tempAvatar.id); } catch {}
    setPicking(false);
  };

  const menuItems = [
    { label: "Minha Lista", icon: Heart },
    { label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-6">
        <h1 className="font-display text-3xl text-foreground tracking-wider mb-8">MEU PERFIL</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <div
              className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary"
              style={{ background: selectedAvatar.bg }}
            >
              {selectedAvatar.svg}
            </div>
            <button
              onClick={() => { setTempAvatar(selectedAvatar); setPicking(true); }}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background"
            >
              <Pencil className="w-3 h-3 text-primary-foreground" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{user?.email?.split("@")[0] ?? "Usuário"}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "usuario@example.com"}</p>
          </div>
        </div>

        {/* Modal de seleção de avatar */}
        {picking && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-foreground">Escolha seu Avatar</h2>
                <button onClick={() => setPicking(false)}>
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-secondary/40">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary flex-shrink-0"
                  style={{ background: tempAvatar.bg }}
                >
                  {tempAvatar.svg}
                </div>
                <p className="text-sm font-semibold text-foreground">{tempAvatar.name}</p>
              </div>

              <AvatarPicker
                selected={tempAvatar.id}
                onSelect={(a) => {
                  const full = avatarList.find((av) => av.id === a.id)!;
                  setTempAvatar(full);
                }}
              />

              <button
                onClick={handleConfirm}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition"
              >
                <Check className="w-4 h-4" /> Confirmar Avatar
              </button>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="space-y-1">
          {menuItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="flex-1 text-left text-sm">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-destructive hover:bg-secondary/50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="flex-1 text-left text-sm">Sair</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
