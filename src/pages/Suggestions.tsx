import { useState, useEffect } from "react";
import { Lightbulb, Send, CheckCircle, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSuggestions(data as Suggestion[]);
    setLoadingList(false);
  };

  useEffect(() => { fetchSuggestions(); }, []);

  const canSubmit = title.trim().length > 0 && title.length <= MAX_TITLE && message.length <= MAX_MESSAGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setSending(true);
    const { error } = await supabase.from("suggestions").insert({
      user_id: user.id,
      title: title.trim(),
      type,
      message: message.trim() || null,
    });
    setSending(false);

    if (error) {
      toast.error("Erro ao enviar sugestão. Tente novamente.");
      return;
    }

    setSent(true);
    setTitle("");
    setMessage("");
    setType("Filme");
    toast.success("Sugestão enviada!");
    fetchSuggestions();
    setTimeout(() => setSent(false), 4000);
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
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Título *</label>
              <Input
                placeholder="Ex: Naruto, Oppenheimer..."
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                className="bg-secondary/50 border-border/50"
                required
              />
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
