import { useState } from "react";
import { motion } from "framer-motion";
import { useCatalog } from "@/hooks/useCatalog";
import { useSections } from "@/hooks/useSections";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useWatchedMovies } from "@/hooks/useWatchedMovies";
import MovieCard from "@/components/MovieCard";
import HomeSection from "@/components/HomeSection";
import ContinueWatchingSection from "@/components/ContinueWatchingSection";
import RecentlyWatchedSection from "@/components/RecentlyWatchedSection";
import HeroSlider from "@/components/HeroSlider";
import Navbar from "@/components/Navbar";


const Index = () => {
  const { items: catalogItems, loading: catalogLoading } = useCatalog();
  const { continueWatching } = useWatchProgress();
  const { watchedMovies } = useWatchedMovies();
  const { sections, loading: sectionsLoading } = useSections();

  // Unique genres from catalog
  const catalogGenres = Array.from(new Set(catalogItems.flatMap((i) => i.genres || [])));
  const allGenres = ["Todos", ...catalogGenres];
  const [catalogGenreFilter, setCatalogGenreFilter] = useState("Todos");

  const filteredCatalog = catalogGenreFilter === "Todos"
    ? catalogItems
    : catalogItems.filter((i) => i.genres?.includes(catalogGenreFilter));

  // Items with images for the hero slider
  const heroItems = catalogItems.filter((i) => i.imageUrl);

  if (catalogLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Logo Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4">
        <h2 className="font-display text-lg sm:text-2xl text-primary tracking-widest">CINE CLOUD</h2>
      </div>

      {/* Hero */}
      <HeroSlider items={heroItems.length > 0 ? heroItems : catalogItems.slice(0, 5)} />

      {/* Continue Watching */}
      <ContinueWatchingSection items={continueWatching} />

      {/* Catalog sections from DB */}
      {!sectionsLoading && sections.length > 0 && (
        <div>
          {sections.map((section) => (
            <HomeSection key={section.id} section={section} catalogItems={catalogItems} />
          ))}
        </div>
      )}

      {/* Genre Filter */}
      {catalogGenres.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setCatalogGenreFilter(genre)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
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

      {/* Catálogo */}
      <section className="px-4 mb-8">
        <h2 className="font-display text-lg sm:text-2xl text-foreground mb-4 tracking-wider">CATÁLOGO</h2>
        {filteredCatalog.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum título no catálogo ainda. Adicione pelo painel Admin.</p>
        ) : (
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
        )}
      </section>

      
    </div>
  );
};

export default Index;
