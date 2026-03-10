import { useState, useEffect, useRef, useCallback } from "react";
import * as tus from "tus-js-client";
import { useCatalog, CatalogItem, CatalogStatus, statusConfig } from "@/hooks/useCatalog";
import { useTmdbSearch, TmdbSearchResult, TmdbDetail } from "@/hooks/useTmdbSearch";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, X, ExternalLink, Loader2, Upload, Film } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const emptyForm = {
  title: "", type: "Filme" as CatalogItem["type"], status: "na_lista" as CatalogStatus,
  imageUrl: "", backdropUrl: "", videoUrl: "", redirectUrl: "", year: "", duration: "", genres: "", synopsis: "",
};

const AdminCatalog = () => {
  const { items, loading, addItem, removeItem, updateItem } = useCatalog();
  const { results: tmdbResults, loading: tmdbLoading, search: tmdbSearch, getDetails, setResults: setTmdbResults } = useTmdbSearch();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [fillingFromTmdb, setFillingFromTmdb] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const uploadRef = useRef<tus.Upload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingTmdbDetail, setPendingTmdbDetail] = useState<TmdbDetail | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const cancelUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setUploading(false);
    setUploadProgress(0);
    setUploadSpeed("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Upload cancelado");
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande (${formatFileSize(file.size)}). Máximo: 10 GB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size === 0) {
      toast.error("O arquivo selecionado está vazio.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadSpeed("");

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data: { session } } = await supabase.auth.refreshSession();
    if (!session) {
      toast.error("Você precisa estar logado para fazer upload.");
      setUploading(false);
      return;
    }

    const bucketName = "videos";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let lastLoaded = 0;
    let lastTime = Date.now();

    let lastRefresh = Date.now();
    let cachedToken = session.access_token;
    const getFreshToken = async () => {
      if (Date.now() - lastRefresh > 30_000) {
        const { data: { session: s } } = await supabase.auth.refreshSession();
        if (s) {
          cachedToken = s.access_token;
          lastRefresh = Date.now();
        }
      }
      return cachedToken;
    };

    const upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 20 * 1024 * 1024, // 20MB chunks for more stable long uploads
      headers: {
        authorization: `Bearer ${cachedToken}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName,
        objectName: fileName,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onShouldRetry: (err) => {
        const status = (err as any)?.originalResponse?.getStatus?.();
        if (status === 403 || status === 409 || status === 423) return true;
        if (status && status >= 400 && status < 500) return false;
        return true;
      },
      onBeforeRequest: async (req) => {
        const freshToken = await getFreshToken();
        req.setHeader("Authorization", `Bearer ${freshToken}`);
        req.setHeader("authorization", `Bearer ${freshToken}`);
      },
      onError: (error) => {
        console.error("TUS upload error:", error);
        const msg = error?.message || String(error);
        const status = (error as any)?.originalResponse?.getStatus?.();

        if (status === 413 || msg.includes("Maximum size") || msg.includes("413")) {
          toast.error("Arquivo excede o tamanho máximo permitido pelo servidor.");
        } else if (status === 401 || status === 403) {
          toast.error("Sessão expirada durante o upload. Tente novamente.");
        } else {
          toast.error("Falha no upload por instabilidade de rede. Tente novamente.");
        }

        setUploading(false);
        setUploadProgress(0);
        setUploadSpeed("");
        uploadRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percent = Math.round((bytesUploaded / bytesTotal) * 100);
        setUploadProgress(percent);

        const now = Date.now();
        const elapsed = (now - lastTime) / 1000;
        if (elapsed >= 1) {
          const speed = (bytesUploaded - lastLoaded) / elapsed;
          const remaining = (bytesTotal - bytesUploaded) / speed;
          const speedStr = speed >= 1024 * 1024
            ? `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
            : `${(speed / 1024).toFixed(0)} KB/s`;
          const timeStr = remaining > 60
            ? `${Math.ceil(remaining / 60)} min restantes`
            : `${Math.ceil(remaining)}s restantes`;
          setUploadSpeed(`${speedStr} · ${timeStr}`);
          lastLoaded = bytesUploaded;
          lastTime = now;
        }
      },
      onSuccess: () => {
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        console.log("TUS upload success, public URL:", urlData.publicUrl);
        setForm((prev) => ({ ...prev, redirectUrl: urlData.publicUrl }));
        setUploadProgress(100);
        setUploadSpeed("");
        setUploading(false);
        uploadRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Vídeo enviado com sucesso!");
      },
    });

    uploadRef.current = upload;

    // Check for previous uploads to resume
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
        toast.info("Retomando upload anterior...");
      }
      upload.start();
    });
  };

  // Debounced TMDB search
  useEffect(() => {
    if (!tmdbQuery.trim() || editingId) {
      setTmdbResults([]);
      setShowTmdbResults(false);
      return;
    }
    const timer = setTimeout(() => {
      tmdbSearch(tmdbQuery);
      setShowTmdbResults(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [tmdbQuery]);

  const filtered = items.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || i.type === filterType;
    return matchSearch && matchType;
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTmdbQuery("");
    setTmdbResults([]);
    setShowTmdbResults(false);
    setPendingTmdbDetail(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title, type: item.type, status: item.status,
      imageUrl: item.imageUrl || "", backdropUrl: item.backdropUrl || "",
      videoUrl: item.videoUrl || "", redirectUrl: item.redirectUrl || "",
      year: item.year || "", duration: item.duration || "",
      genres: item.genres?.join(", ") || "", synopsis: item.synopsis || "",
    });
    setTmdbQuery("");
    setTmdbResults([]);
    setShowTmdbResults(false);
    setDialogOpen(true);
  };

  const selectTmdbResult = async (result: TmdbSearchResult) => {
    setShowTmdbResults(false);
    setFillingFromTmdb(true);
    setPendingTmdbDetail(null);
    const resolvedType = result.mediaType === "movie" ? "Filme" : result.isAnime ? "Anime" : "Série";
    setForm((prev) => ({
      ...prev,
      title: result.title,
      type: resolvedType as CatalogItem["type"],
      imageUrl: result.posterUrl || "",
      synopsis: result.overview || prev.synopsis,
      year: result.year || prev.year,
    }));

    const detail = await getDetails(result.id, result.mediaType);
    if (detail) {
      const detailType = detail.mediaType === "movie" ? "Filme" : detail.isAnime ? "Anime" : "Série";
      setForm((prev) => ({
        ...prev,
        type: detailType as CatalogItem["type"],
        duration: detail.duration || prev.duration,
        genres: detail.genres?.join(", ") || prev.genres,
        synopsis: detail.synopsis || prev.synopsis,
        videoUrl: detail.trailerUrl || prev.videoUrl,
        imageUrl: detail.posterUrl || prev.imageUrl,
        backdropUrl: detail.backdropUrl || prev.backdropUrl,
        year: detail.year || prev.year,
      }));
      if (detail.seasons && detail.seasons.length > 0) {
        setPendingTmdbDetail(detail);
      }
    }
    setFillingFromTmdb(false);
    const seasonCount = detail?.seasons?.length || 0;
    const episodeCount = detail?.seasons?.reduce((sum, s) => sum + s.episodes.length, 0) || 0;
    const extra = seasonCount > 0 ? ` (${seasonCount} temporada(s), ${episodeCount} episódio(s))` : "";
    toast.success(`Dados preenchidos do TMDB!${extra}`);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    const payload = {
      title: form.title, type: form.type, status: form.status,
      imageUrl: form.imageUrl || undefined, backdropUrl: form.backdropUrl || undefined,
      videoUrl: form.videoUrl || undefined,
      redirectUrl: form.redirectUrl || undefined, year: form.year || undefined,
      duration: form.duration || undefined,
      genres: form.genres ? form.genres.split(",").map((g) => g.trim()).filter(Boolean) : undefined,
      synopsis: form.synopsis || undefined,
    };

    if (editingId) {
      await updateItem(editingId, payload);
      toast.success("Item atualizado!");
    } else {
      const result = await addItem(payload);
      if (result?.duplicate) {
        toast.error(`"${form.title}" já existe no catálogo`);
        return;
      }
      
      // Auto-create seasons and episodes from TMDB data
      if (result?.id && pendingTmdbDetail?.seasons && pendingTmdbDetail.seasons.length > 0) {
        try {
          for (const season of pendingTmdbDetail.seasons) {
            const { data: seasonData } = await supabase
              .from("seasons")
              .insert({
                catalog_item_id: result.id,
                season_number: season.seasonNumber,
                name: season.name,
              })
              .select()
              .single();

            if (seasonData && season.episodes.length > 0) {
              const episodeRows = season.episodes.map((ep) => ({
                season_id: seasonData.id,
                episode_number: ep.episodeNumber,
                title: ep.title,
                duration: ep.duration,
              }));
              await supabase.from("episodes").insert(episodeRows);
            }
          }
          const totalEps = pendingTmdbDetail.seasons.reduce((s, se) => s + se.episodes.length, 0);
          toast.success(`${pendingTmdbDetail.seasons.length} temporada(s) e ${totalEps} episódio(s) criados!`);
        } catch (err) {
          console.error("Error creating seasons/episodes:", err);
          toast.error("Erro ao criar temporadas/episódios");
        }
      }
      
      setPendingTmdbDetail(null);
      toast.success("Item adicionado!");
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"?`)) return;
    await removeItem(id);
    toast.success("Item removido!");
  };

  if (loading) return <div className="text-muted-foreground text-center py-12">Carregando catálogo...</div>;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Filme">Filmes</SelectItem>
              <SelectItem value="Série">Séries</SelectItem>
              <SelectItem value="Anime">Animes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-neon text-primary-foreground neon-glow gap-2">
              <Plus className="w-4 h-4" /> Novo Título
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">
                {editingId ? "Editar Título" : "Novo Título"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* TMDB Search - only for new items */}
              {!editingId && (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="🔍 Buscar no TMDB para preencher automaticamente..."
                      value={tmdbQuery}
                      onChange={(e) => setTmdbQuery(e.target.value)}
                      className="pl-9 bg-primary/5 border-primary/30 placeholder:text-muted-foreground/60"
                    />
                    {tmdbLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                    )}
                  </div>
                  {showTmdbResults && tmdbResults.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {tmdbResults.map((r) => (
                        <button
                          key={`${r.mediaType}-${r.id}`}
                          onClick={() => selectTmdbResult(r)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
                        >
                          {r.posterUrl ? (
                            <img src={r.posterUrl} alt="" className="w-8 h-12 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-12 rounded bg-secondary flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.mediaType === "movie" ? "Filme" : r.isAnime ? "Anime" : "Série"} · {r.year}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {fillingFromTmdb && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando detalhes do TMDB...
                </div>
              )}

              <Input placeholder="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary/50 border-border/50" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CatalogItem["type"] })}>
                  <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Filme">Filme</SelectItem>
                    <SelectItem value="Série">Série</SelectItem>
                    <SelectItem value="Anime">Anime</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CatalogStatus })}>
                  <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="na_lista">Na Lista</SelectItem>
                    <SelectItem value="em_espera">Em Espera</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Ano" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="bg-secondary/50 border-border/50" />
                <Input placeholder="Duração" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-secondary/50 border-border/50" />
              </div>
              <Input placeholder="Gêneros (separados por vírgula)" value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} className="bg-secondary/50 border-border/50" />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Capa do filme (poster)</label>
                <Input placeholder="URL da capa do filme" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-secondary/50 border-border/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Imagem da Home (backdrop/banner)</label>
                <Input placeholder="URL da imagem para a home" value={form.backdropUrl} onChange={(e) => setForm({ ...form, backdropUrl: e.target.value })} className="bg-secondary/50 border-border/50" />
              </div>
              
              {/* Video/Trailer URL */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL do Vídeo/Trailer</label>
                <Input
                  placeholder="Cole a URL do vídeo/trailer"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="bg-secondary/50 border-border/50 text-xs"
                />
              </div>

              {/* Redirect URL with Upload */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">URL de Redirecionamento (link para assistir)</label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="*/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2 flex-1 bg-secondary/50 border-border/50"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Enviando {uploadProgress}%</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload de Vídeo</>
                    )}
                  </Button>
                  {uploading && (
                    <Button type="button" variant="destructive" size="sm" onClick={cancelUpload} className="shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {uploading && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    {uploadSpeed && (
                      <p className="text-[10px] text-muted-foreground text-right">{uploadSpeed}</p>
                    )}
                  </div>
                )}
                {form.redirectUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30">
                    <Film className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-xs text-muted-foreground truncate flex-1">{form.redirectUrl}</p>
                    <button onClick={() => setForm({ ...form, redirectUrl: "" })} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  placeholder="Ou cole o link para assistir o filme..."
                  value={form.redirectUrl}
                  onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
                  className="bg-secondary/50 border-border/50 border-primary/30 text-xs"
                />
              </div>

              <Textarea placeholder="Sinopse" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} rows={3} className="bg-secondary/50 border-border/50" />
              
              {/* Preview */}
              {form.imageUrl && (
                <div className="flex gap-3 items-start p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <img src={form.imageUrl} alt="Preview" className="w-16 h-24 rounded object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{form.title || "Sem título"}</p>
                    <p className="text-xs text-muted-foreground">{form.type} · {form.year}</p>
                    {form.videoUrl && <p className="text-xs text-primary mt-1">🎬 Trailer disponível</p>}
                    {form.redirectUrl && <p className="text-xs text-accent mt-1">🔗 Link para assistir</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} className="gradient-neon text-primary-foreground">Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 border border-border/30">
          <p className="text-2xl font-display font-bold text-foreground">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        {(Object.entries(statusConfig) as [CatalogStatus, typeof statusConfig[CatalogStatus]][]).map(([key, cfg]) => (
          <div key={key} className="glass rounded-xl p-4 border border-border/30">
            <p className={`text-2xl font-display font-bold ${cfg.color}`}>{items.filter((i) => i.status === key).length}</p>
            <p className="text-xs text-muted-foreground">{cfg.icon} {cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-xl border border-border/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Título</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Ano</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    {search ? "Nenhum resultado encontrado" : "Nenhum item no catálogo"}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const sc = statusConfig[item.status];
                  return (
                    <tr key={item.id} className="border-b border-border/10 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="" className="w-10 h-14 rounded object-cover hidden sm:block" />
                          )}
                          <div>
                            <p className="font-medium text-foreground truncate max-w-[200px]">{item.title}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{item.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{item.type}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{item.year || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.badgeClass}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {item.redirectUrl && (
                            <a href={item.redirectUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.title)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCatalog;
