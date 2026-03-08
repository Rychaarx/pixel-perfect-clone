import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FavoriteItem {
  id: string;
  catalog_item_id: string;
  created_at: string;
  title: string;
  imageUrl?: string;
  type: string;
  year?: string;
  status: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("*, catalog_items(title, image_url, type, year, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFavorites(
        data.map((row: any) => ({
          id: row.id,
          catalog_item_id: row.catalog_item_id,
          created_at: row.created_at,
          title: row.catalog_items?.title || "",
          imageUrl: row.catalog_items?.image_url || undefined,
          type: row.catalog_items?.type || "",
          year: row.catalog_items?.year || undefined,
          status: row.catalog_items?.status || "",
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(
    async (catalogItemId: string) => {
      if (!user) return;
      const exists = favorites.some((f) => f.catalog_item_id === catalogItemId);
      if (exists) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("catalog_item_id", catalogItemId);
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          catalog_item_id: catalogItemId,
        });
      }
      await fetchFavorites();
    },
    [user, favorites, fetchFavorites]
  );

  const isFavorite = useCallback(
    (catalogItemId: string) => favorites.some((f) => f.catalog_item_id === catalogItemId),
    [favorites]
  );

  return { favorites, loading, toggleFavorite, isFavorite, refetch: fetchFavorites };
}
