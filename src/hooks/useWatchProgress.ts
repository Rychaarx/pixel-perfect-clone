import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WatchProgressItem {
  id: string;
  episode_id: string;
  catalog_item_id: string;
  watched: boolean;
  last_watched_at: string;
}

export interface ContinueWatchingEntry {
  catalog_item_id: string;
  title: string;
  imageUrl?: string;
  type: string;
  last_watched_at: string;
  next_episode_number: number;
  next_episode_title: string;
  next_episode_id: string;
  next_episode_redirect_url: string;
  season_number: number;
  season_name: string;
  total_episodes: number;
  watched_episodes: number;
}

export function useWatchProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<WatchProgressItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress([]);
      setContinueWatching([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("watch_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("last_watched_at", { ascending: false });

    if (!error && data) {
      setProgress(data as WatchProgressItem[]);
    }
    setLoading(false);
  }, [user]);

  // Build "continue watching" list from progress + catalog + seasons
  const buildContinueWatching = useCallback(async () => {
    if (!user || progress.length === 0) {
      setContinueWatching([]);
      return;
    }

    // Get unique catalog item IDs that have watch progress
    const catalogItemIds = [...new Set(progress.map((p) => p.catalog_item_id))];

    // Fetch catalog items
    const { data: catalogData } = await supabase
      .from("catalog_items")
      .select("*")
      .in("id", catalogItemIds);

    if (!catalogData) return;

    const entries: ContinueWatchingEntry[] = [];

    for (const catalogItem of catalogData) {
      // Only series/anime have episodes
      if (catalogItem.type.toLowerCase() !== "série" && catalogItem.type.toLowerCase() !== "anime") continue;

      // Fetch seasons and episodes for this catalog item
      const { data: seasonsData } = await supabase
        .from("seasons")
        .select("*")
        .eq("catalog_item_id", catalogItem.id)
        .order("season_number");

      if (!seasonsData || seasonsData.length === 0) continue;

      // Fetch all episodes for all seasons
      const seasonIds = seasonsData.map((s) => s.id);
      const { data: episodesData } = await supabase
        .from("episodes")
        .select("*")
        .in("season_id", seasonIds)
        .order("episode_number");

      if (!episodesData || episodesData.length === 0) continue;

      // Map watched episode IDs
      const watchedEpisodeIds = new Set(
        progress.filter((p) => p.catalog_item_id === catalogItem.id && p.watched).map((p) => p.episode_id)
      );

      const totalEps = episodesData.length;
      const watchedEps = watchedEpisodeIds.size;

      // If all episodes are watched, don't show in continue watching
      if (watchedEps >= totalEps) continue;

      // Find next unwatched episode (ordered by season then episode number)
      const orderedEpisodes = seasonsData.flatMap((season) =>
        (episodesData.filter((ep) => ep.season_id === season.id) || []).map((ep) => ({
          ...ep,
          season_number: season.season_number,
          season_name: season.name || `Temporada ${season.season_number}`,
        }))
      );

      const nextEp = orderedEpisodes.find((ep) => !watchedEpisodeIds.has(ep.id));
      if (!nextEp) continue;

      // Last watched timestamp
      const itemProgress = progress
        .filter((p) => p.catalog_item_id === catalogItem.id)
        .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime());

      entries.push({
        catalog_item_id: catalogItem.id,
        title: catalogItem.title,
        imageUrl: catalogItem.image_url || undefined,
        type: catalogItem.type,
        last_watched_at: itemProgress[0]?.last_watched_at || "",
        next_episode_number: nextEp.episode_number,
        next_episode_title: nextEp.title || `Episódio ${nextEp.episode_number}`,
        next_episode_id: nextEp.id,
        next_episode_redirect_url: nextEp.redirect_url || "",
        season_number: nextEp.season_number,
        season_name: nextEp.season_name,
        total_episodes: totalEps,
        watched_episodes: watchedEps,
      });
    }

    // Sort by most recently watched
    entries.sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime());
    setContinueWatching(entries);
  }, [user, progress]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    buildContinueWatching();
  }, [buildContinueWatching]);

  const markEpisodeWatched = useCallback(
    async (episodeId: string, catalogItemId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("watch_progress")
        .upsert(
          {
            user_id: user.id,
            episode_id: episodeId,
            catalog_item_id: catalogItemId,
            watched: true,
            last_watched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,episode_id" }
        );
      if (!error) await fetchProgress();
    },
    [user, fetchProgress]
  );

  const unmarkEpisodeWatched = useCallback(
    async (episodeId: string) => {
      if (!user) return;
      await supabase
        .from("watch_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("episode_id", episodeId);
      await fetchProgress();
    },
    [user, fetchProgress]
  );

  const isEpisodeWatched = useCallback(
    (episodeId: string) => {
      return progress.some((p) => p.episode_id === episodeId && p.watched);
    },
    [progress]
  );

  return {
    progress,
    continueWatching,
    loading,
    markEpisodeWatched,
    unmarkEpisodeWatched,
    isEpisodeWatched,
    refetch: fetchProgress,
  };
}
