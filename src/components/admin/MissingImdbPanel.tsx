import { useMemo, useState } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { useTmdbSearch } from "@/hooks/useTmdbSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check, Loader2, Film, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";

const isValidImdb = (s: string) => /^tt\d{5,}$/.test(s.trim());

const MissingImdbPanel = () => {
  const { items, updateItem } = useCatalog();
  const { search: tmdbSearch, getDetails } = useTmdbSearch();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lookupId, setLookupId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const missing = useMemo(() => items.filter((i) => !i.imdbId), [items]);
  if (missing.length === 0) return null;

  const handleSave = async (id: string, title: string, value: string) => {
    const v = value.trim();
    if (!isValidImdb(v)) {
      toast.error("IMDB ID inválido (formato: tt1234567)");
      return;
    }
    setSavingId(id);
    try {
      await updateItem(id, { imdbId: v });
      setDrafts((d) => {
        const n = { ...d };
        delete n[id];
        return n;
      });
      toast.success(`"${title}" → ${v}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar");
    } finally {
      setSavingId(null);
    }
  };

  const handleLookup = async (id: string, title: string, type: string) => {
    setLookupId(id);
    try {
      const results = await tmdbSearch(title);
      const wanted = type === "Filme" ? "movie" : "tv";
      const match = results.find((r: any) => r.mediaType === wanted) || results[0];
      if (!match) {
        toast.error("Nada encontrado no TMDB");
        return;
      }
      const detail = await getDetails(match.id, match.mediaType);
      if (detail?.imdbId) {
        setDrafts((d) => ({ ...d, [id]: detail.imdbId! }));
        toast.success(`Encontrado: ${detail.imdbId}`);
      } else {
        toast.error("TMDB não retornou IMDB ID");
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha na busca");
    } finally {
      setLookupId(null);
    }
  };

  return (
    <div className="glass rounded-xl border border-blue-500/30 p-4 space-y-3">
      <button onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <h3 className="font-display text-sm font-bold text-foreground">IMDB ID faltando ({missing.length})</h3>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>
      {!collapsed && (
        <>
          <p className="text-xs text-muted-foreground">
            Necessário para os addons buscarem fontes. Clique em "Buscar TMDB" para preencher automático.
          </p>
          <div className="space-y-2">
            {missing.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2 sm:w-56 shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-8 h-12 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center">
                      <Film className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type} {item.year ? `· ${item.year}` : ""}</p>
                  </div>
                </div>
                <Input
                  placeholder="tt1234567"
                  value={drafts[item.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(item.id, item.title, drafts[item.id] || "");
                  }}
                  className="flex-1 bg-secondary/50 border-border/50 text-xs"
                />
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLookup(item.id, item.title, item.type)}
                    disabled={lookupId === item.id}
                    title="Buscar no TMDB"
                  >
                    {lookupId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(item.id, item.title, drafts[item.id] || "")}
                    disabled={savingId === item.id || !drafts[item.id]?.trim()}
                    className="gradient-neon text-primary-foreground gap-1"
                  >
                    {savingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MissingImdbPanel;
