import { Link, useLocation } from "react-router-dom";
import { Film, Calendar, Lightbulb, MessageSquare, LogIn, Menu, X, User, LogOut, Users, Shield } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

const navItems = [
  { label: "Início", path: "/", icon: Film },
  { label: "Agenda", path: "/agenda", icon: Calendar },
  { label: "Sugestões", path: "/sugestoes", icon: Lightbulb },
  { label: "Feedback", path: "/feedback", icon: MessageSquare },
];

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useRole();
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          navRef.current && !navRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      {/* Hamburger button - always visible */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-lg glass border border-border/50 flex items-center justify-center text-foreground hover:bg-secondary/80 transition-all"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-background/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-in menu */}
      <nav
        ref={navRef}
        className={`fixed top-0 right-0 z-[58] h-full w-64 glass border-l border-border/50 transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pt-20 px-4 space-y-2">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 pb-4 mb-2 border-b border-border/50">
            <div className="w-9 h-9 rounded-lg gradient-neon flex items-center justify-center">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-primary neon-text">CineCloud</span>
          </Link>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "gradient-neon text-primary-foreground neon-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="border-t border-border/50 pt-2 mt-2">
            {user ? (
              <>
                <p className="px-4 py-2 text-xs text-muted-foreground truncate">{user.email}</p>
                <Link to="/perfis" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Users className="w-4 h-4" /> Perfis
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-secondary">
                    <Shield className="w-4 h-4" /> Administração
                  </Link>
                )}
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-secondary">
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                <LogIn className="w-4 h-4" /> Entrar
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
