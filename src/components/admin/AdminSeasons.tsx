import { useState, useEffect } from "react";
import { useCatalog, CatalogItem } from "@/hooks/useCatalog";
import { useSeasons, Season, createEmptySeason, createEmptyEpisode } from "@/hooks/useSeasons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const AdminSeasons = () => {
  const { items } = useCatalog();
  const { fetchSeasons, saveSeasons, loading: saving } = useSeasons();
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  // Only show series/anime
  const seriesItems = items.filter((i) => i.type === "Série" || i.type === "Anime");

  useEffect(() => {
    if (!selectedItemId) { setSeasons([]); return; }
    setLoadingSeasons(true);
    fetchSeasons(selectedItemId).then((s) => {
      setSeasons(s);
      setLoadingSeasons(false);
      setExpandedSeason(s.length > 0 ? 0 : null);
    });
  }, [selectedItemId, fetchSeasons]);

  const addSeason = () => {
    const num = seasons.length > 0 ? Math.max(...seasons.map((s) => s.season_number)) + 1 : 1;
    setSeasons([...seasons, createEmptySeason(num)]);
    setExpandedSeason(seasons.length);
  };

  const removeSeason = (idx: number) => {
    if (!confirm("Remover esta temporada?")) return;
    setSeasons(seasons.filter((_, i) => i !== idx));
  };

  const updateSeason = (idx: number, patch: Partial<Season>) => {
    setSeasons(seasons.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addEpisode = (seasonIdx: number) => {
    const season = seasons[seasonIdx];
    const num = season.episodes.length > 0 ? Math.max(...season.episodes.map((e) => e.episode_number)) + 1 : 1;
    updateSeason(seasonIdx, { episodes: [...season.episodes, createEmptyEpisode(num)] });
  };

  const removeEpisode = (seasonIdx: number, epIdx: number) => {
    const season = seasons[seasonIdx];
    updateSeason(seasonIdx, { episodes: season.episodes.filter((_, i) => i !== epIdx) });
  };

  const updateEpisode = (seasonIdx: number, epIdx: number, patch: Record<string, string>) => {
    const season = seasons[seasonIdx];
    const newEps = season.episodes.map((e, i) => (i === epIdx ? { ...e, ...patch } : e));
    updateSeason(seasonIdx, { episodes: newEps });
  };

  const handleSave = async () => {
    if (!selectedItemId) return;
    await saveSeasons(selectedItemId, seasons);
    toast.success("Temporadas salvas!");
  };

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="glass rounded-xl border border-border/30 p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3">Selecionar Série/Anime</h3>
        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue placeholder="Escolha um título..." />
          </SelectTrigger>
          <SelectContent>
            {seriesItems.length === 0 ? (
              <SelectItem value="none" disabled>Nenhuma série/anime no catálogo</SelectItem>
            ) : (
              seriesItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.title} ({item.type})</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedItemId && (
        <>
          {loadingSeasons ? (
            <div className="text-center py-8 text-muted-foreground">Carregando temporadas...</div>
          ) : (
            <>
              {/* Seasons */}
              <div className="space-y-3">
                {seasons.map((season, sIdx) => (
                  <div key={sIdx} className="glass rounded-xl border border-border/30 overflow-hidden">
                    {/* Season header */}
                    <button
                      onClick={() => setExpandedSeason(expandedSeason === sIdx ? null : sIdx)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedSeason === sIdx ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        <span className="font-medium text-foreground text-sm">
                          Temporada {season.season_number} {season.name ? `— ${season.name}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">{season.episodes.length} eps</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSeason(sIdx); }}
                        className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </button>

                    {/* Season content */}
                    {expandedSeason === sIdx && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border/20">
                        <div className="flex gap-3 mt-3">
                          <Input
                            placeholder="Nome da temporada"
                            value={season.name}
                            onChange={(e) => updateSeason(sIdx, { name: e.target.value })}
                            className="bg-secondary/50 border-border/50 text-sm"
                          />
                        </div>

                        {/* Episodes */}
                        <div className="space-y-2">
                          {season.episodes.map((ep, eIdx) => (
                            <div key={eIdx} className="flex items-center gap-2 bg-secondary/20 rounded-lg p-2">
                              <span className="text-xs text-muted-foreground w-8 shrink-0 text-center">E{ep.episode_number}</span>
                              <Input
                                placeholder="Título"
                                value={ep.title}
                                onChange={(e) => updateEpisode(sIdx, eIdx, { title: e.target.value })}
                                className="bg-secondary/50 border-border/50 text-sm h-8 flex-1"
                              />
                              <Input
                                placeholder="Duração"
                                value={ep.duration}
                                onChange={(e) => updateEpisode(sIdx, eIdx, { duration: e.target.value })}
                                className="bg-secondary/50 border-border/50 text-sm h-8 w-20"
                              />
                              <Input
                                placeholder="URL"
                                value={ep.redirect_url}
                                onChange={(e) => updateEpisode(sIdx, eIdx, { redirect_url: e.target.value })}
                                className="bg-secondary/50 border-border/50 text-sm h-8 flex-1"
                              />
                              <button
                                onClick={() => removeEpisode(sIdx, eIdx)}
                                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <Button variant="outline" size="sm" onClick={() => addEpisode(sIdx)} className="text-xs gap-1">
                          <Plus className="w-3 h-3" /> Episódio
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-between">
                <Button variant="outline" onClick={addSeason} className="gap-2">
                  <Plus className="w-4 h-4" /> Temporada
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gradient-neon text-primary-foreground gap-2">
                  <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Tudo"}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSeasons;
