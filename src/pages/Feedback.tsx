import { useState } from "react";
import { Send, AlertTriangle, CheckCircle, Bug, MonitorX, HelpCircle, MessageSquareWarning } from "lucide-react";
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
  const [type, setType] = useState("Bug");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = title.trim().length > 0 && title.length <= MAX_TITLE && message.trim().length > 0 && message.length <= MAX_MESSAGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!user) {
      toast.error("Você precisa estar logado para reportar um problema.");
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
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }

    setSent(true);
    setTitle("");
    setMessage("");
    setType("Bug");
    toast.success("Problema reportado com sucesso!");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquareWarning className="w-6 h-6 text-destructive" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Reportar Problema</h1>
          </div>
          <p className="text-muted-foreground text-sm">Encontrou um erro, link quebrado ou algo fora do normal? Nos avise aqui.</p>
        </div>

        {sent ? (
          <div className="glass rounded-xl border border-border/30 p-8 text-center animate-scale-in">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Recebido!</h2>
            <p className="text-muted-foreground text-sm">Obrigado por nos ajudar a melhorar. Vamos investigar o problema.</p>
            <Button onClick={() => setSent(false)} variant="outline" className="mt-6">
              Reportar outro
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-xl border border-border/30 p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Assunto *</label>
              <Input
                placeholder="Ex: Vídeo não carrega, Link quebrado no episódio 3..."
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                className="bg-secondary/50 border-border/50"
                required
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{title.length}/{MAX_TITLE}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo do problema</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug">🐛 Bug / Erro</SelectItem>
                  <SelectItem value="Link quebrado">🔗 Link quebrado</SelectItem>
                  <SelectItem value="Vídeo não funciona">🎬 Vídeo não funciona</SelectItem>
                  <SelectItem value="Problema visual">🖥️ Problema visual</SelectItem>
                  <SelectItem value="Outro">💬 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição do problema *</label>
              <Textarea
                placeholder="Descreva o que aconteceu, em qual página estava e o que esperava que acontecesse..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                rows={5}
                className="bg-secondary/50 border-border/50 resize-none"
                required
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/{MAX_MESSAGE}</p>
            </div>

            {!user && (
              <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                ⚠️ Você precisa estar logado para reportar um problema.
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
                <AlertTriangle className="w-4 h-4" />
              )}
              {sending ? "Enviando..." : "Enviar Problema"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Feedback;
