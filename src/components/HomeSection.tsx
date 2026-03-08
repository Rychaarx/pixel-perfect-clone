import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { CatalogItem } from "@/hooks/useCatalog";
import { Section } from "@/hooks/useSections";

interface HomeSectionProps {
  section: Section;
  catalogItems: CatalogItem[];
}

const HomeSection = ({ section, catalogItems }: HomeSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = section.items
    .map((si) => catalogItems.find((c) => c.id === si.catalog_item_id))
    .filter(Boolean) as CatalogItem[];

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
          <h2 className="font-display text-lg md:text-xl font-bold text-foreground">{section.title}</h2>
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">{items.length} títulos</span>
        </div>
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 lg:gap-6">
          {items.map((movie, idx) => (
            <MovieCard key={movie.id} id={movie.id} title={movie.title} poster={movie.imageUrl || ""} status={movie.status} type={movie.type} redirectUrl={movie.redirectUrl} index={idx} />
          ))}
        </div>
        <div className="md:hidden relative group">
          <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {items.map((movie, idx) => (
              <div key={movie.id} className="min-w-[42vw] max-w-[42vw] snap-start shrink-0">
                <MovieCard id={movie.id} title={movie.title} poster={movie.imageUrl || ""} status={movie.status} type={movie.type} redirectUrl={movie.redirectUrl} index={idx} />
              </div>
            ))}
          </div>
          <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HomeSection;
