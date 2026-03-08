import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContinueWatchingEntry } from "@/hooks/useWatchProgress";
import { Progress } from "@/components/ui/progress";

interface ContinueWatchingSectionProps {
  items: ContinueWatchingEntry[];
}

const ContinueWatchingSection = ({ items }: ContinueWatchingSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-6 md:py-10 px-4 sm:px-6">
      <div className="w-full max-w-[1320px] mx-auto">
        <div className="flex items-center gap-3 mb-5 md:mb-8">
          <h2 className="font-display text-base md:text-xl font-bold text-foreground">
            Continuar Assistindo
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">
            {items.length} {items.length === 1 ? "título" : "títulos"}
          </span>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
          {items.map((item) => (
            <ContinueWatchingCard key={item.catalog_item_id} item={item} navigate={navigate} />
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden relative group">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item) => (
              <div key={item.catalog_item_id} className="min-w-[75vw] max-w-[75vw] snap-start shrink-0">
                <ContinueWatchingCard item={item} navigate={navigate} />
              </div>
            ))}
          </div>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

function ContinueWatchingCard({
  item,
  navigate,
}: {
  item: ContinueWatchingEntry;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const progressPercent = item.total_episodes > 0
    ? Math.round((item.watched_episodes / item.total_episodes) * 100)
    : 0;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.next_episode_redirect_url) {
      window.open(item.next_episode_redirect_url, "_blank");
    } else {
      navigate(`/title/${item.catalog_item_id}`);
    }
  };

  return (
    <div
      onClick={() => navigate(`/title/${item.catalog_item_id}`)}
      className="group/card cursor-pointer rounded-lg overflow-hidden bg-secondary/30 border border-border/50 hover:border-primary/40 transition-all duration-300"
    >
      {/* Image header */}
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

        {/* Play button overlay */}
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
          </div>
        </button>
      </div>

      {/* Progress bar */}
      <Progress value={progressPercent} className="h-1 rounded-none" />

      {/* Info */}
      <div className="p-3">
        <h3 className="text-foreground text-sm font-semibold truncate">{item.title}</h3>
        <p className="text-muted-foreground text-xs mt-1">
          {item.season_name} · Ep. {item.next_episode_number}
          {item.next_episode_title && ` — ${item.next_episode_title}`}
        </p>
        <p className="text-muted-foreground/60 text-[10px] mt-1">
          {item.watched_episodes}/{item.total_episodes} episódios assistidos
        </p>
      </div>
    </div>
  );
}

export default ContinueWatchingSection;
