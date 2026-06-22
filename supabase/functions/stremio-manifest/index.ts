// Fetches and validates a Stremio addon manifest (server-side to bypass CORS).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return json({ error: "URL inválida" }, 400);
    }

    // Normalize: ensure ends with /manifest.json
    let manifestUrl = url.trim();
    if (!manifestUrl.endsWith("/manifest.json")) {
      manifestUrl = manifestUrl.replace(/\/$/, "") + "/manifest.json";
    }
    const transportUrl = manifestUrl.replace(/\/manifest\.json$/, "");

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(manifestUrl, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    clearTimeout(t);
    if (!res.ok) return json({ error: `Manifest retornou ${res.status}` }, 400);
    const manifest = await res.json();

    if (!manifest?.id || !manifest?.name) {
      return json({ error: "Manifest inválido (faltando id/name)" }, 400);
    }

    return json({
      manifest_url: manifestUrl,
      transport_url: transportUrl,
      id: manifest.id,
      name: manifest.name,
      description: manifest.description ?? null,
      logo: manifest.logo ?? manifest.icon ?? null,
      types: Array.isArray(manifest.types) ? manifest.types : [],
      resources: Array.isArray(manifest.resources)
        ? manifest.resources.map((r: any) => (typeof r === "string" ? r : r?.name)).filter(Boolean)
        : [],
      idPrefixes: Array.isArray(manifest.idPrefixes) ? manifest.idPrefixes : [],
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
