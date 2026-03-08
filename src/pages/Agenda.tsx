import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Tv, Sparkles, Play, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

interface AgendaItem {
  id: string;
  type: "catalog" | "episode";
  title: string;
  catalogTitle: string;
  catalogItemId: string;
  catalogType: string;
  imageUrl?: string;
  seasonNumber?: number;
  seasonName?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  createdAt: string;
}

const typeIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t === "série") return <Tv className="w-4 h-4" />;
  if (t === "anime") return <Sparkles className="w-4 h-4" />;
  return <Film className="w-4 h-4" />;
};

const typeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t === "série") return "bg-primary/20 text-primary";
  if (t === "anime") return "bg-accent/20 text-accent";
  return "bg-secondary text-secondary-foreground";
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function groupByDate(items: AgendaItem[]) {
  const groups: Record<string, AgendaItem[]> = {};
  for (const item of items) {
    const date = new Date(item.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Ontem";
    } else {
      label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return groups;
}

const Agenda = () => {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAgenda() {
      const agendaItems: AgendaItem[] = [];

      // Fetch catalog items (new titles added)
      const { data: catalogData } = await supabase
        .from("catalog_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (catalogData) {
        for (const item of catalogData) {
          agendaItems.push({
            id: `catalog-${item.id}`,
            type: "catalog",
            title: item.title,
            catalogTitle: item.title,
            catalogItemId: item.id,
            catalogType: item.type,
            imageUrl: item.image_url || undefined,
            createdAt: item.created_at,
          });
        }
      }

      // Fetch episodes with season and catalog info
      const { data: episodesData } = await supabase
        .from("episodes")
        .select("*, seasons(season_number, name, catalog_item_id, catalog_items(title, type, image_url))")
        .order("created_at", { ascending: false })
        .limit(100);

      if (episodesData) {
        for (const ep of episodesData) {
          const season = ep.seasons as any;
          if (!season) continue;
          const catalog = season.catalog_items as any;
          if (!catalog) continue;

          agendaItems.push({
            id: `episode-${ep.id}`,
            type: "episode",
            title: ep.title || `Episódio ${ep.episode_number}`,
            catalogTitle: catalog.title,
            catalogItemId: season.catalog_item_id,
            catalogType: catalog.type,
            imageUrl: catalog.image_url || undefined,
            seasonNumber: season.season_number,
            seasonName: season.name || `Temporada ${season.season_number}`,
            episodeNumber: ep.episode_number,
            episodeTitle: ep.title || undefined,
            createdAt: ep.created_at,
          });
        }
      }

      // Sort all by date desc
      agendaItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(agendaItems);
      setLoading(false);
    }

    fetchAgenda();
  }, []);

  const grouped = groupByDate(items);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-24 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Novidades</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma novidade ainda.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([dateLabel, groupItems]) => (
              <div key={dateLabel}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  {dateLabel}
                </h2>
                <div className="space-y-3">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/titulo/${item.catalogItemId}`)}
                      className="flex gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/40 cursor-pointer transition-all duration-200 group"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-secondary">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.catalogTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {typeIcon(item.catalogType)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColor(item.catalogType)}`}>
                            {typeIcon(item.catalogType)}
                            {item.catalogType}
                          </span>
                          <span className="text-muted-foreground/50 text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        {item.type === "catalog" ? (
                          <>
                            <p className="text-foreground text-sm font-semibold truncate">
                              {item.title}
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              Novo título adicionado ao catálogo
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-foreground text-sm font-semibold truncate">
                              {item.catalogTitle}
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {item.seasonName} · Ep. {item.episodeNumber}
                              {item.episodeTitle && ` — ${item.episodeTitle}`}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
