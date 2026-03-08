import { User, Settings, LogOut, Heart, ChevronRight } from "lucide-react";


const Profile = () => {
  const menuItems = [
    { label: "Minha Lista", icon: Heart },
    { label: "Configurações", icon: Settings },
    { label: "Sair", icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-6">
        <h1 className="font-display text-3xl text-foreground tracking-wider mb-8">MEU PERFIL</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">Usuário</p>
            <p className="text-sm text-muted-foreground">usuario@example.com</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-1">
          {menuItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="flex-1 text-left text-sm">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
