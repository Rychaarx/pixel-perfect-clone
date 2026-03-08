import { useState } from "react";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, LayoutGrid, Tv, MessageSquare } from "lucide-react";
import AdminCatalog from "@/components/admin/AdminCatalog";
import AdminSections from "@/components/admin/AdminSections";
import AdminSeasons from "@/components/admin/AdminSeasons";
import AdminFeedback from "@/components/admin/AdminFeedback";

const Admin = () => {
  const { isAdmin, loading } = useRole();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">Acesso negado.</p>
        <p className="text-muted-foreground/60 text-sm">Você precisa ser administrador para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground neon-text">Painel Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie o catálogo, seções, episódios e feedbacks</p>
        </div>

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="glass border border-border/50 mb-6">
            <TabsTrigger value="catalog" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Film className="w-4 h-4" /> Catálogo
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <LayoutGrid className="w-4 h-4" /> Seções
            </TabsTrigger>
            <TabsTrigger value="seasons" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Tv className="w-4 h-4" /> Temporadas
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <MessageSquare className="w-4 h-4" /> Feedbacks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <AdminCatalog />
          </TabsContent>
          <TabsContent value="sections">
            <AdminSections />
          </TabsContent>
          <TabsContent value="seasons">
            <AdminSeasons />
          </TabsContent>
          <TabsContent value="feedback">
            <AdminFeedback />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
