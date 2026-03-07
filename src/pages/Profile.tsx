import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const menuItems = [
    { label: "Edit Profile", icon: User },
    { label: "Settings", icon: Settings },
    { label: "Log Out", icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-6">
        <h1 className="font-display text-3xl text-foreground tracking-wider mb-8">PROFILE</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Movie Lover</p>
            <p className="text-sm text-muted-foreground">movie.lover@cinecloud.app</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Watched", value: "0" },
            { label: "Favorites", value: "0" },
            { label: "Lists", value: "0" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-secondary p-4 text-center">
              <p className="font-display text-2xl text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="space-y-1">
          {menuItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-secondary transition-colors"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
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
