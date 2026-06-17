import { useState, useMemo } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check, Loader2, Film, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const isValidUrl = (url: string) => {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const MissingVideosPanel = () => {
  const { items, updateItem } = useCatalog();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const missing = useMemo(
    () => items.filter((i) => !i.videoUrl && !i.redirectUrl),
    [items]
  );

  if (missing.length === 0) return null;

  const handleSave = async (id: string, title: string) => {
    const raw = (drafts[id] || "").trim();
    if (!raw) {
      toast.error("Cole uma URL primeiro");
      return;
    }
    if (!isValidUrl(raw)) {
      toast.error("URL inválida — use http(s)://");
      return;
    }
    setSavingId(id);
    try {
      // YouTube/Vimeo/etc. go to videoUrl (trailer iframe).
      // Direct video files (.mp4/.webm/etc.) or storage links go to redirectUrl (full player).
      const isDirect =
        /\.(mp4|webm|ogg|mov|mkv|avi|m3u8)(\?.*)?$/i.test(raw) ||
        raw.includes("/storage/v1/object/");
      const payload = isDirect ? { redirectUrl: raw } : { videoUrl: raw };
      await updateItem(id, payload);
      setDrafts((d) => {
        const n = { ...d };
        delete n[id];
        return n;
      });
      toast.success(`"${title}" atualizado!`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Falha ao salvar");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="glass rounded-xl border border-amber-500/30 p-4 space-y-3">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="font-display text-sm font-bold text-foreground">
            Vídeos faltando ({missing.length})
          </h3>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {!collapsed && (
        <>
          <p className="text-xs text-muted-foreground">
            Cole uma URL (YouTube, Vimeo, ou link direto .mp4/.webm) e clique salvar. A
            página do título é atualizada automaticamente.
          </p>
          <div className="space-y-2">
            {missing.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30"
              >
                <div className="flex items-center gap-2 sm:w-56 shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-8 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center">
                      <Film className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.type} {item.year ? `· ${item.year}` : ""}
                    </p>
                  </div>
                </div>
                <Input
                  placeholder="https://youtu.be/... ou https://.../video.mp4"
                  value={drafts[item.id] || ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(item.id, item.title);
                  }}
                  className="flex-1 bg-secondary/50 border-border/50 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(item.id, item.title)}
                  disabled={savingId === item.id || !drafts[item.id]?.trim()}
                  className="gradient-neon text-primary-foreground gap-1 shrink-0"
                >
                  {savingId === item.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Salvar
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MissingVideosPanel;
