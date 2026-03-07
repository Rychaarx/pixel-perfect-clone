import { Heart } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Favorites = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-6">
        <h1 className="font-display text-3xl text-foreground tracking-wider mb-6">MINHA LISTA</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <Heart className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground text-sm">Seus filmes favoritos aparecerão aqui</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Toque no ícone de coração em qualquer filme para salvá-lo</p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Favorites;
