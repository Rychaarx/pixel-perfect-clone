import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserAddon {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  manifest_url: string;
  transport_url: string;
  types: string[];
  resources: string[];
  enabled: boolean;
  sort_order: number;
}

export interface StreamSource {
  addonId: string;
  addonName: string;
  addonLogo: string | null;
  name: string;
  title: string;
  url: string | null;
  ytId: string | null;
  infoHash: string | null;
  fileIdx: number | null;
  behaviorHints: any;
}

export function useAddons() {
  const { user } = useAuth();
  const [addons, setAddons] = useState<UserAddon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddons = useCallback(async () => {
    if (!user) {
      setAddons([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_addons")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });
    setAddons((data as UserAddon[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const validateManifest = useCallback(async (url: string) => {
    const { data, error } = await supabase.functions.invoke("stremio-manifest", {
      body: { url },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as {
      manifest_url: string;
      transport_url: string;
      id: string;
      name: string;
      description: string | null;
      logo: string | null;
      types: string[];
      resources: string[];
    };
  }, []);

  const addAddon = useCallback(
    async (manifestUrl: string) => {
      if (!user) throw new Error("Não autenticado");
      const m = await validateManifest(manifestUrl);
      const { error } = await supabase.from("user_addons").insert({
        user_id: user.id,
        name: m.name,
        description: m.description,
        logo_url: m.logo,
        manifest_url: m.manifest_url,
        transport_url: m.transport_url,
        types: m.types,
        resources: m.resources,
        enabled: true,
        sort_order: addons.length,
      });
      if (error) throw error;
      await fetchAddons();
    },
    [user, addons.length, validateManifest, fetchAddons]
  );

  const updateAddon = useCallback(
    async (id: string, patch: Partial<UserAddon>) => {
      const { error } = await supabase.from("user_addons").update(patch).eq("id", id);
      if (error) throw error;
      await fetchAddons();
    },
    [fetchAddons]
  );

  const removeAddon = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("user_addons").delete().eq("id", id);
      if (error) throw error;
      await fetchAddons();
    },
    [fetchAddons]
  );

  const fetchStreams = useCallback(
    async (imdbId: string, type: "movie" | "series", season?: number, episode?: number, sourceAddonId?: string) => {
      const { data, error } = await supabase.functions.invoke("stremio-streams", {
        body: { imdbId, type, season, episode, sourceAddonId },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as { streams: StreamSource[]; addons: number });
    },
    []
  );

  const fetchMeta = useCallback(
    async (imdbId: string, type: "movie" | "series", sourceAddonId?: string) => {
      const { data, error } = await supabase.functions.invoke("stremio-streams", {
        body: { action: "meta", imdbId, type, sourceAddonId },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as { meta: null | { id: string; imdb_id: string | null; name: string | null; type: string; videos: Array<{ id: string | null; season: number | null; episode: number | null; title: string | null; released: string | null; overview: string | null }> } }).meta;
    },
    []
  );

  return { addons, loading, addAddon, updateAddon, removeAddon, validateManifest, fetchStreams, fetchMeta };
}
