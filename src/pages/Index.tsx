import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import HeroCarousel from "@/components/HeroCarousel";
import HomeSection from "@/components/HomeSection";
import MovieCard from "@/components/MovieCard";
import { useCatalog } from "@/hooks/useCatalog";
import { useSections } from "@/hooks/useSections";

const Index = () => {
  const { items, loading: catalogLoading } = useCatalog();
  const { sections, loading: sectionsLoading } = useSections();

  // Hero: show up to 5 most recent items that have an image
  const heroItems = items.filter((i) => i.imageUrl).slice(0, 5);

  // "Em Alta" — all items with images
  const trending = items.filter((i) => i.imageUrl).slice(0, 10);

  // "Adicionados Recentemente" — latest 10
  const recent = items.slice(0, 10);

  const isLoading = catalogLoading || sectionsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Carousel */}
      {isLoading ? (
        <div className="h-[65vh] min-h-[420px] max-h-[600px] flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : heroItems.length > 0 ? (
        <HeroCarousel items={heroItems} />
      ) : (
        <div className="h-[40vh] flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
          <h1 className="font-display text-3xl md:text-5xl text-foreground mb-3 neon-text">CineCloud</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Nenhum título no catálogo ainda. Adicione títulos pelo painel admin para vê-los aqui!
          </p>
        </div>
      )}

      {/* Dynamic Sections */}
      {sections.map((section) => (
        <HomeSection key={section.id} section={section} catalogItems={items} />
      ))}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="px-4 sm:px-6 py-6">
          <div className="max-w-[1320px] mx-auto">
            <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-5">EM ALTA</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {trending.map((item, i) => (
                <div key={item.id} className="min-w-[160px] max-w-[160px] shrink-0">
                  <MovieCard
                    id={item.id}
                    title={item.title}
                    poster={item.imageUrl || ""}
                    status={item.status}
                    type={item.type}
                    redirectUrl={item.redirectUrl}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Added */}
      {recent.length > 0 && (
        <section className="px-4 sm:px-6 py-6">
          <div className="max-w-[1320px] mx-auto">
            <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-5">ADICIONADOS RECENTEMENTE</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
              {recent.map((item, i) => (
                <MovieCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  poster={item.imageUrl || ""}
                  status={item.status}
                  type={item.type}
                  redirectUrl={item.redirectUrl}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">O catálogo está vazio. Adicione títulos pelo painel admin.</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
