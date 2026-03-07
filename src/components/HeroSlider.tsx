import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Movie } from "@/data/movies";

interface HeroSliderProps {
  movies: Movie[];
}

const HeroSlider = ({ movies }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [movies.length]);

  const movie = movies[current];

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={movie.backdrop}
            alt={movie.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--gradient-hero)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1 text-accent">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">{movie.rating}</span>
              </span>
              <span className="text-muted-foreground text-sm">{movie.year}</span>
              <span className="text-muted-foreground text-sm">{movie.duration}</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-foreground mb-3 tracking-wide">
              {movie.title.toUpperCase()}
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm md:text-base line-clamp-2 mb-5">
              {movie.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-sm transition-all"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Play className="h-4 w-4 fill-current text-primary-foreground" />
                <span className="text-primary-foreground">Assistir Agora</span>
              </button>
              <button
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm hover:bg-secondary transition-all"
              >
                Mais Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-6 right-6 md:right-12 flex gap-2">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-primary" : "w-4 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
