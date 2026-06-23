import { useState, useEffect } from "react";
import { Search as SearchIcon, X, Play, Puzzle, Loader2 } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useTmdbSearch, TmdbSearchResult } from "@/hooks/useTmdbSearch";
import { useAddons, StreamSource } from "@/hooks/useAddons";
import MovieCard from "@/components/MovieCard";
import Navbar from "@/components/Navbar";
import SourcesDialog from "@/components/SourcesDialog";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BuscaPage = () => {
  const { items, loading } = useCatalog();
  const { addons } = useAddons();
  const { search, loading: tmdbLoading } = useTmdbSearch();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [picked, setPicked] = useState<TmdbSearchResult | null>(null);
  const [externalSrc, setExternalSrc] = useState<string | null>(null);

  const hasEnabledAddons = addons.some((a) => a.enabled);

  // Debounced TMDB search whenever query changes (and addons are configured)
  useEffect(() => {
    if (!hasEnabledAddons || !query.trim()) {
      setTmdbResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await search(query.trim());
      setTmdbResults(res);
    }, 400);
    return () => clearTimeout(t);
  }, [query, hasEnabledAddons, search]);

  const filtered = items.filter((item) => {
    const matchQuery =
      !query.trim() ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.genres?.some((g) => g.toLowerCase().includes(query.toLowerCase())) ||
      item.synopsis?.toLowerCase().includes(query.toLowerCase());
    const matchType = filterType === "all" || item.type === filterType;
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    return matchQuery && matchType && matchStatus;
  });

  const handlePick = (s: StreamSource) => {
    if (!s.url) return;
    setPicked(null);
    if (/^https?:\/\//i.test(s.url)) {
      // Open all sources in a new tab — keeps logic simple outside the catalog player
      window.open(s.url, "_blank");
    }
    setExternalSrc(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 neon-text">Buscar</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={hasEnabledAddons ? "Buscar qualquer filme/série via addons…" : "Buscar no catálogo…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg bg-secondary/50 border border-border/50 pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-28 bg-secondary/50 border-border/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Filme">Filmes</SelectItem>
                <SelectItem value="Série">Séries</SelectItem>
                <SelectItem value="Anime">Animes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 bg-secondary/50 border-border/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                <SelectItem value="concluido">✅ Concluído</SelectItem>
                <SelectItem value="em_espera">⏳ Em Espera</SelectItem>
                <SelectItem value="na_lista">📝 Na Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Catalog results */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              No seu catálogo ({filtered.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
              {filtered.map((item, idx) => (
                <MovieCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  poster={item.imageUrl || ""}
                  status={item.status}
                  type={item.type}
                  redirectUrl={item.redirectUrl || ""}
                  index={idx}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Addon / TMDB results */}
        {hasEnabledAddons ? (
          query.trim() && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-primary" />
                Via Addons {tmdbResults.length > 0 && `(${tmdbResults.length})`}
              </h2>

              {tmdbLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                  <Loader2 className="w-4 h-4 animate-spin" /> Buscando no TMDB…
                </div>
              ) : tmdbResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">Nenhum resultado no TMDB para "{query}".</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
                  {tmdbResults.map((r) => (
                    <button
                      key={`${r.mediaType}-${r.id}`}
                      onClick={() => setPicked(r)}
                      className="group text-left"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary/40 border border-border/30 hover:border-primary/50 transition-colors">
                        {r.posterUrl ? (
                          <img src={r.posterUrl} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem poster</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                          <span className="flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-full">
                            <Play className="w-3 h-3 fill-current" /> Fontes
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-foreground line-clamp-1">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.year} • {r.mediaType === "movie" ? "Filme" : r.isAnime ? "Anime" : "Série"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        ) : (
          query.trim() &&
          filtered.length === 0 && (
            <div className="text-center py-16">
              <Puzzle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Nenhum resultado e nenhum addon configurado.
              </p>
              <Link to="/addons" className="text-primary text-sm hover:underline">
                Configurar addons →
              </Link>
            </div>
          )
        )}

        {!query.trim() && filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <SearchIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              {hasEnabledAddons
                ? "Digite o nome de um filme ou série para buscar via addons."
                : "Pesquise títulos do catálogo."}
            </p>
          </div>
        )}
      </div>

      <SourcesDialog
        open={!!picked}
        onOpenChange={(o) => !o && setPicked(null)}
        type={picked?.mediaType === "movie" ? "movie" : "series"}
        title={picked?.title}
        year={picked?.year}
        onPick={handlePick}
      />
    </div>
  );
};

export default BuscaPage;
