import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManualSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTitle?: string;
  defaultTmdbId?: string;
  defaultMediaType?: string;
  onSaved?: () => void;
}

const ManualSourceDialog = ({
  open,
  onOpenChange,
  defaultTitle = "",
  defaultTmdbId,
  defaultMediaType = "movie",
  onSaved,
}: ManualSourceDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(defaultTitle);
  const [url, setUrl] = useState("");
  const [mediaType, setMediaType] = useState(defaultMediaType);
  const [sourceType, setSourceType] = useState("direct");
  const [saving, setSaving] = useState(false);

  // Reset fields when dialog opens with new defaults
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setTitle(defaultTitle);
      setUrl("");
      setMediaType(defaultMediaType);
      setSourceType("direct");
    }
    onOpenChange(o);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Você precisa estar logado.");
      return;
    }
    if (!title.trim()) {
      toast.error("Informe o título.");
      return;
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      toast.error("Informe um link válido (http/https).");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("user_manual_sources").insert({
      user_id: user.id,
      title: title.trim(),
      url: url.trim(),
      media_type: mediaType,
      source_type: sourceType,
      tmdb_id: defaultTmdbId ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar a fonte.");
      return;
    }
    toast.success("Fonte manual salva!");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" /> Adicionar fonte manual
          </DialogTitle>
          <DialogDescription>
            Cadastre um link para assistir quando os addons não entregam o título.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ms-title">Título</Label>
            <Input
              id="ms-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do filme/série"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ms-url">Link</Label>
            <Input
              id="ms-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={mediaType} onValueChange={setMediaType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Filme</SelectItem>
                  <SelectItem value="series">Série</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Formato do link</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Vídeo direto (mp4/m3u8)</SelectItem>
                  <SelectItem value="embed">Página/embed</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar fonte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualSourceDialog;
