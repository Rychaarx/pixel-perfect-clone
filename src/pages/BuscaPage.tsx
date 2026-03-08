import { useState } from "react";
import { Search as SearchIcon, X, Filter } from "lucide-react";
import { useCatalog, CatalogItem, statusConfig } from "@/hooks/useCatalog";
import MovieCard from "@/components/MovieCard";
import Navbar from "@/components/Navbar";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BuscaPage = () => {
  const { items, loading } = useCatalog();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 neon-text">Buscar</h1>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título, gênero ou sinopse..."
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

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <SearchIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              {query || filterType !== "all" || filterStatus !== "all"
                ? "Nenhum resultado encontrado"
                : "Pesquise títulos do catálogo"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{filtered.length} título{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
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
          </>
        )}
      </div>
      
    </div>
  );
};

export default BuscaPage;
