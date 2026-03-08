import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { movies } from "@/data/movies";
import MovieCard from "@/components/MovieCard";


const SearchPage = () => {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? movies.filter(
        (m) =>
          m.title.toLowerCase().includes(query.toLowerCase()) ||
          m.director.toLowerCase().includes(query.toLowerCase()) ||
          m.genre.some((g) => g.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-6">
        <h1 className="font-display text-3xl text-foreground tracking-wider mb-6">BUSCAR FILMES</h1>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar filmes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full bg-secondary border-none pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="px-4">
        {query.trim() === "" ? (
          <div className="text-center py-20">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Pesquise seus filmes favoritos</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">Nenhum resultado para "{query}"</p>
          </div>
        ) : (
          <>
            <p className="text-foreground font-semibold text-sm mb-4">Resultados para "{query}"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((movie) => (
                <MovieCard key={movie.id} movie={movie} variant="grid" />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;
