// Aggregates Stremio streams from all enabled addons of the authenticated user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Token inválido" }, 401);

    const body = await req.json();
    const { imdbId, type, season, episode, sourceAddonId } = body ?? {};
    if (!imdbId || typeof imdbId !== "string") return json({ error: "id inválido" }, 400);
    if (!type || !["movie", "series"].includes(type)) return json({ error: "type inválido" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: addons } = await admin
      .from("user_addons")
      .select("*")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    if (!addons || addons.length === 0) return json({ streams: [], addons: 0 });

    // Resolve to IMDB id when the incoming id isn't already tt-prefixed.
    let resolvedImdb = /^tt\d+/.test(imdbId) ? imdbId.split(":")[0] : null;
    if (!resolvedImdb) {
      // Try the source addon first (it knows its own id), then fall back to any addon with `meta`.
      const metaCandidates = [
        ...(sourceAddonId ? addons.filter((a: any) => a.id === sourceAddonId) : []),
        ...addons.filter((a: any) => Array.isArray(a.resources) && a.resources.includes("meta")),
      ];
      for (const a of metaCandidates) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 6000);
          const r = await fetch(`${a.transport_url}/meta/${type}/${encodeURIComponent(imdbId)}.json`, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" },
          });
          clearTimeout(t);
          if (!r.ok) continue;
          const d = await r.json();
          const imdb = d?.meta?.imdb_id || d?.meta?.imdbId;
          if (imdb && /^tt\d+/.test(imdb)) {
            resolvedImdb = imdb;
            break;
          }
        } catch { /* try next */ }
      }
    }

    const baseId = resolvedImdb ?? imdbId;
    const streamId =
      type === "series" && season != null && episode != null
        ? `${baseId}:${season}:${episode}`
        : baseId;

    const results = await Promise.allSettled(
      addons
        .filter((a: any) => Array.isArray(a.resources) && a.resources.includes("stream"))
        .filter((a: any) => !a.types?.length || a.types.includes(type))
        .map(async (a: any) => {
          const url = `${a.transport_url}/stream/${type}/${streamId}.json`;
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 8000);
          try {
            const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
            clearTimeout(t);
            if (!r.ok) return { addon: a, streams: [] };
            const data = await r.json();
            return { addon: a, streams: Array.isArray(data?.streams) ? data.streams : [] };
          } catch {
            clearTimeout(t);
            return { addon: a, streams: [] };
          }
        })
    );

    const aggregated: any[] = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const { addon, streams } = r.value;
      for (const s of streams) {
        aggregated.push({
          addonId: addon.id,
          addonName: addon.name,
          addonLogo: addon.logo_url ?? null,
          name: s.name ?? addon.name,
          title: s.title ?? s.description ?? "",
          url: s.url ?? null,
          ytId: s.ytId ?? null,
          infoHash: s.infoHash ?? null,
          fileIdx: s.fileIdx ?? null,
          behaviorHints: s.behaviorHints ?? null,
        });
      }
    }

    // Dedupe by url + infoHash
    const seen = new Set<string>();
    const deduped = aggregated.filter((s) => {
      const k = `${s.url ?? ""}|${s.infoHash ?? ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return json({ streams: deduped, addons: addons.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
