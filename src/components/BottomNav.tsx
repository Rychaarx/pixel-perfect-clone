import { Home, Calendar, Lightbulb, MessageSquare, LogIn, User, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const tabs = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { icon: Lightbulb, label: "Sugestões", path: "/sugestoes" },
    { icon: MessageSquare, label: "Problemas", path: "/feedback" },
  ];

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate("/login");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
        <button
          onClick={handleAuthAction}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
            location.pathname === "/login" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {user ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
          <span className="text-[10px] font-medium">{user ? "Sair" : "Entrar"}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
