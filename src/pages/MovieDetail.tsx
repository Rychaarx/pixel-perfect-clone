import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Clock, Play, Heart, Share2, Maximize } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { getMovieById, movies } from "@/data/movies";
import MovieCard from "@/components/MovieCard";

const KEY = (id: string) => `progress_${id}`;

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const movie = getMovieById(Number(id));

  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");
  const [savedPercent, setSavedPercent] = useState(0);
  const [savedTimeLabel, setSavedTimeLabel] = useState("");

  // Carrega progresso salvo ao montar
  useEffect(() => {
    if (!id) return;
    try {
      const raw = sessionStorage.getItem(KEY(id));
      if (raw) {
        const { ct, dur } = JSON.parse(raw);
        if (dur > 0) {
          const pct = Math.round((ct / dur) * 100);
          setSavedPercent(pct);
          setSavedTimeLabel(fmt(ct));
        }
      }
    } catch {}
  }, [id]);

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground">Filme não encontrado</p>
      </div>
    );
  }

  const related = movies
    .filter((m) => m.id !== movie.id && m.genre.some((g) => movie.genre.includes(g)))
    .slice(0, 5);

  function fmt(secs: number) {
    if (!secs || isNaN(secs)) return "0:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.duration || isNaN(v.duration)) return;
    const pct = (v.currentTime / v.duration) * 100;
    setProgressPercent(pct);
    setCurrentTime(fmt(v.currentTime));
    setTotalTime(fmt(v.duration));
    // salva progresso
    try {
      sessionStorage.setItem(KEY(id!), JSON.stringify({ ct: v.currentTime, dur: v.duration }));
      setSavedPercent(Math.round(pct));
      setSavedTimeLabel(fmt(v.currentTime));
    } catch {}
  };

  const handleOpen = () => {
    setPlaying(true);
    // retoma de onde parou
    setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(KEY(id!));
        if (raw && videoRef.current) {
          const { ct } = JSON.parse(raw);
          if (ct > 0) videoRef.current.currentTime = ct;
        }
      } catch {}
    }, 600);
  };

  const handleClose = () => {
    if (videoRef.current) {
      try {
        sessionStorage.setItem(KEY(id!), JSON.stringify({
          ct: videoRef.current.currentTime,
          dur: videoRef.current.duration,
        }));
        setSavedPercent(Math.round((videoRef.current.currentTime / videoRef.current.duration) * 100));
        setSavedTimeLabel(fmt(videoRef.current.currentTime));
      } catch {}
    }
    setPlaying(false);
    setIsLandscape(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ===== PLAYER ===== */}
      {playing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" }}>

          {/* Barra superior fixa */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#111", flexShrink: 0, minHeight: 52 }}>
            <button onClick={handleClose}
              style={{ color: "#fff", background: "none", border: "none", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              ✕ <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{movie.title}</span>
            </button>
            <button onClick={() => setIsLandscape(p => !p)}
              style={{ color: "#fff", background: "#333", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Maximize size={14} /> {isLandscape ? "Vertical" : "Horizontal"}
            </button>
          </div>

          {/* Vídeo */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#000" }}>
            <div style={isLandscape
              ? { transform: "rotate(90deg)", transformOrigin: "center center", width: "calc(100vh - 52px)", height: "100vw" }
              : { width: "100%", height: "100%" }}>
              <video
                ref={videoRef}
                src={movie.videoUrl}
                controls
                autoPlay
                playsInline
                onTimeUpdate={handleTimeUpdate}
                style={{ width: "100%", height: "100%", background: "#000", display: "block" }}
              />
            </div>
          </div>

          {/* Barra de progresso do player */}
          <div style={{ background: "#111", padding: "8px 16px 14px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#aaa", fontSize: 11 }}>{currentTime}</span>
              <span style={{ color: "#aaa", fontSize: 11 }}>{totalTime}</span>
            </div>
            <div style={{ width: "100%", height: 4, background: "#333", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${progressPercent}%`, background: "#e50914", borderRadius: 2, transition: "width 0.5s linear" }} />
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img src={movie.backdrop} alt={movie.title} className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <button onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 backdrop-blur-sm text-foreground hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="relative px-4 md:px-12 -mt-32 z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0">
            <img src={movie.poster} alt={movie.title}
              className="w-[180px] h-[270px] rounded-lg object-cover hidden md:block"
              style={{ boxShadow: "var(--shadow-card)" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1">
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
                <Clock className="h-3.5 w-3.5" />{movie.duration}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {movie.genre.map((g) => (
                <span key={g} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground">{g}</span>
              ))}
            </div>

            {/* Botões */}
            <div className="flex gap-3 mb-4">
              <button onClick={handleOpen}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
                style={{ background: "var(--gradient-primary)" }}>
                <Play className="h-4 w-4 fill-current text-primary-foreground" />
                <span className="text-primary-foreground">
                  {savedPercent > 0 ? "Continuar" : "Assistir Agora"}
                </span>
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                <Heart className="h-4 w-4" />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

           {/* Barra de progresso na página */}
{savedPercent > 0 && (
  <div className="mb-6" style={{ background: "#1a1a1a", borderRadius: 10, padding: "12px 14px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ color: "#aaa", fontSize: 12 }}>▶ Assistido até {savedTimeLabel}</span>
      <span style={{ color: "#e50914", fontSize: 12, fontWeight: 700 }}>{savedPercent}%</span>
    </div>
    <div style={{ width: "100%", height: 6, background: "#444", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${savedPercent}%`, background: "#e50914", borderRadius: 3 }} />
    </div>
  </div>
)}

            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-6">{movie.description}</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Gênero: </span><span className="text-foreground">{movie.genre.join(", ")}</span></p>
              <p><span className="text-muted-foreground">Diretor: </span><span className="text-foreground">{movie.director}</span></p>
              <p><span className="text-muted-foreground">Avaliação: </span><span className="text-foreground">{movie.rating}/10</span></p>
              <p><span className="text-muted-foreground">Elenco: </span><span className="text-foreground">{movie.cast.join(", ")}</span></p>
            </div>
          </motion.div>
        </div>
      </div>

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
    </div>
  );
};

export default MovieDetail;
