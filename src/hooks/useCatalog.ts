import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CatalogStatus = "concluido" | "em_espera" | "na_lista";

export const statusConfig: Record<CatalogStatus, { label: string; icon: string; color: string; badgeClass: string }> = {
  concluido: { label: "Concluído", icon: "✅", color: "text-green-400", badgeClass: "bg-green-500/20 text-green-400" },
  em_espera: { label: "Em Espera", icon: "⏳", color: "text-amber-400", badgeClass: "bg-amber-500/20 text-amber-400" },
  na_lista: { label: "Na Lista", icon: "📝", color: "text-blue-400", badgeClass: "bg-blue-500/20 text-blue-400" },
};

export interface CatalogItem {
  id: string;
  title: string;
  type: "Filme" | "Série" | "Anime";
  status: CatalogStatus;
  imageUrl?: string;
  backdropUrl?: string;
  videoUrl?: string;
  redirectUrl?: string;
  year?: string;
  duration?: string;
  genres?: string[];
  synopsis?: string;
}

export function useCatalog() {
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("catalog_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(
        data.map((d: any) => ({
          id: d.id,
          title: d.title,
          type: d.type as CatalogItem["type"],
          status: d.status as CatalogItem["status"],
          imageUrl: d.image_url ?? undefined,
          backdropUrl: d.backdrop_url ?? undefined,
          videoUrl: d.video_url ?? undefined,
          redirectUrl: d.redirect_url ?? undefined,
          year: d.year ?? undefined,
          duration: d.duration ?? undefined,
          genres: d.genres ?? undefined,
          synopsis: d.synopsis ?? undefined,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const checkDuplicate = useCallback(
    (title: string, type: string): CatalogItem | undefined => {
      return items.find(
        (i) =>
          i.title.toLowerCase().trim() === title.toLowerCase().trim() &&
          i.type === type
      );
    },
    [items]
  );

  const addItem = useCallback(
    async (item: Omit<CatalogItem, "id">) => {
      if (!user) return null;

      const existing = checkDuplicate(item.title, item.type);
      if (existing) {
        return { duplicate: true, existing } as any;
      }

      const { data, error } = await supabase
        .from("catalog_items")
        .insert({
          user_id: user.id,
          title: item.title,
          type: item.type,
          status: item.status,
          image_url: item.imageUrl || null,
          video_url: item.videoUrl || null,
          redirect_url: item.redirectUrl || null,
          year: item.year || null,
          duration: item.duration || null,
          genres: item.genres || null,
          synopsis: item.synopsis || null,
        })
        .select()
        .single();

      if (!error && data) {
        await fetchItems();
        return data;
      }
      return null;
    },
    [user, fetchItems, checkDuplicate]
  );

  const removeItem = useCallback(
    async (id: string) => {
      await supabase.from("catalog_items").delete().eq("id", id);
      await fetchItems();
    },
    [fetchItems]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<CatalogItem>) => {
      const dbPatch: Record<string, any> = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.type !== undefined) dbPatch.type = patch.type;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl;
      if (patch.videoUrl !== undefined) dbPatch.video_url = patch.videoUrl;
      if (patch.redirectUrl !== undefined) dbPatch.redirect_url = patch.redirectUrl;
      if (patch.year !== undefined) dbPatch.year = patch.year;
      if (patch.duration !== undefined) dbPatch.duration = patch.duration;
      if (patch.genres !== undefined) dbPatch.genres = patch.genres;
      if (patch.synopsis !== undefined) dbPatch.synopsis = patch.synopsis;

      await supabase.from("catalog_items").update(dbPatch).eq("id", id);
      await fetchItems();
    },
    [fetchItems]
  );

  const getItem = useCallback(
    (id: string) => items.find((i) => i.id === id),
    [items]
  );

  return { items, loading, addItem, removeItem, updateItem, getItem };
}
