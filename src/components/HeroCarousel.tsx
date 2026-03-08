import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CatalogItem } from "@/hooks/useCatalog";

interface HeroCarouselProps {
  items: CatalogItem[];
}

const HeroCarousel = ({ items }: HeroCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[current];
  const hasPoster = !!item.imageUrl;

  const goTo = (dir: -1 | 1) => {
    setCurrent((prev) => (prev + dir + items.length) % items.length);
  };

  return (
    <div className="relative h-[65vh] min-h-[420px] max-h-[600px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {hasPoster ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-background to-background" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                {item.type}
              </span>
              {item.year && (
                <span className="text-muted-foreground text-sm">{item.year}</span>
              )}
              {item.duration && (
                <span className="text-muted-foreground text-sm">{item.duration}</span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-foreground mb-3 tracking-wide leading-tight">
              {item.title.toUpperCase()}
            </h1>

            {item.synopsis && (
              <p className="text-muted-foreground max-w-xl text-sm md:text-base line-clamp-2 mb-5">
                {item.synopsis}
              </p>
            )}

            {item.genres && item.genres.length > 0 && (
              <div className="flex gap-2 mb-5 flex-wrap">
                {item.genres.slice(0, 3).map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-full bg-secondary/80 text-xs text-muted-foreground">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {item.redirectUrl && (
                <a
                  href={item.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-sm transition-all gradient-neon neon-glow"
                >
                  <Play className="h-4 w-4 fill-current text-primary-foreground" />
                  <span className="text-primary-foreground">Assistir</span>
                </a>
              )}
              <button
                onClick={() => navigate(`/titulo/${item.id}`)}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm hover:bg-secondary transition-all"
              >
                <Info className="h-4 w-4" />
                Mais Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => goTo(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background/80 transition-all opacity-0 hover:opacity-100 md:opacity-60"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-background/80 transition-all opacity-0 hover:opacity-100 md:opacity-60"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-6 right-6 md:right-12 flex gap-2 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-primary" : "w-4 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
