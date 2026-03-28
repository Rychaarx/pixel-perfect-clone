import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Star, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { movies, genres, getMoviesByGenre, getFeaturedMovies } from "@/data/movies";
import MovieCard from "@/components/MovieCard";
import HeroSlider from "@/components/HeroSlider";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const filteredMovies = getMoviesByGenre(selectedGenre);
  const featured = getFeaturedMovies();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <HeroSlider movies={featured} />

      {/* Genre Filter */}
      <div className="px-4 py-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedGenre === genre
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
