import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface FeedbackItem {
  id: string;
  title: string;
  type: string;
  message: string | null;
  created_at: string;
}

const AdminFeedback = () => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("feedback_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data as FeedbackItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este feedback?")) return;
    const { error } = await supabase.from("feedback_requests").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Feedback removido!");
  };

  if (loading) return <div className="text-muted-foreground text-center py-12">Carregando feedbacks...</div>;

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl border border-border/30 p-4 flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">{items.length} feedback{items.length !== 1 ? "s" : ""} recebido{items.length !== 1 ? "s" : ""}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Nenhum feedback recebido ainda.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-xl border border-border/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">{item.type}</span>
                  </div>
                  {item.message && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
