import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Calendar, Tag, Film, X, ChevronDown, Eye, EyeOff, CheckCircle, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useWatchedMovies } from "@/hooks/useWatchedMovies";

import { useCatalog, statusConfig } from "@/hooks/useCatalog";
import { useSeasons, Season } from "@/hooks/useSeasons";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TitleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loading } = useCatalog();
  const item = items.find((c) => c.id === id);
  const [watching, setWatching] = useState(false);
  const { fetchSeasons } = useSeasons();
  const { markEpisodeWatched, unmarkEpisodeWatched, isEpisodeWatched } = useWatchProgress();
  const { markMovieWatched, unmarkMovieWatched, isMovieWatched } = useWatchedMovies();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [openSeason, setOpenSeason] = useState<number | null>(null);

  useEffect(() => {
    if (id && item?.type?.toLowerCase() === "série") {
      fetchSeasons(id).then((s) => {
        setSeasons(s);
        if (s.length > 0) setOpenSeason(s[0].season_number);
      });
    }
  }, [id, item?.type, fetchSeasons]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-lg">Título não encontrado.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  const sc = statusConfig[item.status];
  const hasVideo = !!(item.redirectUrl || item.videoUrl);

  // Determine if a URL is a direct video file (playable via <video> tag)
  const isDirectVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov|mkv|avi)(\?.*)?$/i.test(url) || url.includes('/storage/v1/object/');
  };

  // Determine if a URL is an embeddable source (YouTube, Vimeo, etc.)
  const isEmbeddable = (url: string) => {
    return /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i.test(url);
  };

  // Full-screen video player
  if (watching) {
    // Priority: redirectUrl (link to watch) > videoUrl (trailer)
    const src = item.redirectUrl || item.videoUrl || '';

    // If it's a non-embeddable external link, open in new tab
    if (src && !isDirectVideo(src) && !isEmbeddable(src)) {
      window.open(src, '_blank');
      setWatching(false);
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <button
          onClick={() => setWatching(false)}
          className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 backdrop-blur-sm text-foreground hover:bg-secondary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {isDirectVideo(src) ? (
          <video
            src={src}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        ) : (
          <iframe
            src={src}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero backdrop */}
      <div className="relative h-[45vh] min-h-[350px]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

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
          {item.imageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 hidden md:block"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-[180px] h-[270px] rounded-lg object-cover shadow-lg"
              />
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            <h1 className="font-display text-3xl md:text-5xl text-foreground tracking-wide mb-3">
              {item.title.toUpperCase()}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.badgeClass}`}>
                {sc.icon} {sc.label}
              </span>
              {item.type && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Film className="h-3.5 w-3.5" />
                  {item.type}
                </span>
              )}
              {item.year && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.year}
                </span>
              )}
              {item.duration && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {item.duration}
                </span>
              )}
            </div>

            {item.genres && item.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {item.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              {hasVideo && (
                <Button
                  onClick={() => {
                    if (id && item.type?.toLowerCase() === "filme") markMovieWatched(id);
                    setWatching(true);
                  }}
                  className="gap-2 rounded-full px-6 py-3 gradient-neon text-primary-foreground neon-glow"
                  size="lg"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Assistir Agora
                </Button>
              )}
              {id && item.type?.toLowerCase() === "filme" && (
                <Button
                  variant={isMovieWatched(id) ? "secondary" : "outline"}
                  onClick={() => isMovieWatched(id) ? unmarkMovieWatched(id) : markMovieWatched(id)}
                  className="gap-2 rounded-full px-5"
                  size="lg"
                >
                  <CheckCircle className={`h-4 w-4 ${isMovieWatched(id) ? "text-primary" : ""}`} />
                  {isMovieWatched(id) ? "Assistido" : "Marcar como Assistido"}
                </Button>
              )}
            </div>

            {item.synopsis && (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-6">
                {item.synopsis}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Seasons & Episodes */}
      {seasons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 md:px-12 mt-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Temporadas & Episódios</h2>
          <div className="space-y-3">
            {seasons.map((season) => (
              <Collapsible
                key={season.season_number}
                open={openSeason === season.season_number}
                onOpenChange={(open) => setOpenSeason(open ? season.season_number : null)}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 text-left hover:bg-secondary/80 transition-colors">
                  <span className="font-medium text-foreground">
                    {season.name || `Temporada ${season.season_number}`}
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span>{season.episodes.length} ep.</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSeason === season.season_number ? "rotate-180" : ""}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1 space-y-1 pl-2">
                    {season.episodes.map((ep) => {
                      const watched = ep.id ? isEpisodeWatched(ep.id) : false;
                      return (
                      <div
                        key={ep.episode_number}
                        className={`flex items-center justify-between rounded-md px-4 py-3 hover:bg-secondary/30 transition-colors group ${watched ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-sm w-6 text-center">{ep.episode_number}</span>
                          <span className={`text-sm ${watched ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {ep.title || `Episódio ${ep.episode_number}`}
                          </span>
                          {watched && <span className="text-[10px] text-primary font-medium">✓ Assistido</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {ep.duration && (
                            <span className="text-muted-foreground text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {ep.duration}
                            </span>
                          )}
                          {ep.id && id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={watched ? "Desmarcar como assistido" : "Marcar como assistido"}
                              onClick={() => watched ? unmarkEpisodeWatched(ep.id!) : markEpisodeWatched(ep.id!, id)}
                            >
                              {watched ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                            </Button>
                          )}
                          {ep.redirect_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                if (ep.id && id) markEpisodeWatched(ep.id, id);
                                window.open(ep.redirect_url, "_blank");
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TitleDetails;
