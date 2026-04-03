import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CatalogItem } from "@/hooks/useCatalog";

interface ResumeItem {
  item: CatalogItem;
  progressPercent: number;
}

interface ResumeWatchingCarouselProps {
  catalogItems: CatalogItem[];
}

const ResumeWatchingCarousel = ({ catalogItems }: ResumeWatchingCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [resumeItems, setResumeItems] = useState<ResumeItem[]>([]);

  useEffect(() => {
    const items: ResumeItem[] = [];
    for (const item of catalogItems) {
      const pos = parseFloat(localStorage.getItem(`video_position_${item.id}`) || "0");
      const dur = parseFloat(localStorage.getItem(`video_duration_${item.id}`) || "0");
      if (pos > 5 && dur > 0) {
        items.push({ item, progressPercent: Math.min(99, (pos / dur) * 100) });
      }
    }
    setResumeItems(items);
  }, [catalogItems]);

  if (resumeItems.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section className="py-4 md:py-6 px-4 sm:px-6">
      <div className="w-full max-w-[1320px] mx-auto">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <span className="text-xl">▶️</span>
          <h2 className="font-display text-base md:text-xl font-bold text-foreground tracking-wider">
            VOLTAR A ASSISTIR
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">
            {resumeItems.length} {resumeItems.length === 1 ? "título" : "títulos"}
          </span>
        </div>
        <div className="relative group/resume">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover/resume:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar"
          >
            {resumeItems.map(({ item, progressPercent }) => {
              const pos = parseFloat(localStorage.getItem(`video_position_${item.id}`) || "0");
              const dur = parseFloat(localStorage.getItem(`video_duration_${item.id}`) || "0");

              return (
                <div
                  key={item.id}
                  className="min-w-[65vw] max-w-[65vw] md:min-w-[280px] md:max-w-[280px] lg:min-w-[300px] lg:max-w-[300px] snap-start shrink-0"
                >
                  <div
                    onClick={() => navigate(`/titulo/${item.id}`)}
                    className="cursor-pointer group/card rounded-lg overflow-hidden bg-secondary/30 border border-border/50 hover:border-primary/40 transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-secondary flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-foreground text-sm font-semibold truncate">{item.title}</h3>
                      <p className="text-muted-foreground text-xs mt-1">
                        {formatTime(pos)} / {formatTime(dur)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover/resume:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResumeWatchingCarousel;
