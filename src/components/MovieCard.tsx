import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Sparkles, Film, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Movie } from "@/data/movies";
import type { CatalogStatus } from "@/hooks/useCatalog";

export interface MovieCardProps {
  // Legacy Movie-based usage
  movie?: Movie;
  variant?: "grid" | "trending" | "rated";
  // Catalog-based usage
  id?: string;
  title?: string;
  poster?: string;
  status?: CatalogStatus;
  type?: "Filme" | "Série" | "Anime";
  redirectUrl?: string;
  index?: number;
}

const MovieCard = (props: MovieCardProps) => {
  const navigate = useNavigate();
  const { movie, variant = "grid", index = 0 } = props;
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!props.id) return;
    const pos = parseFloat(localStorage.getItem(`video_position_${props.id}`) || "0");
    const dur = parseFloat(localStorage.getItem(`video_duration_${props.id}`) || "0");
    if (pos > 0 && dur > 0) {
      setProgressPercent(Math.min(100, (pos / dur) * 100));
    }
  }, [props.id]);

  // Catalog-based card
  if (!movie && props.id) {
    const handleClick = () => {
      navigate(`/titulo/${props.id}`);
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={handleClick}
        className={`cursor-pointer group ${props.type === "Anime" ? "anime-card" : props.type === "Série" ? "serie-card" : "filme-card"}`}
      >
        <div className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary transition-shadow duration-300 ${
          props.type === "Anime"
            ? "group-hover:shadow-[0_0_12px_rgba(236,72,153,0.4)] sm:group-hover:shadow-[0_0_20px_rgba(236,72,153,0.5),0_0_40px_rgba(236,72,153,0.2)]"
            : props.type === "Série"
            ? "group-hover:shadow-[0_0_12px_rgba(59,130,246,0.4)] sm:group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.2)]"
            : "group-hover:shadow-[0_0_12px_rgba(245,158,11,0.4)] sm:group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5),0_0_40px_rgba(245,158,11,0.2)]"
        }`} style={{ boxShadow: "var(--shadow-card)" }}>
          <img
            src={props.poster || "/placeholder.svg"}
            alt={props.title}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 sm:group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div className={`absolute inset-0 transition-opacity opacity-0 group-hover:opacity-100 ${
            props.type === "Anime"
              ? "bg-gradient-to-t from-pink-900/80 via-pink-500/10 to-transparent"
              : props.type === "Série"
              ? "bg-gradient-to-t from-blue-900/80 via-blue-500/10 to-transparent"
              : "bg-gradient-to-t from-amber-900/80 via-amber-500/10 to-transparent"
          }`} />
          {/* Neon border glow */}
          <div className={`absolute inset-0 rounded-lg border transition-all duration-300 pointer-events-none ${
            props.type === "Anime"
              ? "border-pink-500/0 group-hover:border-pink-500/40 sm:group-hover:border-pink-500/60"
              : props.type === "Série"
              ? "border-blue-500/0 group-hover:border-blue-500/40 sm:group-hover:border-blue-500/60"
              : "border-amber-500/0 group-hover:border-amber-500/40 sm:group-hover:border-amber-500/60"
          }`} />
          {/* Progress bar */}
          {progressPercent > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div
                className={`h-full transition-all ${
                  props.type === "Anime"
                    ? "bg-pink-500"
                    : props.type === "Série"
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
        <div className="mt-1.5 sm:mt-2">
          <h3 className="text-[11px] sm:text-sm font-medium text-foreground truncate">{props.title}</h3>
        </div>
      </motion.div>
    );
  }

  // Legacy Movie-based cards
  if (!movie) return null;

  if (variant === "trending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={() => navigate(`/movie/${movie.id}`)}
        className="relative flex-shrink-0 w-[280px] cursor-pointer group"
      >
        <div className="relative h-[160px] rounded-lg overflow-hidden">
          <img src={movie.backdrop} alt={movie.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute top-3 left-3 font-display text-5xl text-foreground/20">{index + 1}</div>
        </div>
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{movie.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5 text-accent"><Star className="h-3 w-3 fill-current" />{movie.rating}</span>
            <span>{movie.year}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "rated") {
    return (
      <div onClick={() => navigate(`/movie/${movie.id}`)} className="relative flex-shrink-0 w-[200px] cursor-pointer group">
        <div className="relative h-[300px] rounded-lg overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
            <div className="flex items-center gap-1 text-accent mb-1"><Star className="h-3 w-3 fill-current" /><span className="text-xs font-bold">{movie.rating}</span></div>
            <p className="text-xs text-foreground font-medium">{movie.title}</p>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => navigate(`/movie/${movie.id}`)} className="cursor-pointer group">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
          <div className="flex items-center gap-1 text-accent mb-1"><Star className="h-3 w-3 fill-current" /><span className="text-xs font-bold">{movie.rating}</span></div>
        </div>
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-foreground truncate">{movie.title}</h3>
        <p className="text-xs text-muted-foreground">{movie.year} · {movie.genre[0]}</p>
      </div>
    </motion.div>
  );
};

export default MovieCard;
