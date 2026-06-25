import { useEffect, useState, useCallback } from "react";
import { Loader2, Puzzle, Play, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SourcesDialog from "@/components/SourcesDialog";
import { StreamSource } from "@/hooks/useAddons";
import { toast } from "sonner";

const isDirectVideo = (url: string) =>
  /\.(mp4|webm|ogg|mov|mkv|avi|m3u8)(\?.*)?$/i.test(url) || url.includes("/storage/v1/object/");
const isEmbeddable = (url: string) => /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i.test(url);
const toEmbedUrl = (url: string) => {
  const ytShort = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;
  const ytWatch = url.match(/youtube\.com\/watch\?[^#]*v=([A-Za-z0-9_-]{6,})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
};

interface CatalogDef {
  type: string;
  id: string;
  name: string;
  genres: string[];
}
interface AddonCatalogs {
  addonId: string;
  addonName: string;
  addonLogo: string | null;
  transport_url: string;
  catalogs: CatalogDef[];
}
interface CatalogItem {
  id: string;
  type: string;
  name: string;
  poster: string | null;
  description: string | null;
  releaseInfo: string | null;
}

const AddonCatalogsHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<AddonCatalogs[]>([]);
  const [items, setItems] = useState<Record<string, CatalogItem[]>>({});
  const [loadingKey, setLoadingKey] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<CatalogItem | null>(null);
  const [playing, setPlaying] = useState<{ src: string; title: string } | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("stremio-catalog", { body: { action: "list" } });
    setGroups((data as any)?.addons ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchList();
  }, [user, fetchList]);

  const loadCatalog = useCallback(async (addon: AddonCatalogs, cat: CatalogDef) => {
    const key = `${addon.addonId}:${cat.type}:${cat.id}`;
    if (items[key] || loadingKey.has(key)) return;
    setLoadingKey((s) => new Set(s).add(key));
    const { data } = await supabase.functions.invoke("stremio-catalog", {
      body: { action: "fetch", addonId: addon.addonId, type: cat.type, id: cat.id },
    });
    setItems((prev) => ({ ...prev, [key]: (data as any)?.items ?? [] }));
    setLoadingKey((s) => {
      const n = new Set(s);
      n.delete(key);
      return n;
    });
  }, [items, loadingKey]);

  useEffect(() => {
    groups.forEach((g) => g.catalogs.slice(0, 3).forEach((c) => loadCatalog(g, c)));
  }, [groups, loadCatalog]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="px-4 md:px-12 py-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Carregando catálogos dos addons…
      </div>
    );
  }
  if (groups.length === 0) return null;

  return (
    <div className="px-4 md:px-12 py-6 space-y-10">
      {groups.map((g) => (
        <section key={g.addonId}>
          <div className="flex items-center gap-2 mb-4">
            {g.addonLogo ? (
              <img src={g.addonLogo} alt="" className="w-6 h-6 rounded" />
            ) : (
              <Puzzle className="w-5 h-5 text-primary" />
            )}
            <h2 className="font-display text-lg md:text-xl text-foreground tracking-wide">
              {g.addonName.toUpperCase()}
            </h2>
          </div>
          <div className="space-y-8">
            {g.catalogs.map((c) => {
              const key = `${g.addonId}:${c.type}:${c.id}`;
              const list = items[key];
              const isLoading = loadingKey.has(key);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground/90">
                      {c.name} <span className="text-xs text-muted-foreground">· {c.type}</span>
                    </h3>
                    {!list && !isLoading && (
                      <button onClick={() => loadCatalog(g, c)} className="text-xs text-primary hover:underline">
                        Carregar
                      </button>
                    )}
                  </div>
                  {isLoading ? (
                    <div className="flex gap-3 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-32 h-48 rounded-lg bg-secondary/40 animate-pulse flex-shrink-0" />
                      ))}
                    </div>
                  ) : list && list.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Vazio.</p>
                  ) : list ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                      {list.map((it) => (
                        <button
                          key={it.id}
                          onClick={() => setPicked(it)}
                          className="group w-32 flex-shrink-0 snap-start text-left"
                        >
                          <div className="relative w-32 h-48 rounded-lg overflow-hidden bg-secondary">
                            {it.poster ? (
                              <img
                                src={it.poster}
                                alt={it.name}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                                {it.name}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Play className="w-8 h-8 text-white fill-white" />
                            </div>
                          </div>
                          <div className="mt-1.5 text-xs text-foreground line-clamp-2">{it.name}</div>
                          {it.releaseInfo && (
                            <div className="text-[10px] text-muted-foreground">{it.releaseInfo}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {picked && (
        <SourcesDialog
          open={!!picked}
          onOpenChange={(o) => !o && setPicked(null)}
          imdbId={picked.id.startsWith("tt") ? picked.id.split(":")[0] : undefined}
          type={picked.type === "movie" ? "movie" : "series"}
          title={picked.name}
          year={picked.releaseInfo ?? undefined}
          onPick={(s: StreamSource) => {
            if (s.url) window.open(s.url, "_blank");
            setPicked(null);
          }}
        />
      )}
    </div>
  );
};

export default AddonCatalogsHome;
