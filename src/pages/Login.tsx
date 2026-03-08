import { useState } from "react";
import { Film, Mail, KeyRound, UserPlus, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
        navigate(redirectTo || "/perfis");
      }
    } catch (error: any) {
      toast({ title: isSignUp ? "Erro ao criar conta" : "Erro ao entrar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      <header className="relative z-10 px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center neon-glow">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-primary neon-text">CineCloud</span>
        </div>
      </header>
      <div className="relative z-10 flex items-center justify-center px-6" style={{ minHeight: "calc(100vh - 100px)" }}>
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl border-glow p-10 space-y-7">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">{isSignUp ? "Criar conta" : "Entrar"}</h1>
              <p className="text-muted-foreground text-sm">
                {redirectTo ? "Para assistir, você precisa criar uma conta ou fazer login." : isSignUp ? "Preencha os campos para criar sua conta CineCloud." : "Acesse sua conta CineCloud para continuar."}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2"><Mail className="w-4 h-4" />Email</label>
                <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2"><KeyRound className="w-4 h-4" />Senha</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <Button variant="neon" size="lg" className="w-full text-base" type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? <><UserPlus className="w-5 h-5" />Criar conta</> : <><LogIn className="w-5 h-5" />Entrar</>}
              </Button>
            </form>
            <div className="text-center">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
