import { useEffect, useState, useCallback } from "react";
import { Loader2, Puzzle, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SourcesDialog from "@/components/SourcesDialog";
import { StreamSource } from "@/hooks/useAddons";
import { toast } from "sonner";

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

const AddonsCatalog = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<AddonCatalogs[]>([]);
  const [items, setItems] = useState<Record<string, CatalogItem[]>>({});
  const [loadingKey, setLoadingKey] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<CatalogItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?redirect=/catalogos", { replace: true });
  }, [authLoading, user, navigate]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("stremio-catalog", { body: { action: "list" } });
    if (error) toast.error(error.message);
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

  // Eagerly load all catalogs once we have the list
  useEffect(() => {
    groups.forEach((g) => g.catalogs.slice(0, 3).forEach((c) => loadCatalog(g, c)));
  }, [groups, loadCatalog]);

  const handlePlay = (item: CatalogItem) => {
    setPicked(item);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-neon flex items-center justify-center neon-glow">
            <Puzzle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold neon-text">Catálogos dos Addons</h1>
            <p className="text-muted-foreground text-sm">Navegue pelos catálogos dos seus addons ativos</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nenhum catálogo disponível. Verifique se há addons ativos com catálogos em <button onClick={() => navigate("/addons")} className="text-primary hover:underline">/addons</button>.
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.addonId}>
                <div className="flex items-center gap-2 mb-4">
                  {g.addonLogo ? (
                    <img src={g.addonLogo} alt="" className="w-6 h-6 rounded" />
                  ) : (
                    <Puzzle className="w-5 h-5 text-primary" />
                  )}
                  <h2 className="text-lg font-semibold text-foreground">{g.addonName}</h2>
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
                            <button
                              onClick={() => loadCatalog(g, c)}
                              className="text-xs text-primary hover:underline"
                            >
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
                                onClick={() => handlePlay(it)}
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
          </div>
        )}
      </div>

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

export default AddonsCatalog;
