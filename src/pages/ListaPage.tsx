import { useState } from "react";
import { Heart, Filter } from "lucide-react";
import { useCatalog, CatalogItem, CatalogStatus, statusConfig } from "@/hooks/useCatalog";
import MovieCard from "@/components/MovieCard";
import Navbar from "@/components/Navbar";


const ListaPage = () => {
  const { items, loading } = useCatalog();
  const [activeTab, setActiveTab] = useState<CatalogStatus | "all">("all");

  const filtered = activeTab === "all" ? items : items.filter((i) => i.status === activeTab);

  const tabs: { key: CatalogStatus | "all"; label: string; icon?: string }[] = [
    { key: "all", label: "Todos" },
    { key: "na_lista", label: "Na Lista", icon: "📝" },
    { key: "em_espera", label: "Em Espera", icon: "⏳" },
    { key: "concluido", label: "Concluído", icon: "✅" },
  ];

  const stats = {
    total: items.length,
    na_lista: items.filter((i) => i.status === "na_lista").length,
    em_espera: items.filter((i) => i.status === "em_espera").length,
    concluido: items.filter((i) => i.status === "concluido").length,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 neon-text">Minha Lista</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass rounded-xl p-4 border border-border/30">
            <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border/30">
            <p className="text-2xl font-display font-bold text-blue-400">{stats.na_lista}</p>
            <p className="text-xs text-muted-foreground">📝 Na Lista</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border/30">
            <p className="text-2xl font-display font-bold text-amber-400">{stats.em_espera}</p>
            <p className="text-xs text-muted-foreground">⏳ Em Espera</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border/30">
            <p className="text-2xl font-display font-bold text-green-400">{stats.concluido}</p>
            <p className="text-xs text-muted-foreground">✅ Concluído</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground neon-glow"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-sm">
              {activeTab === "all" ? "Nenhum título no catálogo ainda" : `Nenhum título com status "${statusConfig[activeTab as CatalogStatus].label}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
            {filtered.map((item, idx) => (
              <MovieCard
                key={item.id}
                id={item.id}
                title={item.title}
                poster={item.imageUrl || ""}
                status={item.status}
                type={item.type}
                redirectUrl={item.redirectUrl || ""}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default ListaPage;
