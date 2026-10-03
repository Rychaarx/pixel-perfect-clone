// Uses Lovable AI to diagnose add-on setup/access problems.
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const RUN = "X-Lovable-AIG-Run-ID";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function probe(url: string) {
  try {
    const u = url.endsWith("/manifest.json") ? url : url.replace(/\/$/, "") + "/manifest.json";
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(u, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    clearTimeout(t);
    const text = (await r.text()).slice(0, 600);
    return `GET ${u} -> HTTP ${r.status}; content-type=${r.headers.get("content-type")}; body: ${text}`;
  } catch (e) {
    return `Falha de rede ao acessar: ${e instanceof Error ? e.message : String(e)}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim().slice(0, 1000) : "";
    const errorDetails = typeof body.errorDetails === "string" ? body.errorDetails.slice(0, 3000) : "";
    if (!/^https?:\/\//i.test(url)) return json({ error: "Informe uma URL válida (http/https)." }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "IA não configurada." }, 500);

    const probeResult = await probe(url);

    let runId = req.headers.get(RUN)?.trim() || undefined;
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (runId && !h.has(RUN)) h.set(RUN, runId);
        const res = await fetch(input, { ...init, headers: h });
        runId ??= res.headers.get(RUN)?.trim() || undefined;
        if (!res.ok) {
          const err: any = new Error((await res.clone().text()).slice(0, 300));
          err.status = res.status;
          throw err;
        }
        return res;
      },
    });

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      abortSignal: req.signal,
      system:
        "Você é um especialista em addons Stremio (manifest.json, transport URL, catalogs, streams, debrid). " +
        "Responda em português do Brasil, em markdown curto: '## Causa provável' (1-3 itens) e '## Como corrigir' (passos numerados e concretos). " +
        "Seja direto, no máximo 200 palavras. Não sugira pirataria nem burlar bloqueios.",
      prompt: `URL do addon: ${url}\nErro informado pelo usuário: ${errorDetails || "(nenhum)"}\nTeste do servidor: ${probeResult}`,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    let text: string;
    try {
      text = await result.text;
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode ?? e?.cause?.status;
      if (status === 429) return json({ error: "Muitas solicitações. Tente novamente em instantes." }, 429);
      if (status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }, 402);
      if (status === 403) return json({ error: "Acesso à IA bloqueado para este workspace." }, 403);
      throw e;
    }
    const headers: Record<string, string> = {};
    if (runId) headers[RUN] = runId;
    return new Response(JSON.stringify({ diagnosis: text, probe: probeResult }), {
      headers: { ...corsHeaders, ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (req.signal.aborted) return json({ error: "Cancelado" }, 499);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
