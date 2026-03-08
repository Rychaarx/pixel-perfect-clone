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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useRole();
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showNav = useCallback(() => {
    setVisible(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
  }, []);

  const scheduleHide = useCallback(() => {
    if (mobileOpen || userMenuOpen) return;
    hideTimeout.current = setTimeout(() => setVisible(false), 800);
  }, [mobileOpen, userMenuOpen]);

  // Show navbar when mouse is near the top of the screen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 60) {
        showNav();
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [showNav]);

  // Keep visible while mobile menu or user menu is open
  useEffect(() => {
    if (mobileOpen || userMenuOpen) {
      setVisible(true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    }
  }, [mobileOpen, userMenuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      onMouseEnter={showNav}
      onMouseLeave={scheduleHide}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-neon flex items-center justify-center">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-primary neon-text">
            CineCloud
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

          {user ? (
            <div className="relative ml-2" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-full gradient-neon-cyan flex items-center justify-center neon-glow-cyan transition-transform hover:scale-110"
              >
                <User className="w-5 h-5 text-primary-foreground" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-52 glass rounded-xl border-glow p-2 space-y-1 animate-scale-in">
                  <p className="px-3 py-2 text-xs text-muted-foreground truncate border-b border-border/50 mb-1">
                    {user.email}
                  </p>
                  <Link to="/perfis" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors">
                    <Users className="w-4 h-4" /> Perfis
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-secondary transition-colors">
                      <Shield className="w-4 h-4" /> Administração
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-secondary transition-colors">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === "/login" ? "gradient-neon text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border/50 px-6 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? "gradient-neon text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
          {user ? (
            <>
              <Link to="/perfis" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                <Users className="w-4 h-4" /> Perfis
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-secondary">
                  <Shield className="w-4 h-4" /> Administração
                </Link>
              )}
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-secondary">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
