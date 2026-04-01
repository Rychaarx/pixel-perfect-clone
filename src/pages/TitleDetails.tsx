import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Calendar, Tag, Film, X, ChevronDown, Eye, EyeOff, Heart, Maximize, Minimize } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useWatchedMovies } from "@/hooks/useWatchedMovies";
import { useFavorites } from "@/hooks/useFavorites";
import { useCatalog, statusConfig } from "@/hooks/useCatalog";
import { useSeasons, Season } from "@/hooks/useSeasons";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

async function lockLandscape(): Promise<boolean> {
  try {
    const s = window.screen as any;
    if (s?.orientation?.lock) {
      await s.orientation.lock("landscape");
      return true;
    }
  } catch {}
  return false;
}

function unlockOrientation() {
  try {
    const s = window.screen as any;
    if (s?.orientation?.unlock) s.orientation.unlock();
  } catch {}
}

const TitleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loading } = useCatalog();
  const item = items.find((c) => c.id === id);

  const [watching, setWatching] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [nativeRotation, setNativeRotation] = useState(false);

  const { fetchSeasons } = useSeasons();
  const { markEpisodeWatched, unmarkEpisodeWatched, isEpisodeWatched } = useWatchProgress();
  const { markMovieWatched, unmarkMovieWatched, isMovieWatched, getMovieProgress, setMovieProgress } = useWatchedMovies();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [openSeason, setOpenSeason] = useState<number | null>(null);

  useEffect(() => {
    if (id && (item?.type?.toLowerCase() === "série" || item?.type?.toLowerCase() === "anime")) {
      fetchSeasons(id).then((s) => {
        setSeasons(s);
        if (s.length > 0) setOpenSeason(s[0].season_number);
      });
    }
  }, [id, item?.type, fetchSeasons]);

  useEffect(() => {
    if (!watching) {
      unlockOrientation();
      setIsLandscape(false);
      setNativeRotation(false);
    }
  }, [watching]);

  useEffect(() => {
    if (!watching) return;
    const handle = () => {
      if (nativeRotation) {
        setIsLandscape(window.matchMedia("(orientation: landscape)").matches);
      }
    };
    window.addEventListener("orientationchange", handle);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("orientationchange", handle);
      window.removeEventListener("resize", handle);
    };
  }, [watching, nativeRotation]);

  const handleToggleLandscape = async () => {
    if (isLandscape) {
      unlockOrientation();
      setIsLandscape(false);
      setNativeRotation(false);
    } else {
      const success = await lockLandscape();
      setNativeRotation(success);
      setIsLandscape(true);
    }
  };

  const handleClosePlayer = () => {
    unlockOrientation();
    setWatching(false);
    setIsLandscape(false);
    setNativeRotation(false);
  };

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

  const isDirectVideo = (url: string) =>
    /\.(mp4|webm|ogg|mov|mkv|avi)(\?.*)?$/i.test(url) || url.includes("/storage/v1/object/");

  const isEmbeddable = (url: string) =>
    /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i.test(url);

  // ===== PLAYER =====
  if (watching) {
    const src = item.redirectUrl || item.videoUrl || "";

    if (src && !isDirectVideo(src) && !isEmbeddable(src)) {
      window.open(src, "_blank");
      setWatching(false);
      return null;
    }

    const videoWrapStyle: React.CSSProperties =
      !nativeRotation && isLandscape
        ? {
            transform: "rotate(90deg)",
            transformOrigin: "center center",
            width: "100vh",
            height: "100vw",
            position: "absolute",
            top: "50%",
            left: "50%",
            marginTop: "calc(-50vw)",
            marginLeft: "calc(-50vh)",
          }
        : { width: "100%", height: "100%" };

    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 60, display: "flex", gap: 8 }}>
          <button
            onClick={handleToggleLandscape}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 backdrop-blur-sm text-foreground hover:bg-secondary transition-colors"
            title={isLandscape ? "Vertical" : "Horizontal"}
          >
            {isLandscape ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
          <button
            onClick={handleClosePlayer}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 backdrop-blur-sm text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-black">
          <div style={videoWrapStyle}>
            {isDirectVideo(src) ? (
              <video
                src={src}
                controls
                autoPlay
                playsInline
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
        </div>
      </div>
    );
  }

  // ===== PÁGINA NORMAL =====
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative h-[45vh] min-h-[350px]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
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

      <div className="relative px-4 md:px-12 -mt-32 z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {item.imageUrl && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0 hidden md:block">
              <img src={item.imageUrl} alt={item.title} className="w-[180px] h-[270px] rounded-lg object-cover shadow-lg" />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1">
            <h1 className="font-display text-3xl md:text-5xl text-foreground tracking-wide mb-3">
              {item.title.toUpperCase()}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.badgeClass}`}>
                {sc.icon} {sc.label}
              </span>
              {item.type && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Film className="h-3.5 w-3.5" />{item.type}
                </span>
              )}
              {item.year && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Calendar className="h-3.5 w-3.5" />{item.year}
                </span>
              )}
              {item.duration && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="h-3.5 w-3.5" />{item.duration}
                </span>
              )}
            </div>

            {item.genres && item.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {item.genres.map((g) => (
                  <span key={g} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />{g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-4">
              {hasVideo && (
                <Button
                  onClick={() => setWatching(true)}
                  className="gap-2 rounded-full px-6 py-3 gradient-neon text-primary-foreground neon-glow"
                  size="lg"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Assistir Agora
                </Button>
              )}
              {id && (
                <Button
                  variant={isFavorite(id) ? "secondary" : "outline"}
                  onClick={() => toggleFavorite(id)}
                  className="gap-2 rounded-full px-5"
                  size="lg"
                >
                  <Heart className={`h-4 w-4 ${isFavorite(id) ? "text-destructive fill-destructive" : ""}`} />
                  {isFavorite(id) ? "Favoritado" : "Favoritar"}
                </Button>
              )}
            </div>

            {id && item.type?.toLowerCase() === "filme" && (
              <div className="mb-6 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progresso</span>
                  <span className="text-sm font-medium text-foreground">{getMovieProgress(id)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={getMovieProgress(id)}
                  onChange={(e) => setMovieProgress(id, Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-primary"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground/60">0%</span>
                  {isMovieWatched(id) && (
                    <button onClick={() => unmarkMovieWatched(id)} className="text-[10px] text-destructive hover:underline">
                      Remover progresso
                    </button>
                  )}
                  <span className="text-[10px] text-muted-foreground/60">100%</span>
                </div>
              </div>
            )}

            {item.synopsis && (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-6">{item.synopsis}</p>
            )}
          </motion.div>
        </div>
      </div>

      {seasons.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-4 md:px-12 mt-8">
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
                <CollapsibleContent className="mt-2 space-y-2">
                  {season.episodes.map((episode) => (
                    <div key={episode.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (episode.redirect_url) {
                              window.open(episode.redirect_url, "_blank");
                            } else if (item.videoUrl || item.redirectUrl) {
                              setWatching(true);
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {episode.episode_number}. {episode.title}
                          </p>
                          {episode.duration && (
                            <p className="text-[10px] text-muted-foreground">{episode.duration}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!id || !episode.id) return;
                          isEpisodeWatched(episode.id)
                            ? unmarkEpisodeWatched(episode.id)
                            : markEpisodeWatched(episode.id, id);
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {episode.id && isEpisodeWatched(episode.id) ? (
                          <Eye className="h-4 w-4 text-primary" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
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
