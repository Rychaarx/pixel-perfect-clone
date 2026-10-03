import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  initialUrl?: string;
  initialError?: string;
}

const AddonDiagnose = ({ initialUrl = "", initialError = "" }: Props) => {
  const [url, setUrl] = useState(initialUrl);
  const [err, setErr] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => { if (initialUrl) setUrl(initialUrl); }, [initialUrl]);
  useEffect(() => { if (initialError) setErr(initialError); }, [initialError]);

  const run = async () => {
    setLoading(true);
    setResult(null);
    setFailure(null);
    try {
      const { data, error } = await supabase.functions.invoke("addon-diagnose", {
        body: { url: url.trim(), errorDetails: err.trim() },
      });
      if (error) {
        let msg = error.message;
        try { msg = (await (error as any).context?.json())?.error ?? msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult((data as any).diagnosis);
    } catch (e: any) {
      setFailure(e.message || "Falha ao diagnosticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl border border-border/50 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Diagnóstico com IA</h2>
      </div>
      <div className="space-y-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL do addon"
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary"
        />
        <textarea
          value={err}
          onChange={(e) => setErr(e.target.value)}
          placeholder="Cole a mensagem de erro (opcional)"
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary"
        />
        <Button onClick={run} disabled={loading || !url.trim()} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Diagnosticar
        </Button>
      </div>
      {failure && <p className="text-sm text-destructive mt-3">{failure}</p>}
      {result && (
        <div className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {result.replace(/\*\*/g, "").replace(/^## /gm, "")}
        </div>
      )}
    </div>
  );
};

export default AddonDiagnose;
