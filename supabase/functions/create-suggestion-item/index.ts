import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify the user is authenticated
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { title, type, year, duration, genres, synopsis, posterUrl, backdropUrl, seasons } = body;

    if (!title || !type) {
      return new Response(JSON.stringify({ error: "Missing title or type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if item already exists
    const { data: existing } = await adminClient
      .from("catalog_items")
      .select("id")
      .ilike("title", title)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Already exists", id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create catalog item with the authenticated user's ID
    const { data: newItem, error: insertError } = await adminClient.from("catalog_items").insert({
      user_id: user.id,
      title,
      type,
      status: "na_lista",
      year: year || null,
      duration: duration || null,
      genres: genres || null,
      synopsis: synopsis || null,
      image_url: posterUrl || null,
      backdrop_url: backdropUrl || null,
    }).select("id").single();

    if (insertError || !newItem) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create catalog item" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create seasons and episodes if provided
    if (seasons && Array.isArray(seasons) && seasons.length > 0) {
      for (const season of seasons) {
        const { data: sData } = await adminClient.from("seasons").insert({
          catalog_item_id: newItem.id,
          season_number: season.seasonNumber,
          name: season.name || null,
        }).select("id").single();

        if (sData && season.episodes && season.episodes.length > 0) {
          await adminClient.from("episodes").insert(
            season.episodes.map((ep: any) => ({
              season_id: sData.id,
              episode_number: ep.episodeNumber,
              title: ep.title || "",
              duration: ep.duration || null,
            }))
          );
        }
      }
    }

    return new Response(JSON.stringify({ success: true, id: newItem.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
