import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Calendar, Tag, Film, X } from "lucide-react";
import Navbar from "@/components/Navbar";

import { useCatalog, statusConfig } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";

const TitleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loading } = useCatalog();
  const item = items.find((c) => c.id === id);
  const [watching, setWatching] = useState(false);

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
  const hasVideo = !!(item.videoUrl || item.redirectUrl);

  // Full-screen video player
  if (watching) {
    const videoSrc = item.videoUrl || item.redirectUrl;
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <button
          onClick={() => setWatching(false)}
          className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 backdrop-blur-sm text-foreground hover:bg-secondary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        ) : item.redirectUrl ? (
          <iframe
            src={item.redirectUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : null}
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
                  onClick={() => setWatching(true)}
                  className="gap-2 rounded-full px-6 py-3 gradient-neon text-primary-foreground neon-glow"
                  size="lg"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Assistir Agora
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

      <BottomNav />
    </div>
  );
};

export default TitleDetails;
