import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const ANIMATION_GENRE_ID = 16;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  if (!TMDB_API_KEY) {
    return new Response(JSON.stringify({ error: "TMDB_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "search") {
      const query = url.searchParams.get("query");
      if (!query) {
        return new Response(JSON.stringify({ error: "Missing query" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(
        `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`
      );
      const data = await res.json();

      const results = (data.results || [])
        .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
        .slice(0, 10)
        .map((r: any) => {
          const isTV = r.media_type === "tv";
          const genreIds: number[] = r.genre_ids || [];
          const isAnime = isTV && genreIds.includes(ANIMATION_GENRE_ID);
          return {
            id: r.id,
            title: r.media_type === "movie" ? r.title : r.name,
            mediaType: r.media_type === "movie" ? "movie" : "tv",
            isAnime,
            year: (r.media_type === "movie" ? r.release_date : r.first_air_date)?.substring(0, 4) || "",
            posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
            overview: r.overview || "",
          };
        });

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details") {
      const id = url.searchParams.get("id");
      const type = url.searchParams.get("type") || "movie";

      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const detailRes = await fetch(
        `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos`
      );
      const d = await detailRes.json();

      const trailer = (d.videos?.results || []).find(
        (v: any) => v.type === "Trailer" && v.site === "YouTube"
      );

      const genres: string[] = (d.genres || []).map((g: any) => g.name);
      const isAnime = type === "tv" && genres.some((g: string) => g.toLowerCase() === "animação" || g.toLowerCase() === "animation");

      const detail: any = {
        id: d.id,
        title: type === "movie" ? d.title : d.name,
        year: (type === "movie" ? d.release_date : d.first_air_date)?.substring(0, 4) || "",
        duration: type === "movie" ? `${d.runtime}min` : `${d.number_of_seasons} temporada(s)`,
        genres,
        synopsis: d.overview || "",
        posterUrl: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
        backdropUrl: d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : null,
        trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
        mediaType: type,
        isAnime,
      };

      // For TV shows, fetch all seasons with episodes
      if (type === "tv" && d.number_of_seasons > 0) {
        const seasons: any[] = [];
        const seasonNumbers = Array.from({ length: d.number_of_seasons }, (_, i) => i + 1);

        const seasonPromises = seasonNumbers.map(async (num) => {
          const sRes = await fetch(
            `${TMDB_BASE}/tv/${id}/season/${num}?api_key=${TMDB_API_KEY}&language=pt-BR`
          );
          if (!sRes.ok) return null;
          const sData = await sRes.json();
          return {
            seasonNumber: sData.season_number ?? num,
            name: sData.name || `Temporada ${num}`,
            episodes: (sData.episodes || []).map((ep: any) => ({
              episodeNumber: ep.episode_number,
              title: ep.name || `Episódio ${ep.episode_number}`,
              duration: ep.runtime ? `${ep.runtime}min` : null,
            })),
          };
        });

        const seasonResults = await Promise.all(seasonPromises);
        for (const s of seasonResults) {
          if (s) seasons.push(s);
        }

        detail.seasons = seasons;
      }

      return new Response(JSON.stringify({ detail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
