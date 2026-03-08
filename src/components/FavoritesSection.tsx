import { useRef } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FavoriteItem } from "@/hooks/useFavorites";

interface FavoritesSectionProps {
  items: FavoriteItem[];
}

const FavoritesSection = ({ items }: FavoritesSectionProps) => {
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
            Meus Favoritos
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Heart className="w-3 h-3 fill-current" />
            {items.length}
          </span>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
          {items.map((item) => (
            <FavoriteCard key={item.catalog_item_id} item={item} navigate={navigate} />
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
              <div key={item.catalog_item_id} className="min-w-[40vw] max-w-[40vw] snap-start shrink-0">
                <FavoriteCard item={item} navigate={navigate} />
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

function FavoriteCard({
  item,
  navigate,
}: {
  item: FavoriteItem;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div
      onClick={() => navigate(`/title/${item.catalog_item_id}`)}
      className="group/card cursor-pointer rounded-lg overflow-hidden bg-secondary/30 border border-border/50 hover:border-destructive/40 transition-all duration-300"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full bg-secondary flex items-center justify-center">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute top-2 right-2">
          <Heart className="w-5 h-5 text-destructive fill-destructive" />
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="text-foreground text-xs sm:text-sm font-semibold truncate">{item.title}</h3>
        <p className="text-muted-foreground/60 text-[10px] mt-0.5">{item.type}{item.year ? ` · ${item.year}` : ""}</p>
      </div>
    </div>
  );
}

export default FavoritesSection;
