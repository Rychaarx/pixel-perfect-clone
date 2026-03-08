import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Season {
  id?: string;
  catalog_item_id?: string;
  season_number: number;
  name: string;
  episodes: Episode[];
}

export interface Episode {
  id?: string;
  season_id?: string;
  episode_number: number;
  title: string;
  duration: string;
  redirect_url: string;
}

export function useSeasons() {
  const [loading, setLoading] = useState(false);

  const fetchSeasons = useCallback(async (catalogItemId: string): Promise<Season[]> => {
    const { data: seasonsData } = await supabase
      .from("seasons")
      .select("*")
      .eq("catalog_item_id", catalogItemId)
      .order("season_number");

    if (!seasonsData) return [];

    const seasons: Season[] = [];
    for (const s of seasonsData) {
      const { data: epsData } = await supabase
        .from("episodes")
        .select("*")
        .eq("season_id", s.id)
        .order("episode_number");

      seasons.push({
        id: s.id,
        catalog_item_id: s.catalog_item_id,
        season_number: s.season_number,
        name: s.name || "",
        episodes: (epsData || []).map((e: any) => ({
          id: e.id,
          season_id: e.season_id,
          episode_number: e.episode_number,
          title: e.title,
          duration: e.duration || "",
          redirect_url: e.redirect_url || "",
        })),
      });
    }
    return seasons;
  }, []);

  const saveSeasons = useCallback(async (catalogItemId: string, seasons: Season[]) => {
    setLoading(true);
    try {
      await supabase.from("seasons").delete().eq("catalog_item_id", catalogItemId);

      for (const season of seasons) {
        const { data: sData } = await supabase
          .from("seasons")
          .insert({
            catalog_item_id: catalogItemId,
            season_number: season.season_number,
            name: season.name || null,
          })
          .select()
          .single();

        if (sData && season.episodes.length > 0) {
          await supabase.from("episodes").insert(
            season.episodes.map((ep) => ({
              season_id: sData.id,
              episode_number: ep.episode_number,
              title: ep.title || "",
              duration: ep.duration || null,
              redirect_url: ep.redirect_url || null,
            }))
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchSeasons, saveSeasons, loading };
}

export function createEmptySeason(num: number): Season {
  return {
    season_number: num,
    name: `Temporada ${num}`,
    episodes: [createEmptyEpisode(1)],
  };
}

export function createEmptyEpisode(num: number): Episode {
  return {
    episode_number: num,
    title: "",
    duration: "",
    redirect_url: "",
  };
}
