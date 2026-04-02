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
          <h2 className="font-display text-base md:text-xl font-bold text-foreground">{section.title}</h2>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">{items.length} títulos</span>
        </div>
        <div className="relative group/carousel">
          <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover/carousel:opacity-100 transition-opacity">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div ref={scrollRef} className="flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {items.map((movie, idx) => (
              <div key={movie.id} className="min-w-[42vw] max-w-[42vw] md:min-w-[200px] md:max-w-[200px] lg:min-w-[210px] lg:max-w-[210px] xl:min-w-[220px] xl:max-w-[220px] snap-start shrink-0">
                <MovieCard id={movie.id} title={movie.title} poster={movie.imageUrl || ""} status={movie.status} type={movie.type} redirectUrl={movie.redirectUrl} index={idx} />
              </div>
            ))}
          </div>
          <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HomeSection;
