import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Check, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// Predefined avatars - Clássicos
import avatarRobot from "@/assets/avatars/avatar-robot.png";
import avatarCat from "@/assets/avatars/avatar-cat.png";
import avatarFox from "@/assets/avatars/avatar-fox.png";
import avatarAstronaut from "@/assets/avatars/avatar-astronaut.png";
import avatarPanda from "@/assets/avatars/avatar-panda.png";
import avatarEagle from "@/assets/avatars/avatar-eagle.png";
import avatarUnicorn from "@/assets/avatars/avatar-unicorn.png";
import avatarNinja from "@/assets/avatars/avatar-ninja.png";
// Filmes
import avatarSpaceExplorer from "@/assets/avatars/avatar-space-explorer.png";
import avatarDetective from "@/assets/avatars/avatar-detective.png";
import avatarSuperhero from "@/assets/avatars/avatar-superhero.png";
import avatarPirate from "@/assets/avatars/avatar-pirate.png";
import avatarWizard from "@/assets/avatars/avatar-wizard.png";
import avatarRacer from "@/assets/avatars/avatar-racer.png";
import avatarZombie from "@/assets/avatars/avatar-zombie.png";
import avatarPrincess from "@/assets/avatars/avatar-princess.png";
// Anime
import avatarAnimeWarrior from "@/assets/avatars/avatar-anime-warrior.png";
import avatarAnimeGirl from "@/assets/avatars/avatar-anime-girl.png";
import avatarSamurai from "@/assets/avatars/avatar-samurai.png";
import avatarVampire from "@/assets/avatars/avatar-vampire.png";
// Personagens
const avatarCoolguy = "/avatars/avatar-coolguy.svg";
const avatarKawaii = "/avatars/avatar-kawaii.svg";
const avatarNerd = "/avatars/avatar-nerd.svg";
const avatarNinjaSvg = "/avatars/avatar-ninja.svg";
const avatarPunkSvg = "/avatars/avatar-punk.svg";
const avatarShadow = "/avatars/avatar-shadow.svg";
const avatarWarrior = "/avatars/avatar-warrior.svg";
const avatarWitch = "/avatars/avatar-witch.svg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface AvatarCategory {
  label: string;
  avatars: { id: string; src: string; label: string }[];
}

const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    label: "🎬 Filmes",
    avatars: [
      { id: "space-explorer", src: avatarSpaceExplorer, label: "Explorador" },
      { id: "detective", src: avatarDetective, label: "Detetive" },
      { id: "superhero", src: avatarSuperhero, label: "Herói" },
      { id: "pirate", src: avatarPirate, label: "Pirata" },
      { id: "wizard", src: avatarWizard, label: "Mago" },
      { id: "racer", src: avatarRacer, label: "Piloto" },
      { id: "zombie", src: avatarZombie, label: "Zumbi" },
      { id: "princess", src: avatarPrincess, label: "Princesa" },
    ],
  },
  {
    label: "🎌 Anime",
    avatars: [
      { id: "anime-warrior", src: avatarAnimeWarrior, label: "Guerreiro" },
      { id: "anime-girl", src: avatarAnimeGirl, label: "Kawaii" },
      { id: "samurai", src: avatarSamurai, label: "Samurai" },
      { id: "vampire", src: avatarVampire, label: "Vampiro" },
      { id: "ninja", src: avatarNinja, label: "Ninja" },
    ],
  },
  {
    label: "🐾 Clássicos",
    avatars: [
      { id: "robot", src: avatarRobot, label: "Robô" },
      { id: "cat", src: avatarCat, label: "Gato" },
      { id: "fox", src: avatarFox, label: "Raposa" },
      { id: "astronaut", src: avatarAstronaut, label: "Astronauta" },
      { id: "panda", src: avatarPanda, label: "Panda" },
      { id: "eagle", src: avatarEagle, label: "Águia" },
      { id: "unicorn", src: avatarUnicorn, label: "Unicórnio" },
    ],
  },
];

const getAvatarPublicUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;

type ScreenMode = "select" | "create" | "edit" | "pick-avatar";

const ProfileSelect = () => {
  const { user } = useAuth();
  const { profiles, loading, addProfile, removeProfile, updateProfile } = useProfiles();
  const navigate = useNavigate();

  const [mode, setMode] = useState<ScreenMode>("select");
  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarPickerFor, setAvatarPickerFor] = useState<"create" | "edit">("create");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-muted-foreground">Você precisa estar logado para gerenciar perfis.</p>
        <Button onClick={() => navigate("/login")} className="gradient-neon text-primary-foreground">Entrar</Button>
      </div>
    );
  }

  const currentAvatarSrc = customAvatarPreview || selectedAvatar;

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

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem válida"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx. 5MB)"); return; }
    setCustomAvatarFile(file);
    setSelectedAvatar(null);
    const reader = new FileReader();
    reader.onload = (e) => setCustomAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const selectPresetAvatar = (src: string) => {
    setSelectedAvatar(src);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
  };

  const resolveAvatarUrl = async (): Promise<string | null> => {
    if (customAvatarFile) {
      return await uploadAvatar(customAvatarFile);
    }
    return selectedAvatar;
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    const avatarUrl = await resolveAvatarUrl();
    await addProfile(newName.trim(), avatarUrl || undefined);
    resetState();
    toast.success("Perfil criado!");
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    const avatarUrl = await resolveAvatarUrl();
    await updateProfile(editingId, { name: editName.trim(), avatar_url: avatarUrl });
    resetState();
    toast.success("Perfil atualizado!");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir perfil "${name}"?`)) return;
    await removeProfile(id);
    toast.success("Perfil removido!");
  };

  const startCreate = () => {
    setNewName("");
    setSelectedAvatar(null);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
    setMode("create");
  };

  const startEdit = (p: { id: string; name: string; avatar_url: string | null }) => {
    setEditingId(p.id);
    setEditName(p.name);
    setSelectedAvatar(p.avatar_url);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
    setMode("edit");
  };

  const openAvatarPicker = (forMode: "create" | "edit") => {
    setAvatarPickerFor(forMode);
    setMode("pick-avatar");
  };

  const confirmAvatarPick = () => {
    setMode(avatarPickerFor);
  };

  const resetState = () => {
    setMode("select");
    setNewName("");
    setEditName("");
    setEditingId(null);
    setSelectedAvatar(null);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
    setSaving(false);
  };

  // ─── Profile Selection Screen (Netflix style) ───
  const renderSelectScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4"
    >
      <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-2 tracking-wider">
        Quem está assistindo?
      </h1>
      <p className="text-muted-foreground text-sm mb-10">Selecione um perfil</p>

      <div className="flex gap-4 sm:gap-6 flex-wrap justify-center mb-10">
        {profiles.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative group"
          >
            <button
              onClick={() => navigate("/")}
              className="flex flex-col items-center gap-3 group/btn"
            >
              <div className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-muted overflow-hidden border-2 border-transparent group-hover/btn:border-foreground transition-all duration-200">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-display text-primary bg-secondary">
                    {p.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground group-hover/btn:text-foreground transition-colors">{p.name}</span>
            </button>

            {/* Hover controls */}
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={() => startEdit(p)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {!p.is_default && (
                <button onClick={() => handleDelete(p.id, p.name)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Add profile */}
        {profiles.length < 5 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: profiles.length * 0.08 }}
            onClick={startCreate}
            className="flex flex-col items-center gap-3 group/add"
          >
            <div className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full border-2 border-muted-foreground/30 hover:border-foreground flex items-center justify-center transition-colors group-hover/add:border-foreground">
              <Plus className="w-10 h-10 text-muted-foreground/50 group-hover/add:text-foreground transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover/add:text-foreground transition-colors">Adicionar</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  // ─── Create / Edit Form ───
  const renderForm = (isEdit: boolean) => {
    const name = isEdit ? editName : newName;
    const setName = isEdit ? setEditName : setNewName;
    const onSave = isEdit ? handleUpdate : handleCreate;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[70vh] px-4"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 tracking-wider">
          {isEdit ? "Editar Perfil" : "Novo Perfil"}
        </h1>

        <div className="w-full max-w-md space-y-6">
          {/* Avatar preview + change button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => openAvatarPicker(isEdit ? "edit" : "create")}
              className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-full bg-muted overflow-hidden relative group/avatar border-2 border-border hover:border-foreground transition-colors"
            >
              {currentAvatarSrc ? (
                <img src={currentAvatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Pencil className="w-6 h-6 text-white" />
              </div>
            </button>
            <button
              onClick={() => openAvatarPicker(isEdit ? "edit" : "create")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Escolher avatar
            </button>
          </div>

          {/* Name input */}
          <div className="flex items-center gap-3">
            <Input
              placeholder="Nome do perfil"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              className="bg-secondary border-border/50 text-base h-12"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-4">
            <Button
              onClick={onSave}
              disabled={saving || !name.trim()}
              className="gradient-neon text-primary-foreground px-8 h-11"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                isEdit ? "Salvar" : "Criar Perfil"
              )}
            </Button>
            <Button variant="outline" onClick={resetState} className="px-8 h-11 border-muted-foreground/30 text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── Avatar Picker Screen ───
  const renderAvatarPicker = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center min-h-[70vh] px-4 pt-8"
    >
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-wider">
        Escolha seu avatar
      </h1>
      <p className="text-muted-foreground text-sm mb-8">Selecione um avatar ou envie sua foto</p>

      {/* Current selection preview */}
      <div className="w-[100px] h-[100px] rounded-full bg-muted overflow-hidden mb-8 border-2 border-primary">
        {currentAvatarSrc ? (
          <img src={currentAvatarSrc} alt="Selected" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Upload custom photo */}
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 mb-8 px-5 py-2.5 rounded-lg border border-dashed border-muted-foreground/40 hover:border-foreground text-muted-foreground hover:text-foreground transition-colors"
      >
        <Upload className="w-4 h-4" />
        <span className="text-sm">Enviar minha foto</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* Categorized avatar grid */}
      <div className="w-full max-w-lg space-y-6 mb-10 px-2">
        {AVATAR_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{cat.label}</h3>
            <div className="grid grid-cols-4 gap-3">
              {cat.avatars.map((av) => (
                <button
                  key={av.id}
                  onClick={() => selectPresetAvatar(av.src)}
                  className={`aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                    selectedAvatar === av.src && !customAvatarPreview
                      ? "border-primary ring-2 ring-primary/40 scale-105"
                      : "border-transparent hover:border-muted-foreground/40"
                  }`}
                >
                  <img src={av.src} alt={av.label} className="w-full h-full object-cover bg-muted" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm */}
      <div className="flex gap-3">
        <Button
          onClick={confirmAvatarPick}
          className="gradient-neon text-primary-foreground px-8 h-11"
        >
          <Check className="w-4 h-4 mr-2" /> Confirmar
        </Button>
        <Button
          variant="outline"
          onClick={() => setMode(avatarPickerFor)}
          className="px-8 h-11 border-muted-foreground/30 text-muted-foreground hover:text-foreground"
        >
          Voltar
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {mode === "select" && renderSelectScreen()}
          {mode === "create" && renderForm(false)}
          {mode === "edit" && renderForm(true)}
          {mode === "pick-avatar" && renderAvatarPicker()}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ProfileSelect;
