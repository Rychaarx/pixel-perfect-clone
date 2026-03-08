import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WatchedMovie {
  id: string;
  catalog_item_id: string;
  watched_at: string;
  progress: number;
  title: string;
  imageUrl?: string;
  type: string;
  year?: string;
}

export function useWatchedMovies() {
  const { user } = useAuth();
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchedMovies = useCallback(async () => {
    if (!user) {
      setWatchedMovies([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("watched_movies")
      .select("*, catalog_items(title, image_url, type, year)")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false });

    if (!error && data) {
      setWatchedMovies(
        data.map((row: any) => ({
          id: row.id,
          catalog_item_id: row.catalog_item_id,
          watched_at: row.watched_at,
          progress: row.progress ?? 0,
          title: row.catalog_items?.title || "",
          imageUrl: row.catalog_items?.image_url || undefined,
          type: row.catalog_items?.type || "",
          year: row.catalog_items?.year || undefined,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWatchedMovies();
  }, [fetchWatchedMovies]);

  const setMovieProgress = useCallback(
    async (catalogItemId: string, progress: number) => {
      if (!user) return;
      await supabase.from("watched_movies").upsert(
        {
          user_id: user.id,
          catalog_item_id: catalogItemId,
          progress: Math.min(100, Math.max(0, progress)),
          watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,catalog_item_id" }
      );
      await fetchWatchedMovies();
    },
    [user, fetchWatchedMovies]
  );

  const markMovieWatched = useCallback(
    async (catalogItemId: string) => setMovieProgress(catalogItemId, 100),
    [setMovieProgress]
  );

  const unmarkMovieWatched = useCallback(
    async (catalogItemId: string) => {
      if (!user) return;
      await supabase
        .from("watched_movies")
        .delete()
        .eq("user_id", user.id)
        .eq("catalog_item_id", catalogItemId);
      await fetchWatchedMovies();
    },
    [user, fetchWatchedMovies]
  );

  const isMovieWatched = useCallback(
    (catalogItemId: string) => watchedMovies.some((m) => m.catalog_item_id === catalogItemId),
    [watchedMovies]
  );

  const getMovieProgress = useCallback(
    (catalogItemId: string) => watchedMovies.find((m) => m.catalog_item_id === catalogItemId)?.progress ?? 0,
    [watchedMovies]
  );

  return {
    watchedMovies,
    loading,
    markMovieWatched,
    unmarkMovieWatched,
    isMovieWatched,
    getMovieProgress,
    setMovieProgress,
    refetch: fetchWatchedMovies,
  };
}
