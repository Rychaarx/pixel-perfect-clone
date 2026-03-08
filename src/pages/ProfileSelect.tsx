import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useNavigate } from "react-router-dom";

const ProfileSelect = () => {
  const { user } = useAuth();
  const { profiles } = useProfiles(user?.id);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <h1 className="font-display text-2xl font-bold text-foreground mb-10">Quem está assistindo?</h1>
      <div className="flex gap-6 flex-wrap justify-center">
        {profiles.map((p) => (
          <button key={p.id} onClick={() => navigate("/")} className="flex flex-col items-center gap-3 group">
            <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center text-3xl font-display text-primary group-hover:ring-2 ring-primary transition-all overflow-hidden">
              {p.avatar_url ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" /> : p.name[0]}
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileSelect;
