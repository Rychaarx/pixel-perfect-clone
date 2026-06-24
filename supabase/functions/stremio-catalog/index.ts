// Lists catalogs from user's enabled addons and fetches catalog items on demand.
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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "list";

    if (action === "list") {
      const { data: addons } = await admin
        .from("user_addons")
        .select("*")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .order("sort_order", { ascending: true });

      if (!addons?.length) return json({ addons: [] });

      const results = await Promise.allSettled(
        addons.map(async (a: any) => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 8000);
          try {
            const r = await fetch(a.manifest_url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
            clearTimeout(t);
            if (!r.ok) return { addon: a, catalogs: [] };
            const m = await r.json();
            const catalogs = Array.isArray(m?.catalogs) ? m.catalogs : [];
            return { addon: a, catalogs };
          } catch {
            clearTimeout(t);
            return { addon: a, catalogs: [] };
          }
        })
      );

      const out = results
        .filter((r) => r.status === "fulfilled")
        .map((r: any) => r.value)
        .filter((v: any) => v.catalogs.length > 0)
        .map((v: any) => ({
          addonId: v.addon.id,
          addonName: v.addon.name,
          addonLogo: v.addon.logo_url,
          transport_url: v.addon.transport_url,
          catalogs: v.catalogs.map((c: any) => ({
            type: c.type,
            id: c.id,
            name: c.name ?? c.id,
            genres: Array.isArray(c.genres) ? c.genres : [],
          })),
        }));

      return json({ addons: out });
    }

    if (action === "fetch") {
      const { addonId, type, id, skip, genre, search } = body ?? {};
      if (!addonId || !type || !id) return json({ error: "params" }, 400);

      const { data: addon } = await admin
        .from("user_addons")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", addonId)
        .maybeSingle();
      if (!addon) return json({ error: "Addon não encontrado" }, 404);

      const extras: string[] = [];
      if (typeof skip === "number" && skip > 0) extras.push(`skip=${skip}`);
      if (genre) extras.push(`genre=${encodeURIComponent(genre)}`);
      if (search) extras.push(`search=${encodeURIComponent(search)}`);
      const extraStr = extras.length ? `/${extras.join("&")}` : "";
      const url = `${addon.transport_url}/catalog/${type}/${encodeURIComponent(id)}${extraStr}.json`;

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      try {
        const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        clearTimeout(t);
        if (!r.ok) return json({ items: [], error: `HTTP ${r.status}` });
        const data = await r.json();
        const metas = Array.isArray(data?.metas) ? data.metas : [];
        return json({
          items: metas.map((m: any) => ({
            id: m.id,
            type: m.type ?? type,
            name: m.name,
            poster: m.poster ?? m.posterShape ?? null,
            background: m.background ?? null,
            description: m.description ?? null,
            releaseInfo: m.releaseInfo ?? null,
            imdbRating: m.imdbRating ?? null,
            genres: Array.isArray(m.genres) ? m.genres : [],
          })),
        });
      } catch (e) {
        clearTimeout(t);
        return json({ items: [], error: e instanceof Error ? e.message : "fail" });
      }
    }

    return json({ error: "ação inválida" }, 400);
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
