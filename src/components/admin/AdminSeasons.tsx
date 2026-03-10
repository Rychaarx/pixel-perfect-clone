import { useState, useEffect, useRef } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { useSeasons, Season, createEmptySeason, createEmptyEpisode } from "@/hooks/useSeasons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, FolderUp, GripVertical } from "lucide-react";
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
  const [dragState, setDragState] = useState<{ seasonIdx: number; epIdx: number } | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const seasonsRef = useRef<Season[]>([]);
  seasonsRef.current = seasons;

  const handleDragStart = (seasonIdx: number, epIdx: number) => {
    setDragState({ seasonIdx, epIdx });
  };

  const handleDragOver = (e: React.DragEvent, epIdx: number) => {
    e.preventDefault();
    setDragOverIdx(epIdx);
  };

  const handleDrop = (seasonIdx: number, targetEpIdx: number) => {
    if (!dragState || dragState.seasonIdx !== seasonIdx || dragState.epIdx === targetEpIdx) {
      setDragState(null);
      setDragOverIdx(null);
      return;
    }
    const season = seasons[seasonIdx];
    const eps = [...season.episodes];
    const [moved] = eps.splice(dragState.epIdx, 1);
    eps.splice(targetEpIdx, 0, moved);
    // Re-number episodes after reorder
    const renumbered = eps.map((ep, i) => ({ ...ep, episode_number: i + 1 }));
    updateSeason(seasonIdx, { episodes: renumbered });
    setDragState(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragOverIdx(null);
  };

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
    setSeasons((prev) => {
      const num = prev.length > 0 ? Math.max(...prev.map((s) => s.season_number)) + 1 : 1;
      const next = [...prev, createEmptySeason(num)];
      setExpandedSeason(next.length - 1);
      return next;
    });
  };

  const removeSeason = (idx: number) => {
    if (!confirm("Remover esta temporada?")) return;
    setSeasons((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSeason = (idx: number, patch: Partial<Season>) => {
    setSeasons((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addEpisode = (seasonIdx: number) => {
    setSeasons((prev) =>
      prev.map((season, i) => {
        if (i !== seasonIdx) return season;
        const num = season.episodes.length > 0 ? Math.max(...season.episodes.map((e) => e.episode_number)) + 1 : 1;
        return { ...season, episodes: [...season.episodes, createEmptyEpisode(num)] };
      })
    );
  };

  const addBulkEpisodes = (seasonIdx: number) => {
    const count = bulkCount[seasonIdx] || 5;
    setSeasons((prev) =>
      prev.map((season, i) => {
        if (i !== seasonIdx) return season;
        const startNum = season.episodes.length > 0 ? Math.max(...season.episodes.map((e) => e.episode_number)) + 1 : 1;
        const newEps = Array.from({ length: count }, (_, j) => createEmptyEpisode(startNum + j));
        return { ...season, episodes: [...season.episodes, ...newEps] };
      })
    );
    setBulkCount((prev) => ({ ...prev, [seasonIdx]: 5 }));
    toast.success(`${count} episódios adicionados!`);
  };

  const removeEpisode = (seasonIdx: number, epIdx: number) => {
    setSeasons((prev) =>
      prev.map((season, i) =>
        i === seasonIdx ? { ...season, episodes: season.episodes.filter((_, j) => j !== epIdx) } : season
      )
    );
  };

  const updateEpisode = (seasonIdx: number, epIdx: number, patch: Record<string, string>) => {
    setSeasons((prev) =>
      prev.map((season, i) => {
        if (i !== seasonIdx) return season;
        return {
          ...season,
          episodes: season.episodes.map((ep, j) => (j === epIdx ? { ...ep, ...patch } : ep)),
        };
      })
    );
  };

  const handleSave = async () => {
    if (!selectedItemId) return;
    await saveSeasons(selectedItemId, seasons);
    toast.success("Temporadas salvas!");
  };

  // Bulk file upload using TUS — parallel with timeout
  const handleBulkFileUpload = async (seasonIdx: number, files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const baseEpisodes = seasonsRef.current[seasonIdx]?.episodes ?? [];
    let workingEpisodes = [...baseEpisodes];

    // Ensure we have enough episodes
    if (sortedFiles.length > workingEpisodes.length) {
      const startNum = workingEpisodes.length > 0 ? Math.max(...workingEpisodes.map((e) => e.episode_number)) + 1 : 1;
      const extraEps = Array.from({ length: sortedFiles.length - workingEpisodes.length }, (_, i) =>
        createEmptyEpisode(startNum + i)
      );
      workingEpisodes = [...workingEpisodes, ...extraEps];
      updateSeason(seasonIdx, { episodes: workingEpisodes });
    }

    // Get episodes without URLs (in order)
    const emptyUrlEps = workingEpisodes
      .map((ep, idx) => ({ ep, idx }))
      .filter(({ ep }) => !ep.redirect_url);

    // Refresh session to get a fresh token
    const { data: { session } } = await supabase.auth.refreshSession();
    if (!session) {
      toast.error("Sessão expirada. Faça login novamente.");
      setUploading(false);
      return;
    }
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    const UPLOAD_TIMEOUT = 60 * 60 * 1000; // 60 minutes for very large files
    const CONCURRENCY = 1; // Sequential for large files to avoid memory issues

    // Build upload tasks
    const tasks: Array<{ file: File; epIdx: number; filePath: string; fileKey: string }> = [];
    for (let i = 0; i < sortedFiles.length && i < emptyUrlEps.length; i++) {
      const file = sortedFiles[i];
      const { idx } = emptyUrlEps[i];
      const filePath = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      tasks.push({ file, epIdx: idx, filePath, fileKey: `${seasonIdx}-${idx}` });
    }

    // Helper to get fresh token — always refresh to avoid expired JWS
    let lastRefresh = Date.now();
    let cachedToken = session.access_token;
    const getFreshToken = async () => {
      // Refresh every 30 seconds to keep token alive during large uploads
      if (Date.now() - lastRefresh > 30_000) {
        const { data: { session: s } } = await supabase.auth.refreshSession();
        if (s) {
          cachedToken = s.access_token;
          lastRefresh = Date.now();
        }
      }
      return cachedToken;
    };

    const uploadOne = (task: typeof tasks[0]) => {
      let timer: ReturnType<typeof setTimeout>;

      const promise = new Promise<void>(async (resolve, reject) => {
        let settled = false;
        const settle = (fn: () => void) => { if (!settled) { settled = true; clearTimeout(timer); fn(); } };

        const token = await getFreshToken();

        const upload = new tus.Upload(task.file, {
          endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${token}`,
            "x-upsert": "true",
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: "videos",
            objectName: task.filePath,
            contentType: task.file.type || "application/octet-stream",
            cacheControl: "3600",
          },
          chunkSize: 20 * 1024 * 1024, // 20MB chunks — more reliable for large files
          onShouldRetry: (err) => {
            const status = (err as any)?.originalResponse?.getStatus?.();
            // Retry on network errors and 5xx, but not on 4xx (except 409/423)
            if (status === 409 || status === 423) return true;
            if (status && status >= 400 && status < 500) return false;
            return true;
          },
          onBeforeRequest: async (req) => {
            // Refresh token before each chunk to avoid expiration
            const freshToken = await getFreshToken();
            req.setHeader("Authorization", `Bearer ${freshToken}`);
          },
          onError: (error) => settle(() => reject(error)),
          onProgress: (bytesUploaded, bytesTotal) => {
            setUploadProgress((prev) => ({
              ...prev,
              [task.fileKey]: Math.round((bytesUploaded / bytesTotal) * 100),
            }));
          },
          onSuccess: () => settle(() => {
            const publicUrl = `https://${projectId}.supabase.co/storage/v1/object/public/videos/${task.filePath}`;
            setSeasons((prev) =>
              prev.map((season, i) => {
                if (i !== seasonIdx) return season;
                return {
                  ...season,
                  episodes: season.episodes.map((ep, j) =>
                    j === task.epIdx ? { ...ep, redirect_url: publicUrl } : ep
                  ),
                };
              })
            );
            setUploadProgress((prev) => ({ ...prev, [task.fileKey]: 100 }));
            resolve();
          }),
        });

        timer = setTimeout(() => {
          upload.abort();
          settle(() => reject(new Error(`Timeout: ${task.file.name}`)));
        }, UPLOAD_TIMEOUT);

        upload.start();
      });

      return promise;
    };

    // Process with concurrency pool
    let completed = 0;
    const pool: Promise<void>[] = [];
    const errors: string[] = [];

    for (const task of tasks) {
      const p = uploadOne(task)
        .catch((err) => {
          console.error(`Upload error: ${task.file.name}`, err);
          errors.push(task.file.name);
        })
        .finally(() => { completed++; });

      pool.push(p);

      if (pool.length >= CONCURRENCY) {
        await Promise.race(pool);
        // Remove settled promises
        for (let i = pool.length - 1; i >= 0; i--) {
          const settled = await Promise.race([pool[i].then(() => true), Promise.resolve(false)]);
          if (settled) pool.splice(i, 1);
        }
      }
    }

    await Promise.allSettled(pool);

    setUploading(false);
    setUploadProgress({});
    if (errors.length > 0) {
      toast.error(`Falha em ${errors.length} arquivo(s): ${errors.join(", ")}`);
    }
    toast.success(`${tasks.length - errors.length} de ${tasks.length} arquivo(s) enviado(s)!`);
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
                        <div className="space-y-1">
                          {season.episodes.map((ep, eIdx) => (
                            <div
                              key={eIdx}
                              draggable={!uploading}
                              onDragStart={() => !uploading && handleDragStart(sIdx, eIdx)}
                              onDragOver={(e) => !uploading && handleDragOver(e, eIdx)}
                              onDrop={() => !uploading && handleDrop(sIdx, eIdx)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-center gap-2 bg-secondary/20 rounded-lg p-2 transition-all ${
                                dragState?.seasonIdx === sIdx && dragState?.epIdx === eIdx
                                  ? "opacity-40 scale-[0.98]"
                                  : ""
                              } ${
                                dragOverIdx === eIdx && dragState?.seasonIdx === sIdx && dragState?.epIdx !== eIdx
                                  ? "border-t-2 border-primary"
                                  : "border-t-2 border-transparent"
                              } ${uploading ? "opacity-70" : ""}`}
                            >
                              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 shrink-0 text-center">E{ep.episode_number}</span>
                              <Input
                                placeholder="Título"
                                value={ep.title}
                                disabled={uploading}
                                onChange={(e) => updateEpisode(sIdx, eIdx, { title: e.target.value })}
                                className="bg-secondary/50 border-border/50 text-sm h-8 flex-1"
                              />
                              <Input
                                placeholder="Duração"
                                value={ep.duration}
                                disabled={uploading}
                                onChange={(e) => updateEpisode(sIdx, eIdx, { duration: e.target.value })}
                                className="bg-secondary/50 border-border/50 text-sm h-8 w-20"
                              />
                              <Input
                                placeholder="URL"
                                value={ep.redirect_url}
                                disabled={uploading}
                                onChange={(e) => updateEpisode(sIdx, eIdx, { redirect_url: e.target.value })}
                                className={`bg-secondary/50 border-border/50 text-sm h-8 flex-1 ${ep.redirect_url ? "border-primary/30" : ""}`}
                              />
                              {ep.redirect_url && (
                                <span className="text-primary text-[10px]">✓</span>
                              )}
                              <button
                                onClick={() => removeEpisode(sIdx, eIdx)}
                                disabled={uploading}
                                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-40"
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
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!confirm("Descartar alterações?")) return;
                      setLoadingSeasons(true);
                      fetchSeasons(selectedItemId).then((s) => {
                        setSeasons(s);
                        setLoadingSeasons(false);
                        toast.info("Alterações descartadas");
                      });
                    }}
                    disabled={saving || uploading}
                    className="gap-2 text-muted-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving || uploading} className="gradient-neon text-primary-foreground gap-2">
                    <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Tudo"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSeasons;
