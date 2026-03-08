import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TmdbSearchResult {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  year: string;
  posterUrl: string | null;
  overview: string;
}

export interface TmdbDetail {
  id: number;
  title: string;
  year: string;
  duration: string;
  genres: string[];
  synopsis: string;
  posterUrl: string | null;
  trailerUrl: string | null;
  mediaType: "movie" | "tv";
}

export function useTmdbSearch() {
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-search?action=search&query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const json = await res.json();
      setResults(json.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDetails = useCallback(async (id: number, mediaType: string): Promise<TmdbDetail | null> => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-search?action=details&id=${id}&type=${mediaType}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const json = await res.json();
      return json.detail || null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar detalhes");
      return null;
    }
  }, []);

  return { results, loading, error, search, getDetails, setResults };
}
