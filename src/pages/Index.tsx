import { useState } from "react";
import { motion } from "framer-motion";
import { movies, genres, getMoviesByGenre, getFeaturedMovies } from "@/data/movies";
import MovieCard from "@/components/MovieCard";
import HeroSlider from "@/components/HeroSlider";
import Navbar from "@/components/Navbar";

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const filteredMovies = getMoviesByGenre(selectedGenre);
  const featured = getFeaturedMovies();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Logo Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4">
        <h2 className="font-display text-2xl text-primary tracking-widest">CINE CLOUD</h2>
      </div>

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
              {genre === "All" ? "Todos" : genre}
            </button>
          ))}
        </div>
      </div>

      {/* Em Alta */}
      <section className="px-4 mb-8">
        <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">EM ALTA</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {movies.slice(0, 5).map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} variant="trending" index={i} />
          ))}
        </div>
      </section>

      {/* Browse */}
      <section className="px-4 mb-8">
        <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">
          {selectedGenre === "All" ? "TODOS OS FILMES" : selectedGenre.toUpperCase()}
        </h2>
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} variant="grid" />
          ))}
        </motion.div>
      </section>

      {/* Adicionados Recentemente */}
      <section className="px-4 mb-8">
        <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">ADICIONADOS RECENTEMENTE</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[...movies].sort((a, b) => b.rating - a.rating).slice(0, 5).map((movie) => (
            <MovieCard key={movie.id} movie={movie} variant="rated" />
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Index;
