import { useState, useEffect, useRef } from "react";
import { useCatalog, CatalogItem } from "@/hooks/useCatalog";
import { useSeasons, Season, createEmptySeason, createEmptyEpisode } from "@/hooks/useSeasons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Upload, FolderUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

const AdminSeasons = () => {
  const { items } = useCatalog();
  const { fetchSeasons, saveSeasons, loading: saving } = useSeasons();
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [bulkCount, setBulkCount] = useState<Record<number, number>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSeasonIdx, setUploadSeasonIdx] = useState<number | null>(null);

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

  const addBulkEpisodes = (seasonIdx: number) => {
    const count = bulkCount[seasonIdx] || 5;
    const season = seasons[seasonIdx];
    const startNum = season.episodes.length > 0 ? Math.max(...season.episodes.map((e) => e.episode_number)) + 1 : 1;
    const newEps = Array.from({ length: count }, (_, i) => createEmptyEpisode(startNum + i));
    updateSeason(seasonIdx, { episodes: [...season.episodes, ...newEps] });
    setBulkCount({ ...bulkCount, [seasonIdx]: 5 });
    toast.success(`${count} episódios adicionados!`);
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

  // Bulk file upload using TUS
  const handleBulkFileUpload = async (seasonIdx: number, files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    const season = seasons[seasonIdx];
    const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Ensure we have enough episodes
    const startEpCount = season.episodes.length;
    if (sortedFiles.length > startEpCount) {
      const startNum = startEpCount > 0 ? Math.max(...season.episodes.map((e) => e.episode_number)) + 1 : 1;
      const extraEps = Array.from({ length: sortedFiles.length - startEpCount }, (_, i) =>
        createEmptyEpisode(startNum + i)
      );
      season.episodes = [...season.episodes, ...extraEps];
      updateSeason(seasonIdx, { episodes: season.episodes });
    }

    // Get episodes without URLs (in order)
    const emptyUrlEps = season.episodes
      .map((ep, idx) => ({ ep, idx }))
      .filter(({ ep }) => !ep.redirect_url);

    const { data: { session } } = await supabase.auth.getSession();
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    for (let i = 0; i < sortedFiles.length && i < emptyUrlEps.length; i++) {
      const file = sortedFiles[i];
      const { idx } = emptyUrlEps[i];
      const filePath = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const fileKey = `${seasonIdx}-${idx}`;

      try {
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
            retryDelays: [0, 3000, 5000],
            headers: {
              authorization: `Bearer ${session?.access_token}`,
              "x-upsert": "true",
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName: "videos",
              objectName: filePath,
              contentType: file.type || "application/octet-stream",
              cacheControl: "3600",
            },
            chunkSize: 6 * 1024 * 1024,
            onError: (error) => {
              console.error(`Upload error for ${file.name}:`, error);
              reject(error);
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              setUploadProgress((prev) => ({
                ...prev,
                [fileKey]: Math.round((bytesUploaded / bytesTotal) * 100),
              }));
            },
            onSuccess: () => {
              const publicUrl = `https://${projectId}.supabase.co/storage/v1/object/public/videos/${filePath}`;
              updateEpisode(seasonIdx, idx, { redirect_url: publicUrl });
              setUploadProgress((prev) => ({ ...prev, [fileKey]: 100 }));
              resolve();
            },
          });
          upload.findPreviousUploads().then((prev) => {
            if (prev.length) (upload as any).resumeFrom(prev[0]);
            upload.start();
          });
        });
      } catch {
        toast.error(`Erro ao enviar: ${file.name}`);
      }
    }

    setUploading(false);
    setUploadProgress({});
    toast.success(`${sortedFiles.length} arquivo(s) enviado(s)!`);
  };

  const triggerFileUpload = (seasonIdx: number) => {
    setUploadSeasonIdx(seasonIdx);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && uploadSeasonIdx !== null) {
      handleBulkFileUpload(uploadSeasonIdx, e.target.files);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for bulk upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,.mkv,.avi,.mp4,.webm,.mov"
        onChange={onFileChange}
        className="hidden"
      />

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
                    <div
                      onClick={() => setExpandedSeason(expandedSeason === sIdx ? null : sIdx)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer"
                      role="button"
                      tabIndex={0}
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
                    </div>

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

                        {/* Bulk actions */}
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <span className="text-xs text-muted-foreground font-medium">Ações em lote:</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={bulkCount[sIdx] || 5}
                              onChange={(e) => setBulkCount({ ...bulkCount, [sIdx]: Math.max(1, Number(e.target.value)) })}
                              className="bg-secondary/50 border-border/50 text-sm h-8 w-16 text-center"
                            />
                            <Button variant="outline" size="sm" onClick={() => addBulkEpisodes(sIdx)} className="text-xs gap-1 h-8">
                              <Plus className="w-3 h-3" /> Episódios
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerFileUpload(sIdx)}
                            disabled={uploading}
                            className="text-xs gap-1 h-8 ml-auto"
                          >
                            <FolderUp className="w-3 h-3" />
                            {uploading ? "Enviando..." : "Enviar arquivos"}
                          </Button>
                        </div>

                        {/* Upload progress */}
                        {uploading && Object.keys(uploadProgress).length > 0 && (
                          <div className="space-y-1">
                            {Object.entries(uploadProgress)
                              .filter(([key]) => key.startsWith(`${sIdx}-`))
                              .map(([key, pct]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground w-8">{pct}%</span>
                                </div>
                              ))}
                          </div>
                        )}

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
                                className={`bg-secondary/50 border-border/50 text-sm h-8 flex-1 ${ep.redirect_url ? "border-primary/30" : ""}`}
                              />
                              {ep.redirect_url && (
                                <span className="text-primary text-[10px]">✓</span>
                              )}
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
                <Button onClick={handleSave} disabled={saving || uploading} className="gradient-neon text-primary-foreground gap-2">
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
