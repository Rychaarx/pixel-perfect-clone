import { useState } from "react";
import { Send, MessageSquare, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MAX_TITLE = 100;
const MAX_MESSAGE = 1000;

const Feedback = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Filme");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = title.trim().length > 0 && title.length <= MAX_TITLE && message.length <= MAX_MESSAGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!user) {
      toast.error("Você precisa estar logado para enviar feedback.");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("feedback_requests").insert({
      title: title.trim(),
      type,
      message: message.trim() || null,
    });

    setSending(false);
    if (error) {
      toast.error("Erro ao enviar feedback. Tente novamente.");
      return;
    }

    setSent(true);
    setTitle("");
    setMessage("");
    setType("Filme");
    toast.success("Feedback enviado com sucesso!");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground neon-text">Feedback</h1>
          <p className="text-muted-foreground text-sm mt-1">Sugira um título ou envie uma mensagem para a equipe</p>
        </div>

        {sent ? (
          <div className="glass rounded-xl border border-border/30 p-8 text-center animate-scale-in">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Enviado!</h2>
            <p className="text-muted-foreground text-sm">Obrigado pelo seu feedback. Vamos analisar sua solicitação.</p>
            <Button onClick={() => setSent(false)} variant="outline" className="mt-6">
              Enviar outro
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-xl border border-border/30 p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Título *</label>
              <Input
                placeholder="Ex: One Piece, Interestelar..."
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
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Filme">🎬 Filme</SelectItem>
                  <SelectItem value="Série">📺 Série</SelectItem>
                  <SelectItem value="Anime">🎌 Anime</SelectItem>
                  <SelectItem value="Outro">💬 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Mensagem <span className="text-muted-foreground">(opcional)</span></label>
              <Textarea
                placeholder="Descreva mais detalhes sobre sua solicitação..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                rows={4}
                className="bg-secondary/50 border-border/50 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/{MAX_MESSAGE}</p>
            </div>

            {!user && (
              <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                ⚠️ Você precisa estar logado para enviar feedback.
              </p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit || sending || !user}
              className="w-full gradient-neon text-primary-foreground neon-glow gap-2"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Enviando..." : "Enviar Feedback"}
            </Button>
          </form>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Feedback;
