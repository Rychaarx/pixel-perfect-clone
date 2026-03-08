import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Star, ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CatalogItem } from "@/hooks/useCatalog";

interface HeroSliderProps {
  items: CatalogItem[];
}

const HeroSlider = ({ items = [] }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!items || items.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="relative h-[50vh] min-h-[300px] md:h-[60vh] md:min-h-[400px] bg-secondary flex items-end p-4 md:p-12">
        <div>
          <h1 className="font-display text-3xl md:text-5xl text-foreground mb-3 tracking-wide">CINE CLOUD</h1>
          <p className="text-muted-foreground">Nenhum título no catálogo ainda.</p>
        </div>
      </div>
    );
  }

  const item = items[current];

  return (
    <div className="relative h-[50vh] min-h-[300px] md:h-[60vh] md:min-h-[400px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-muted-foreground text-xs">{item.type}</span>
              {item.year && (
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Calendar className="h-3 w-3" />
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
            <h1 className="font-display text-5xl md:text-7xl text-foreground mb-3 tracking-wide">
              {item.title.toUpperCase()}
            </h1>
            {item.synopsis && (
              <p className="text-muted-foreground max-w-xl text-sm md:text-base line-clamp-2 mb-5">
                {item.synopsis}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/titulo/${item.id}`)}
                className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-sm transition-all"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Play className="h-4 w-4 fill-current text-primary-foreground" />
                <span className="text-primary-foreground">Assistir Agora</span>
              </button>
              <button
                onClick={() => navigate(`/titulo/${item.id}`)}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm hover:bg-secondary transition-all"
              >
                Mais Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-6 right-6 md:right-12 flex gap-2">
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

export default HeroSlider;
