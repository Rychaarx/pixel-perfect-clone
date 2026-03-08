import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

const Admin = () => {
  const { isAdmin, loading } = useRole();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Acesso negado.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 px-4 max-w-6xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Painel Admin</h1>
        <p className="text-muted-foreground">Painel administrativo em desenvolvimento.</p>
      </div>
    </div>
  );
};

export default Admin;
