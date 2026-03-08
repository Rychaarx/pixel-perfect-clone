import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { CatalogStatus } from "@/hooks/useCatalog";

export interface MovieCardProps {
  id: string;
  title: string;
  poster: string;
  status: CatalogStatus;
  type: "Filme" | "Série" | "Anime";
  redirectUrl: string;
  index?: number;
}

const MovieCard = ({ id, title, poster, redirectUrl, index = 0 }: MovieCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
    } else {
      navigate(`/titulo/${id}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <img
          src={poster || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
      </div>
    </motion.div>
  );
};

export default MovieCard;
