import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Clock, Play, Heart, Share2 } from "lucide-react";
import { getMovieById, movies } from "@/data/movies";
import MovieCard from "@/components/MovieCard";
import BottomNav from "@/components/BottomNav";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const movie = getMovieById(Number(id));

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground">Filme não encontrado</p>
      </div>
    );
  }

  const related = movies.filter((m) => m.id !== movie.id && m.genre.some((g) => movie.genre.includes(g))).slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 backdrop-blur-sm text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="relative px-4 md:px-12 -mt-32 z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0"
          >
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-[180px] h-[270px] rounded-lg object-cover hidden md:block"
              style={{ boxShadow: "var(--shadow-card)" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            <h1 className="font-display text-4xl md:text-6xl text-foreground tracking-wide mb-3">
              {movie.title.toUpperCase()}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="flex items-center gap-1 text-accent">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-bold">{movie.rating}</span>
              </span>
              <span className="text-muted-foreground text-sm">{movie.year}</span>
              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="h-3.5 w-3.5" />
                {movie.duration}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {movie.genre.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="flex gap-3 mb-6">
              <button
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Play className="h-4 w-4 fill-current text-primary-foreground" />
                <span className="text-primary-foreground">Assistir Agora</span>
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                <Heart className="h-4 w-4" />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-6">
              {movie.description}
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Gênero: </span>
                <span className="text-foreground">{movie.genre.join(", ")}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Diretor: </span>
                <span className="text-foreground">{movie.director}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Avaliação: </span>
                <span className="text-foreground">{movie.rating}/10</span>
              </p>
              <p>
                <span className="text-muted-foreground">Elenco: </span>
                <span className="text-foreground">{movie.cast.join(", ")}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="px-4 md:px-12 mt-12">
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">VOCÊ TAMBÉM PODE GOSTAR</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {related.map((m) => (
              <div key={m.id} className="flex-shrink-0 w-[160px]">
                <MovieCard movie={m} variant="grid" />
              </div>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
};

export default MovieDetail;
