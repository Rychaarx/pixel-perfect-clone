import { Heart } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Favorites = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-6">
        <h1 className="font-display text-3xl text-foreground tracking-wider mb-6">FAVORITES</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <Heart className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground text-sm">Your favorite movies will appear here</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Tap the heart icon on any movie to save it</p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Favorites;
