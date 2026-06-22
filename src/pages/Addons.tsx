import { useState } from "react";
import { Plus, Trash2, Loader2, Puzzle, ExternalLink, Power, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAddons } from "@/hooks/useAddons";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SUGGESTED = [
  { name: "Torrentio", url: "https://torrentio.strem.fun/manifest.json", note: "Torrent/Debrid — configure no site para Real-Debrid/AllDebrid" },
  { name: "OpenSubtitles", url: "https://opensubtitles-v3.strem.io/manifest.json", note: "Legendas (não traz vídeo)" },
  { name: "WatchHub", url: "https://watchhub.strem.io/manifest.json", note: "Links de streaming oficiais (Netflix, Prime, etc)" },
];

const Addons = () => {
  const { user, loading: authLoading } = useAuth();
  const { addons, loading, addAddon, removeAddon, updateAddon } = useAddons();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  if (!authLoading && !user) {
    navigate("/login?redirect=/addons", { replace: true });
    return null;
  }

  const handleAdd = async (manifestUrl: string) => {
    if (!manifestUrl.trim()) {
      toast.error("Cole a URL do manifest");
      return;
    }
    setAdding(true);
    try {
      await addAddon(manifestUrl.trim());
      toast.success("Addon adicionado!");
      setUrl("");
    } catch (e: any) {
      toast.error(e.message || "Falha ao adicionar addon");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-neon flex items-center justify-center neon-glow">
            <Puzzle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold neon-text">Addons</h1>
            <p className="text-muted-foreground text-sm">Adicione fontes de stream estilo Stremio</p>
          </div>
        </div>

        <div className="glass rounded-xl border border-border/50 p-4 mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">URL do manifest.json</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.strem.io/manifest.json"
              className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              disabled={adding}
            />
            <Button onClick={() => handleAdd(url)} disabled={adding} className="gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Addons de torrent precisam de um serviço de debrid configurado na própria URL do addon.
          </p>
        </div>

        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Sugestões</h2>
        <div className="grid gap-2 mb-8">
          {SUGGESTED.map((s) => (
            <div key={s.url} className="glass rounded-lg border border-border/50 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-foreground">{s.name}</div>
                <div className="text-xs text-muted-foreground truncate">{s.note}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleAdd(s.url)} disabled={adding}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Seus addons ({addons.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : addons.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhum addon ainda. Adicione um acima.
          </div>
        ) : (
          <div className="space-y-2">
            {addons.map((a) => (
              <div key={a.id} className="glass rounded-xl border border-border/50 p-4 flex items-start gap-3">
                {a.logo_url ? (
                  <img src={a.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Puzzle className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{a.name}</span>
                    {!a.enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">desativado</span>
                    )}
                  </div>
                  {a.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {a.types.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {t}
                      </span>
                    ))}
                    {a.resources.map((r) => (
                      <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {r}
                      </span>
                    ))}
                  </div>
                  <a
                    href={a.manifest_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-muted-foreground/70 hover:text-primary mt-1.5 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> manifest
                  </a>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title={a.enabled ? "Desativar" : "Ativar"}
                    onClick={() => updateAddon(a.id, { enabled: !a.enabled })}
                  >
                    <Power className={`w-4 h-4 ${a.enabled ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Remover"
                    onClick={() => {
                      if (confirm(`Remover "${a.name}"?`)) removeAddon(a.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Addons;
