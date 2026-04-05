import { useState, useEffect, useRef } from "react";
import { Lightbulb, Send, CheckCircle, Search, Film, Tv, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { useTmdbSearch, TmdbSearchResult, TmdbDetail } from "@/hooks/useTmdbSearch";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MAX_TITLE = 100;
const MAX_MESSAGE = 500;

interface Suggestion {
  id: string;
  title: string;
  type: string;
  message: string | null;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  pendente: { label: "Pendente", class: "bg-amber-500/20 text-amber-400" },
  aprovado: { label: "Aprovado", class: "bg-green-500/20 text-green-400" },
  recusado: { label: "Recusado", class: "bg-destructive/20 text-destructive" },
  adicionado: { label: "Adicionado", class: "bg-primary/20 text-primary" },
};

const Suggestions = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Filme");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // TMDB integration
  const { results, loading: tmdbLoading, search, getDetails, setResults } = useTmdbSearch();
  const [selectedTmdb, setSelectedTmdb] = useState<TmdbSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSuggestions(data as Suggestion[]);
    setLoadingList(false);
  };

  useEffect(() => { fetchSuggestions(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value.slice(0, MAX_TITLE));
    setSelectedTmdb(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length >= 2) {
      searchTimeout.current = setTimeout(() => {
        search(value.trim());
        setShowResults(true);
      }, 400);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: TmdbSearchResult) => {
    setSelectedTmdb(result);
    setTitle(result.title);
    setShowResults(false);
    setResults([]);

    // Auto-set type based on TMDB result
    if (result.isAnime) {
      setType("Anime");
    } else if (result.mediaType === "tv") {
      setType("Série");
    } else {
      setType("Filme");
    }
  };

  const clearSelection = () => {
    setSelectedTmdb(null);
    setTitle("");
    setType("Filme");
  };

  const canSubmit = title.trim().length > 0 && title.length <= MAX_TITLE && message.length <= MAX_MESSAGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setSending(true);

    try {
      // If a TMDB result was selected, pre-create catalog item via edge function
      if (selectedTmdb) {
        const detail = await getDetails(selectedTmdb.id, selectedTmdb.mediaType);
        if (detail) {
          const catalogType = detail.isAnime ? "Anime" : detail.mediaType === "tv" ? "Série" : "Filme";
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          if (token) {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-suggestion-item`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: detail.title,
                type: catalogType,
                year: detail.year,
                duration: detail.duration,
                genres: detail.genres,
                synopsis: detail.synopsis,
                posterUrl: detail.posterUrl,
                backdropUrl: detail.backdropUrl,
                seasons: detail.seasons || [],
              }),
            });
          }
        }
      }

      // Submit the suggestion
      const { error } = await supabase.from("suggestions").insert({
        user_id: user.id,
        title: title.trim(),
        type,
        message: message.trim() || null,
      });

      if (error) {
        toast.error("Erro ao enviar sugestão. Tente novamente.");
        setSending(false);
        return;
      }

      setSent(true);
      setTitle("");
      setMessage("");
      setType("Filme");
      setSelectedTmdb(null);
      toast.success(selectedTmdb
        ? "Sugestão enviada! Título pré-adicionado ao catálogo para o admin."
        : "Sugestão enviada!"
      );
      fetchSuggestions();
      setTimeout(() => setSent(false), 4000);
    } catch {
      toast.error("Erro ao processar sugestão.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground neon-text">Sugestões</h1>
          <p className="text-muted-foreground text-sm mt-1">Sugira títulos para adicionarmos ao catálogo</p>
        </div>

        {/* Form */}
        {sent ? (
          <div className="glass rounded-xl border border-border/30 p-8 text-center animate-scale-in mb-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Enviado!</h2>
            <p className="text-muted-foreground text-sm">Sua sugestão será analisada pela equipe.</p>
            <Button onClick={() => setSent(false)} variant="outline" className="mt-6">Sugerir outro</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-xl border border-border/30 p-6 space-y-5 mb-8">
            {/* Title with TMDB search */}
            <div ref={dropdownRef} className="relative">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Título *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquise no TMDB: Ex: Naruto, Oppenheimer..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border/50 bg-secondary/50 pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
                {selectedTmdb && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Selected TMDB item preview */}
              {selectedTmdb && (
                <div className="mt-2 flex items-center gap-3 rounded-lg bg-primary/10 border border-primary/30 p-3 animate-fade-in">
                  {selectedTmdb.posterUrl && (
                    <img src={selectedTmdb.posterUrl} alt="" className="w-10 h-14 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedTmdb.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedTmdb.isAnime ? "🎌 Anime" : selectedTmdb.mediaType === "tv" ? "📺 Série" : "🎬 Filme"}
                      {selectedTmdb.year && ` · ${selectedTmdb.year}`}
                    </p>
                    <p className="text-[10px] text-primary mt-0.5">✓ Dados do TMDB serão pré-adicionados ao catálogo</p>
                  </div>
                </div>
              )}

              {/* TMDB search results dropdown */}
              {showResults && (results.length > 0 || tmdbLoading) && (
                <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
                  {tmdbLoading ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground text-sm">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Buscando no TMDB...
                    </div>
                  ) : (
                    results.map((r) => (
                      <button
                        key={`${r.mediaType}-${r.id}`}
                        type="button"
                        onClick={() => handleSelectResult(r)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                      >
                        {r.posterUrl ? (
                          <img src={r.posterUrl} alt="" className="w-8 h-12 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center shrink-0">
                            {r.mediaType === "movie" ? <Film className="w-4 h-4 text-muted-foreground" /> : <Tv className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.isAnime ? "🎌 Anime" : r.mediaType === "tv" ? "📺 Série" : "🎬 Filme"}
                            {r.year && ` · ${r.year}`}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1 text-right">{title.length}/{MAX_TITLE}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Filme">🎬 Filme</SelectItem>
                  <SelectItem value="Série">📺 Série</SelectItem>
                  <SelectItem value="Anime">🎌 Anime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Observação <span className="text-muted-foreground">(opcional)</span></label>
              <Textarea
                placeholder="Algum detalhe extra..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                rows={3}
                className="bg-secondary/50 border-border/50 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/{MAX_MESSAGE}</p>
            </div>
            {!user && (
              <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">⚠️ Você precisa estar logado para enviar sugestões.</p>
            )}
            <Button type="submit" disabled={!canSubmit || sending || !user} className="w-full gradient-neon text-primary-foreground neon-glow gap-2">
              {sending ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Enviando..." : "Enviar Sugestão"}
            </Button>
          </form>
        )}

        {/* List */}
        <div>
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Sugestões da comunidade</h2>
          {loadingList ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma sugestão ainda. Seja o primeiro!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => {
                const st = statusLabels[s.status] || statusLabels.pendente;
                return (
                  <div key={s.id} className="glass rounded-xl border border-border/30 p-4">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h4 className="font-medium text-foreground truncate">{s.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">{s.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.class}`}>{st.label}</span>
                      </div>
                    </div>
                    {s.message && <p className="text-sm text-muted-foreground mt-1">{s.message}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Suggestions;
