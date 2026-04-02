import { useState } from "react";
import { motion } from "framer-motion";
import { useCatalog } from "@/hooks/useCatalog";
import { useSections } from "@/hooks/useSections";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useWatchedMovies } from "@/hooks/useWatchedMovies";
import { useFavorites } from "@/hooks/useFavorites";
import HomeSection from "@/components/HomeSection";
import CatalogCarousel from "@/components/CatalogCarousel";
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

  // Items with images for the hero slider
  const heroItems = catalogItems.filter((i) => i.imageUrl);

  // Split catalog by type
  const movies = catalogItems.filter((i) => i.type === "Filme");
  const series = catalogItems.filter((i) => i.type === "Série");
  const animes = catalogItems.filter((i) => i.type === "Anime");

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

      {/* Catalog Carousels by Type */}
      <CatalogCarousel title="FILMES" emoji="🎬" items={movies} />
      <CatalogCarousel title="SÉRIES" emoji="📺" items={series} />
      <CatalogCarousel title="ANIMES" emoji="🎌" items={animes} />

      {/* Favorites */}
      <FavoritesSection items={favorites} />

      {/* Continue Watching */}
      <ContinueWatchingSection items={continueWatching} />

      {/* Recently Watched Movies */}
      <RecentlyWatchedSection items={watchedMovies} />

      {/* Catalog sections from DB */}
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
