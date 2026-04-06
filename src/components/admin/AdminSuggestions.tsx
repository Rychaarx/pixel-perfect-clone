import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  title: string;
  type: string;
  message: string | null;
  status: string;
  created_at: string;
  user_id: string;
  profile_name?: string;
}

const statusOptions = [
  { value: "pendente", label: "⏳ Pendente", class: "bg-amber-500/20 text-amber-400" },
  { value: "aprovado", label: "✅ Aprovado", class: "bg-green-500/20 text-green-400" },
  { value: "recusado", label: "❌ Recusado", class: "bg-destructive/20 text-destructive" },
  { value: "adicionado", label: "🎬 Adicionado", class: "bg-primary/20 text-primary" },
];

const AdminSuggestions = () => {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    // Fetch suggestions
    const { data: suggestionsData } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!suggestionsData) { setLoading(false); return; }

    // Fetch profile names for all user_ids
    const userIds = [...new Set(suggestionsData.map((s: any) => s.user_id))];
    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", userIds)
      .eq("is_default", true);

    const profileMap = new Map<string, string>();
    if (profilesData) {
      profilesData.forEach((p: any) => profileMap.set(p.user_id, p.name));
    }

    setItems(
      suggestionsData.map((s: any) => ({
        ...s,
        profile_name: profileMap.get(s.user_id) || "Usuário",
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("suggestions").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }

    const suggestion = items.find((i) => i.id === id);

    // When marked as "adicionado", add to catalog and notify user
    if (status === "adicionado" && suggestion) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        // Check if already in catalog
        const { data: existing } = await supabase
          .from("catalog_items")
          .select("id")
          .ilike("title", suggestion.title)
          .maybeSingle();

        if (!existing) {
          const { error: catalogError } = await supabase.from("catalog_items").insert({
            user_id: userId,
            title: suggestion.title,
            type: suggestion.type,
            status: "na_lista",
          });
          if (catalogError) {
            toast.error("Erro ao adicionar ao catálogo");
          } else {
            toast.success("Título adicionado ao catálogo!");
          }
        }

        // Notify the person who suggested
        await supabase.from("notifications").insert({
          user_id: suggestion.user_id,
          title: "Sugestão adicionada! 🎉",
          message: `"${suggestion.title}" foi adicionado ao catálogo. Em breve estará disponível para assistir!`,
          type: "suggestion_added",
          catalog_item_id: existing?.id || null,
        });
      }
    }

    // Notify on status change (approved/rejected)
    if (suggestion && (status === "aprovado" || status === "recusado")) {
      const statusMsg = status === "aprovado"
        ? `Sua sugestão "${suggestion.title}" foi aprovada! Em breve será adicionada.`
        : `Sua sugestão "${suggestion.title}" foi analisada mas não será adicionada no momento.`;

      await supabase.from("notifications").insert({
        user_id: suggestion.user_id,
        title: status === "aprovado" ? "Sugestão aprovada! ✅" : "Sugestão analisada",
        message: statusMsg,
        type: `suggestion_${status}`,
      });
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    if (status !== "adicionado") toast.success("Status atualizado!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta sugestão?")) return;
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Sugestão removida!");
  };

  const counts = {
    total: items.length,
    pendente: items.filter((i) => i.status === "pendente").length,
    aprovado: items.filter((i) => i.status === "aprovado").length,
    adicionado: items.filter((i) => i.status === "adicionado").length,
  };

  if (loading) return <div className="text-muted-foreground text-center py-12">Carregando sugestões...</div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 border border-border/30">
          <p className="text-2xl font-display font-bold text-foreground">{counts.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border/30">
          <p className="text-2xl font-display font-bold text-amber-400">{counts.pendente}</p>
          <p className="text-xs text-muted-foreground">⏳ Pendentes</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border/30">
          <p className="text-2xl font-display font-bold text-green-400">{counts.aprovado}</p>
          <p className="text-xs text-muted-foreground">✅ Aprovados</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border/30">
          <p className="text-2xl font-display font-bold text-primary">{counts.adicionado}</p>
          <p className="text-xs text-muted-foreground">🎬 Adicionados</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Nenhuma sugestão recebida.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-xl border border-border/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">{item.type}</span>
                  </div>
                  {/* Profile name */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-primary font-medium">{item.profile_name}</span>
                  </div>
                  {item.message && <p className="text-sm text-muted-foreground mt-1">{item.message}</p>}
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={item.status} onValueChange={(v) => updateStatus(item.id, v)}>
                    <SelectTrigger className="w-36 bg-secondary/50 border-border/50 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSuggestions;
