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

    const headers = {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      Origin: "https://web.stremio.com",
      Referer: "https://web.stremio.com/",
    };
    const doFetch = async (u: string) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      try {
        return await fetch(u, { signal: ctrl.signal, headers });
      } finally {
        clearTimeout(t);
      }
    };
    let res = await doFetch(manifestUrl);
    if (res.status === 403 || res.status === 429) {
      await new Promise((r) => setTimeout(r, 800));
      res = await doFetch(manifestUrl);
    }
    if (!res.ok) {
      const msg =
        res.status === 403
          ? "O servidor do addon bloqueou o acesso (403). Verifique se a URL está correta/configurada ou tente outro addon."
          : `Manifest retornou ${res.status}`;
      return json({ error: msg }, 200);
    }
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
