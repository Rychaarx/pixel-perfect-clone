import { useState } from "react";
import { motion } from "framer-motion";
import { useCatalog } from "@/hooks/useCatalog";
import { useSections } from "@/hooks/useSections";
import MovieCard from "@/components/MovieCard";
import HomeSection from "@/components/HomeSection";
import HeroSlider from "@/components/HeroSlider";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { movies, genres, getMoviesByGenre, getFeaturedMovies } from "@/data/movies";

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const filteredMovies = getMoviesByGenre(selectedGenre);
  const featured = getFeaturedMovies();
  const { items: catalogItems, loading: catalogLoading } = useCatalog();
  const { sections, loading: sectionsLoading } = useSections();

  // Unique genres from catalog
  const catalogGenres = Array.from(new Set(catalogItems.flatMap((i) => i.genres || [])));
  const allGenres = ["Todos", ...catalogGenres];
  const [catalogGenreFilter, setCatalogGenreFilter] = useState("Todos");

  const filteredCatalog = catalogGenreFilter === "Todos"
    ? catalogItems
    : catalogItems.filter((i) => i.genres?.includes(catalogGenreFilter));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Logo Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4">
        <h2 className="font-display text-2xl text-primary tracking-widest">CINE CLOUD</h2>
      </div>

      {/* Hero */}
      <HeroSlider movies={featured} />

      {/* Catalog sections from DB */}
      {!sectionsLoading && !catalogLoading && sections.length > 0 && (
        <div>
          {sections.map((section) => (
            <HomeSection key={section.id} section={section} catalogItems={catalogItems} />
          ))}
        </div>
      )}

      {/* Catálogo do banco */}
      {!catalogLoading && catalogItems.length > 0 && (
        <>
          {/* Genre Filter for catalog */}
          {catalogGenres.length > 0 && (
            <div className="px-4 py-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {allGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setCatalogGenreFilter(genre)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      catalogGenreFilter === genre
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <section className="px-4 mb-8">
            <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">CATÁLOGO</h2>
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {filteredCatalog.map((item, idx) => (
                <MovieCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  poster={item.imageUrl || ""}
                  status={item.status}
                  type={item.type}
                  index={idx}
                />
              ))}
            </motion.div>
          </section>
        </>
      )}

      {/* Static data sections */}
      <section className="px-4 mb-8">
        <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">EM ALTA</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {movies.slice(0, 5).map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} variant="trending" index={i} />
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Index;
