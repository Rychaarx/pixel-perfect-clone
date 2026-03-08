import { useState } from "react";
import { useCatalog, CatalogItem, CatalogStatus, statusConfig } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  title: "", type: "Filme" as CatalogItem["type"], status: "na_lista" as CatalogStatus,
  imageUrl: "", videoUrl: "", redirectUrl: "", year: "", duration: "", genres: "", synopsis: "",
};

const AdminCatalog = () => {
  const { items, loading, addItem, removeItem, updateItem } = useCatalog();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = items.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || i.type === filterType;
    return matchSearch && matchType;
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title, type: item.type, status: item.status,
      imageUrl: item.imageUrl || "", videoUrl: item.videoUrl || "",
      redirectUrl: item.redirectUrl || "", year: item.year || "",
      duration: item.duration || "", genres: item.genres?.join(", ") || "",
      synopsis: item.synopsis || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    const payload = {
      title: form.title, type: form.type, status: form.status,
      imageUrl: form.imageUrl || undefined, videoUrl: form.videoUrl || undefined,
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
              <Input placeholder="URL da Imagem" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-secondary/50 border-border/50" />
              <Input placeholder="URL de Redirecionamento" value={form.redirectUrl} onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })} className="bg-secondary/50 border-border/50" />
              <Input placeholder="URL do Vídeo" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="bg-secondary/50 border-border/50" />
              <Textarea placeholder="Sinopse" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} rows={3} className="bg-secondary/50 border-border/50" />
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
