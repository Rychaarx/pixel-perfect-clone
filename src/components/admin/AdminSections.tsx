import { useState } from "react";
import { useSections, Section } from "@/hooks/useSections";
import { useCatalog, CatalogItem } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical, X, Check } from "lucide-react";
import { toast } from "sonner";

const AdminSections = () => {
  const { sections, loading, createSection, updateSection, deleteSection, setSectionItems } = useSections();
  const { items: catalogItems } = useCatalog();
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Todos");
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("Todos");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState("");

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error("Título obrigatório"); return; }
    await createSection(newTitle.trim(), newType);
    setNewTitle("");
    toast.success("Seção criada!");
  };

  const handleUpdate = async () => {
    if (!editingSection || !editTitle.trim()) return;
    await updateSection(editingSection.id, { title: editTitle.trim(), content_type: editType });
    setEditingSection(null);
    toast.success("Seção atualizada!");
  };

  const handleDelete = async (section: Section) => {
    if (!confirm(`Excluir seção "${section.title}"?`)) return;
    await deleteSection(section.id);
    toast.success("Seção removida!");
  };

  const openItemPicker = (section: Section) => {
    setPickerSectionId(section.id);
    setSelectedItemIds(section.items.map((si) => si.catalog_item_id));
    setItemSearch("");
    setItemPickerOpen(true);
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveItems = async () => {
    if (!pickerSectionId) return;
    await setSectionItems(pickerSectionId, selectedItemIds);
    setItemPickerOpen(false);
    toast.success("Itens da seção atualizados!");
  };

  const filteredCatalog = catalogItems.filter((c) =>
    c.title.toLowerCase().includes(itemSearch.toLowerCase())
  );

  if (loading) return <div className="text-muted-foreground text-center py-12">Carregando seções...</div>;

  return (
    <div className="space-y-6">
      {/* Create new section */}
      <div className="glass rounded-xl border border-border/30 p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3">Nova Seção</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Título da seção"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-secondary/50 border-border/50"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="w-32 bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Filme">Filmes</SelectItem>
              <SelectItem value="Série">Séries</SelectItem>
              <SelectItem value="Anime">Animes</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} className="gradient-neon text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Criar
          </Button>
        </div>
      </div>

      {/* Sections list */}
      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma seção criada</div>
        ) : (
          sections.map((section) => (
            <div key={section.id} className="glass rounded-xl border border-border/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground truncate">{section.title}</h4>
                    <p className="text-xs text-muted-foreground">{section.content_type} · {section.items.length} itens</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openItemPicker(section)} className="text-xs gap-1">
                    <Plus className="w-3 h-3" /> Itens
                  </Button>
                  <button
                    onClick={() => { setEditingSection(section); setEditTitle(section.title); setEditType(section.content_type); }}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(section)}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Show items thumbnails */}
              {section.items.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {section.items.map((si) => {
                    const ci = catalogItems.find((c) => c.id === si.catalog_item_id);
                    if (!ci) return null;
                    return (
                      <div key={si.id} className="shrink-0 w-12">
                        <img
                          src={ci.imageUrl || "/placeholder.svg"}
                          alt={ci.title}
                          className="w-12 h-16 rounded object-cover"
                          title={ci.title}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit section dialog */}
      <Dialog open={!!editingSection} onOpenChange={(o) => !o && setEditingSection(null)}>
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Editar Seção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-secondary/50 border-border/50" />
            <Select value={editType} onValueChange={setEditType}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Filme">Filmes</SelectItem>
                <SelectItem value="Série">Séries</SelectItem>
                <SelectItem value="Anime">Animes</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditingSection(null)}>Cancelar</Button>
              <Button onClick={handleUpdate} className="gradient-neon text-primary-foreground">Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item picker dialog */}
      <Dialog open={itemPickerOpen} onOpenChange={setItemPickerOpen}>
        <DialogContent className="glass border-border/50 max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Selecionar Itens</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <Input
              placeholder="Buscar..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 mt-2 min-h-0">
            {filteredCatalog.map((item) => {
              const selected = selectedItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    selected ? "bg-primary/20 text-foreground" : "hover:bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary" : "border-border"}`}>
                    {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="w-8 h-11 rounded object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">{selectedItemIds.length} selecionados</span>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setItemPickerOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={saveItems} className="gradient-neon text-primary-foreground">Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSections;
