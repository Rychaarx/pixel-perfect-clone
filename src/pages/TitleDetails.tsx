import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useCatalog } from "@/hooks/useCatalog";

const TitleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { items, loading } = useCatalog();
  const item = items.find((c) => c.id === id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 max-w-4xl mx-auto">
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : !item ? (
          <p className="text-muted-foreground">Título não encontrado.</p>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} className="w-full md:w-64 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">{item.title}</h1>
              <p className="text-sm text-muted-foreground mb-1">{item.type} · {item.year}</p>
              <p className="text-sm text-muted-foreground mb-4">{item.genres?.join(", ")}</p>
              <p className="text-foreground/80">{item.synopsis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleDetails;
