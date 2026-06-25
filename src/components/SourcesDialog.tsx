import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Play, ExternalLink, Puzzle, AlertCircle } from "lucide-react";
import { useAddons, StreamSource } from "@/hooks/useAddons";
import { useTmdbSearch } from "@/hooks/useTmdbSearch";
import { useCatalog } from "@/hooks/useCatalog";
import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  catalogId?: string;
  imdbId?: string | null;
  type: "movie" | "series";
  season?: number;
  episode?: number;
  title?: string;
  year?: string;
  sourceAddonId?: string;
  onPick: (source: StreamSource) => void;
}

const SourcesDialog = ({ open, onOpenChange, catalogId, imdbId, type, season, episode, title, year, sourceAddonId, onPick }: Props) => {
  const { addons, fetchStreams } = useAddons();
  const { search, getDetails } = useTmdbSearch();
  const { updateItem } = useCatalog();
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [streams, setStreams] = useState<StreamSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resolvedImdb, setResolvedImdb] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setStreams([]);

      let effectiveImdb = imdbId || resolvedImdb;

      // Auto-resolve IMDB ID from TMDB if missing
      if (!effectiveImdb && title) {
        setResolving(true);
        try {
          const tmdbType = type === "movie" ? "movie" : "tv";
          const q = year ? `${title} ${year}` : title;
          const results = await search(q);
          const match =
            results.find((r) => r.mediaType === tmdbType && (!year || r.year === year)) ||
            results.find((r) => r.mediaType === tmdbType) ||
            results[0];
          if (match) {
            const detail = await getDetails(match.id, match.mediaType);
            if (detail?.imdbId && !cancelled) {
              effectiveImdb = detail.imdbId;
              setResolvedImdb(detail.imdbId);
              if (catalogId) {
                updateItem(catalogId, { imdbId: detail.imdbId }).catch(() => {});
              }
            }
          }
        } catch {
          /* ignore — show no-imdb message below */
        } finally {
          if (!cancelled) setResolving(false);
        }
      }

      if (!effectiveImdb) {
        if (!cancelled) {
          setError("Não foi possível identificar o IMDB ID deste título.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetchStreams(effectiveImdb, type, season, episode);
        if (!cancelled) setStreams(res.streams);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Falha ao buscar fontes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imdbId, type, season, episode, title, year, catalogId]);

  const grouped = streams.reduce<Record<string, StreamSource[]>>((acc, s) => {
    (acc[s.addonName] ||= []).push(s);
    return acc;
  }, {});

  const enabledAddons = addons.filter((a) => a.enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary" />
            Fontes {title ? `— ${title}` : ""}
          </DialogTitle>
        </DialogHeader>

        {enabledAddons.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Puzzle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhum addon ativo. <Link to="/addons" className="text-primary hover:underline">Configurar addons</Link>
          </div>
        )}

        {enabledAddons.length > 0 && (loading || resolving) && (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            {resolving
              ? "Identificando título via TMDB…"
              : `Consultando ${enabledAddons.length} addon${enabledAddons.length !== 1 ? "s" : ""}…`}
          </div>
        )}

        {enabledAddons.length > 0 && !loading && !resolving && error && (
          <div className="py-8 text-center text-sm text-destructive flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            {error}
          </div>
        )}

        {enabledAddons.length > 0 && !loading && !resolving && !error && streams.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma fonte encontrada nos addons ativos.
          </div>
        )}

        {!loading && !resolving && streams.length > 0 && (
          <div className="space-y-4">
            {Object.entries(grouped).map(([addonName, list]) => (
              <div key={addonName}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {addonName} ({list.length})
                </h3>
                <div className="space-y-1.5">
                  {list.map((s, i) => {
                    const isDirect = s.url && /^https?:\/\//i.test(s.url);
                    return (
                      <button
                        key={`${s.addonId}-${i}`}
                        onClick={() => onPick(s)}
                        disabled={!s.url}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-secondary/40 hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20">
                          {isDirect ? (
                            <Play className="w-4 h-4 text-primary" />
                          ) : (
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground line-clamp-1">{s.name}</div>
                          {s.title && (
                            <div className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3 mt-0.5">
                              {s.title}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SourcesDialog;
