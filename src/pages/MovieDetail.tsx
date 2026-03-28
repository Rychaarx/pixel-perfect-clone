import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Play, Heart, Share2, Maximize } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import { useWatchedMovies } from "@/hooks/useWatchedMovies";
import MovieCard from "@/components/MovieCard";

// Chave do sessionStorage para tempo exato (complementa o % do Supabase)
const SESS_KEY = (id: string) => `cineprogress_${id}`;

function fmt(secs: number) {
  if (!secs || isNaN(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { items, loading } = useCatalog();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getMovieProgress, setMovieProgress } = useWatchedMovies();

  const item = items.find((i) => i.id === id);
  const related = items
    .filter(
      (i) =>
        i.id !== id &&
        i.genres &&
        item?.genres &&
        i.genres.some((g) => item.genres!.includes(g))
    )
    .slice(0, 5);

  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [livePercent, setLivePercent] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");

  // Progresso salvo no Supabase (0–100)
  const savedPercent = id ? getMovieProgress(id) : 0;

  // Tempo exato salvo no sessionStorage (para retomar posição)
  const getSavedTime = useCallback((): number => {
    if (!id) return 0;
    try {
      const raw = sessionStorage.getItem(SESS_KEY(id));
      return raw ? JSON.parse(raw).ct ?? 0 : 0;
    } catch {
      return 0;
    }
  }, [id]);

  const saveToSession = useCallback(
    (ct: number, dur: number) => {
      if (!id) return;
      try {
        sessionStorage.setItem(SESS_KEY(id), JSON.stringify({ ct, dur }));
      } catch {}
    },
    [id]
  );

  // Salva progresso no Supabase a cada 10 s durante a reprodução
  const startAutoSave = useCallback(() => {
    if (saveTimer.current) clearInterval(saveTimer.current);
    saveTimer.current = setInterval(async () => {
      const v = videoRef.current;
      if (!v || !id || !v.duration || isNaN(v.duration)) return;
      const pct = Math.round((v.currentTime / v.duration) * 100);
      saveToSession(v.currentTime, v.duration);
      await setMovieProgress(id, pct);
    }, 10_000);
  }, [id, saveToSession, setMovieProgress]);

  const stopAutoSave = useCallback(() => {
    if (saveTimer.current) {
      clearInterval(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  // Para o autosave ao desmontar
  useEffect(() => {
    return () => stopAutoSave();
  }, [stopAutoSave]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground">Título não encontrado</p>
      </div>
    );
  }

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.duration || isNaN(v.duration)) return;
    const pct = (v.currentTime / v.duration) * 100;
    setLivePercent(pct);
    setCurrentTime(fmt(v.currentTime));
    setTotalTime(fmt(v.duration));
    saveToSession(v.currentTime, v.duration);
  };

  const handleOpen = () => {
    // Se tem redirectUrl, abre em nova aba (sem player interno)
    if (item.redirectUrl) {
      window.open(item.redirectUrl, "_blank");
      return;
    }
    setPlaying(true);
    // Retoma de onde parou após o vídeo montar
    setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      const ct = getSavedTime();
      if (ct > 0) v.currentTime = ct;
      startAutoSave();
    }, 600);
  };

  const handleClose = async () => {
    stopAutoSave();
    const v = videoRef.current;
    if (v && id && v.duration && !isNaN(v.duration)) {
      const pct = Math.round((v.currentTime / v.duration) * 100);
      saveToSession(v.currentTime, v.duration);
      await setMovieProgress(id, pct);
    }
    setPlaying(false);
    setIsLandscape(false);
  };

  const favorited = id ? isFavorite(id) : false;

  // Label do tempo exato (sessionStorage)
  const savedTimeLabel = (() => {
    try {
      const raw = id ? sessionStorage.getItem(SESS_KEY(id)) : null;
      if (raw) {
        const { ct } = JSON.parse(raw);
        return fmt(ct);
      }
    } catch {}
    return "";
  })();

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ===== PLAYER ===== */}
      {playing && item.videoUrl && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" }}>

          {/* Barra superior */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#111", flexShrink: 0, minHeight: 52 }}>
            <button onClick={handleClose}
              style={{ color: "#fff", background: "none", border: "none", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              ✕ <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
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
                src={item.videoUrl}
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
              <div style={{ height: "100%", width: `${livePercent}%`, background: "#e50914", borderRadius: 2, transition: "width 0.5s linear" }} />
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img
          src={item.backdropUrl || item.imageUrl || "/placeholder.svg"}
          alt={item.title}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
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
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.title}
              className="w-[180px] h-[270px] rounded-lg object-cover hidden md:block"
              style={{ boxShadow: "var(--shadow-card)" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1">
            <h1 className="font-display text-4xl md:text-6xl text-foreground tracking-wide mb-3">
              {item.title.toUpperCase()}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {item.year && <span className="text-muted-foreground text-sm">{item.year}</span>}
              {item.duration && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="h-3.5 w-3.5" />{item.duration}
                </span>
              )}
              <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground">
                {item.type}
              </span>
            </div>

            {item.genres && item.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {item.genres.map((g) => (
                  <span key={g} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground">{g}</span>
                ))}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleOpen}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Play className="h-4 w-4 fill-current text-primary-foreground" />
                <span className="text-primary-foreground">
                  {savedPercent > 0 ? "Continuar" : "Assistir Agora"}
                </span>
              </button>
              <button
                onClick={() => id && toggleFavorite(id)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/50 transition-colors ${favorited ? "text-destructive" : "text-foreground hover:bg-secondary"}`}
              >
                <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* ===== BARRA DE PROGRESSO vinculada ao Supabase ===== */}
            {savedPercent > 0 && (
              <div className="mb-6" style={{ background: "#1a1a1a", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#aaa", fontSize: 12 }}>
                    ▶ {savedTimeLabel ? `Assistido até ${savedTimeLabel}` : "Em andamento"}
                  </span>
                  <span style={{ color: "#e50914", fontSize: 12, fontWeight: 700 }}>{savedPercent}%</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "#444", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${savedPercent}%`,
                      background: "#e50914",
                      borderRadius: 3,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {item.synopsis && (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-6">{item.synopsis}</p>
            )}

            <div className="space-y-2 text-sm">
              {item.genres && item.genres.length > 0 && (
                <p><span className="text-muted-foreground">Gênero: </span><span className="text-foreground">{item.genres.join(", ")}</span></p>
              )}
              <p><span className="text-muted-foreground">Tipo: </span><span className="text-foreground">{item.type}</span></p>
              {item.year && <p><span className="text-muted-foreground">Ano: </span><span className="text-foreground">{item.year}</span></p>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="px-4 md:px-12 mt-12">
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">VOCÊ TAMBÉM PODE GOSTAR</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {related.map((m, idx) => (
              <div key={m.id} className="flex-shrink-0 w-[160px]">
                <MovieCard
                  id={m.id}
                  title={m.title}
                  poster={m.imageUrl || ""}
                  type={m.type}
                  status={m.status}
                  redirectUrl={m.redirectUrl}
                  index={idx}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MovieDetail;

