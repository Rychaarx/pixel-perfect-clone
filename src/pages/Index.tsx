import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useSections } from "@/hooks/useSections";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useWatchedMovies } from "@/hooks/useWatchedMovies";
import { useFavorites } from "@/hooks/useFavorites";
import MovieCard from "@/components/MovieCard";
import HomeSection from "@/components/HomeSection";
import ContinueWatchingSection from "@/components/ContinueWatchingSection";
import RecentlyWatchedSection from "@/components/RecentlyWatchedSection";
import FavoritesSection from "@/components/FavoritesSection";
import HeroSlider from "@/components/HeroSlider";
import Navbar from "@/components/Navbar";

const Index = () => {
  const { items: catalogItems, loading: catalogLoading } = useCatalog();
  const { continueWatching } = useWatchProgress();
  const { watchedMovies } = useWatchedMovies();
  const { favorites } = useFavorites();
  const { sections, loading: sectionsLoading } = useSections();

  const scrollRef = useRef<HTMLDivElement>(null);

  const catalogGenres = Array.from(new Set(catalogItems.flatMap((i) => i.genres || [])));
  const allGenres = ["Todos", ...catalogGenres];
  const [catalogGenreFilter, setCatalogGenreFilter] = useState("Todos");

  const filteredCatalog = catalogGenreFilter === "Todos"
    ? catalogItems
    : catalogItems.filter((i) => i.genres?.includes(catalogGenreFilter));

  const heroItems = catalogItems.filter((i) => i.imageUrl);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

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

      {/* Catálogo em Carrossel */}
      <section className="py-6 md:py-10 px-4 sm:px-6 mb-4">
        <div className="w-full max-w-[1320px] mx-auto">
          <div className="flex items-center gap-3 mb-5 md:mb-8">
            <h2 className="font-display text-base md:text-xl font-bold text-foreground">CATÁLOGO</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">
              {filteredCatalog.length} {filteredCatalog.length === 1 ? "título" : "títulos"}
            </span>
          </div>

          {filteredCatalog.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum título no catálogo ainda. Adicione pelo painel Admin.
            </p>
          ) : (
            <div className="relative group">
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div
                ref={scrollRef}
                className="flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {filteredCatalog.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="min-w-[42vw] max-w-[42vw] md:min-w-[200px] md:max-w-[200px] lg:min-w-[210px] lg:max-w-[210px] xl:min-w-[220px] xl:max-w-[220px] snap-start shrink-0"
                  >
                    <MovieCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      poster={item.imageUrl || ""}
                      status={item.status}
                      type={item.type}
                      index={idx}
                    />
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Favorites */}
      <FavoritesSection items={favorites} />

      {/* Continue Watching */}
      <ContinueWatchingSection items={continueWatching} />

      {/* Recently Watched */}
      <RecentlyWatchedSection items={watchedMovies} />

      {/* Sections do banco */}
      {!sectionsLoading && sections.length > 0 && (
        <div>
          {sections.map((section) => (
            <HomeSection key={section.id} section={section} catalogItems={catalogItems} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
