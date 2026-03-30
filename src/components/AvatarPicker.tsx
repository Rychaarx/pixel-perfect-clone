import { useState } from "react";

const avatarList = [
  {
    id: "coolguy",
    name: "Cool Guy",
    bg: "#c8a826",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="50" cy="62" rx="32" ry="36" fill="#c8a826"/>
        <ellipse cx="50" cy="30" rx="32" ry="18" fill="#2a1a00"/>
        <rect x="18" y="48" width="28" height="16" rx="6" fill="#222"/>
        <rect x="54" y="48" width="28" height="16" rx="6" fill="#222"/>
        <rect x="46" y="52" width="8" height="4" rx="2" fill="#444"/>
        <ellipse cx="26" cy="52" rx="5" ry="3" fill="#555"/>
        <ellipse cx="62" cy="52" rx="5" ry="3" fill="#555"/>
        <path d="M 34 72 Q 42 78 50 74 Q 58 78 66 72" stroke="#2a1a00" strokeWidth="4" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "warrior",
    name: "Warrior",
    bg: "#c0392b",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="50" cy="95" rx="40" ry="20" fill="#8b1a1a"/>
        <rect x="22" y="30" width="56" height="52" rx="10" fill="#c0392b"/>
        <rect x="22" y="18" width="56" height="20" rx="8" fill="#8b1a1a"/>
        <rect x="32" y="12" width="36" height="14" rx="6" fill="#8b1a1a"/>
        <polygon points="25,45 38,42 38,50 25,50" fill="#1a0000"/>
        <polygon points="75,45 62,42 62,50 75,50" fill="#1a0000"/>
        <ellipse cx="32" cy="46" rx="4" ry="4" fill="#ff4444"/>
        <ellipse cx="68" cy="46" rx="4" ry="4" fill="#ff4444"/>
        <line x1="24" y1="40" x2="38" y2="43" stroke="#1a0000" strokeWidth="3" strokeLinecap="round"/>
        <line x1="76" y1="40" x2="62" y2="43" stroke="#1a0000" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 36 68 Q 50 62 64 68" stroke="#1a0000" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <rect x="38" y="72" width="24" height="8" rx="4" fill="#8b1a1a"/>
      </svg>
    ),
  },
  {
    id: "kawaii",
    name: "Kawaii",
    bg: "#f72585",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="18" cy="55" rx="12" ry="28" fill="#cc44aa"/>
        <ellipse cx="82" cy="55" rx="12" ry="28" fill="#cc44aa"/>
        <ellipse cx="50" cy="28" rx="34" ry="22" fill="#cc44aa"/>
        <ellipse cx="50" cy="58" rx="30" ry="32" fill="#fff0f6"/>
        <ellipse cx="36" cy="52" rx="8" ry="9" fill="#222"/>
        <ellipse cx="64" cy="52" rx="8" ry="9" fill="#222"/>
        <ellipse cx="38" cy="49" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="66" cy="49" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="24" cy="64" rx="8" ry="5" fill="#ffaacc" opacity="0.6"/>
        <ellipse cx="76" cy="64" rx="8" ry="5" fill="#ffaacc" opacity="0.6"/>
        <path d="M 36 70 Q 50 84 64 70" fill="#ff69b4"/>
        <ellipse cx="50" cy="74" rx="10" ry="6" fill="#ff1493"/>
        <rect x="40" y="70" width="20" height="6" rx="3" fill="#fff"/>
        <ellipse cx="38" cy="22" rx="8" ry="5" fill="#ee88cc" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "shadow",
    name: "Shadow",
    bg: "#1a1a2e",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="50" cy="95" rx="35" ry="18" fill="#111"/>
        <ellipse cx="50" cy="52" rx="32" ry="34" fill="#2a2a3e"/>
        <ellipse cx="50" cy="50" rx="28" ry="20" fill="#111"/>
        <ellipse cx="36" cy="48" rx="9" ry="7" fill="#1a1a2e"/>
        <ellipse cx="64" cy="48" rx="9" ry="7" fill="#1a1a2e"/>
        <ellipse cx="36" cy="48" rx="6" ry="5" fill="#00d4ff" opacity="0.9"/>
        <ellipse cx="64" cy="48" rx="6" ry="5" fill="#00d4ff" opacity="0.9"/>
        <ellipse cx="36" cy="48" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="64" cy="48" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="36" cy="48" rx="10" ry="8" fill="#00d4ff" opacity="0.15"/>
        <ellipse cx="64" cy="48" rx="10" ry="8" fill="#00d4ff" opacity="0.15"/>
        <ellipse cx="18" cy="50" rx="6" ry="8" fill="#2a2a3e"/>
        <ellipse cx="82" cy="50" rx="6" ry="8" fill="#2a2a3e"/>
      </svg>
    ),
  },
  {
    id: "punk",
    name: "Punk",
    bg: "#7209b7",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect x="42" y="5" width="16" height="35" rx="8" fill="#f72585"/>
        <ellipse cx="50" cy="58" rx="30" ry="32" fill="#f4a261"/>
        <ellipse cx="36" cy="52" rx="7" ry="7" fill="#111"/>
        <ellipse cx="64" cy="52" rx="7" ry="7" fill="#111"/>
        <ellipse cx="38" cy="50" rx="2.5" ry="2.5" fill="#fff"/>
        <ellipse cx="66" cy="50" rx="2.5" ry="2.5" fill="#fff"/>
        <line x1="28" y1="43" x2="43" y2="46" stroke="#222" strokeWidth="3" strokeLinecap="round"/>
        <line x1="72" y1="43" x2="57" y2="46" stroke="#222" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="50" cy="64" r="3" stroke="#aaa" strokeWidth="2" fill="none"/>
        <path d="M 38 74 Q 52 80 64 72" stroke="#222" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <ellipse cx="20" cy="52" rx="8" ry="22" fill="#222"/>
        <ellipse cx="80" cy="52" rx="8" ry="22" fill="#222"/>
      </svg>
    ),
  },
  {
    id: "nerd",
    name: "Nerd",
    bg: "#4cc9f0",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="50" cy="28" rx="30" ry="16" fill="#5c3d11"/>
        <rect x="20" y="28" width="60" height="10" fill="#5c3d11"/>
        <ellipse cx="50" cy="58" rx="28" ry="30" fill="#ffd6a5"/>
        <rect x="18" y="48" width="26" height="18" rx="8" fill="none" stroke="#333" strokeWidth="3"/>
        <rect x="56" y="48" width="26" height="18" rx="8" fill="none" stroke="#333" strokeWidth="3"/>
        <line x1="44" y1="57" x2="56" y2="57" stroke="#333" strokeWidth="2.5"/>
        <line x1="18" y1="55" x2="10" y2="52" stroke="#333" strokeWidth="2.5"/>
        <line x1="82" y1="55" x2="90" y2="52" stroke="#333" strokeWidth="2.5"/>
        <ellipse cx="31" cy="57" rx="7" ry="7" fill="#fff"/>
        <ellipse cx="69" cy="57" rx="7" ry="7" fill="#fff"/>
        <ellipse cx="31" cy="57" rx="4" ry="4" fill="#4a90d9"/>
        <ellipse cx="69" cy="57" rx="4" ry="4" fill="#4a90d9"/>
        <ellipse cx="31" cy="57" rx="2" ry="2" fill="#111"/>
        <ellipse cx="69" cy="57" rx="2" ry="2" fill="#111"/>
        <ellipse cx="32" cy="55" rx="1.5" ry="1.5" fill="#fff"/>
        <ellipse cx="70" cy="55" rx="1.5" ry="1.5" fill="#fff"/>
        <path d="M 36 76 Q 50 84 64 76" stroke="#c47a3a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="38" cy="70" r="2" fill="#c47a3a" opacity="0.5"/>
        <circle cx="43" cy="72" r="2" fill="#c47a3a" opacity="0.5"/>
        <circle cx="57" cy="72" r="2" fill="#c47a3a" opacity="0.5"/>
        <circle cx="62" cy="70" r="2" fill="#c47a3a" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "ninja",
    name: "Ninja",
    bg: "#2d2d2d",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="50" cy="35" rx="35" ry="30" fill="#111"/>
        <rect x="22" y="42" width="56" height="35" rx="5" fill="#111"/>
        <rect x="24" y="46" width="52" height="20" rx="4" fill="#d4a373"/>
        <ellipse cx="36" cy="56" rx="7" ry="5" fill="#111"/>
        <ellipse cx="64" cy="56" rx="7" ry="5" fill="#111"/>
        <ellipse cx="36" cy="56" rx="4" ry="3" fill="#ff4444"/>
        <ellipse cx="64" cy="56" rx="4" ry="3" fill="#ff4444"/>
        <ellipse cx="37" cy="55" rx="1.5" ry="1.5" fill="#fff"/>
        <ellipse cx="65" cy="55" rx="1.5" ry="1.5" fill="#fff"/>
        <rect x="24" y="60" width="52" height="12" rx="4" fill="#111"/>
        <rect x="18" y="44" width="64" height="8" rx="3" fill="#cc0000"/>
        <rect x="46" y="40" width="8" height="18" rx="2" fill="#cc0000"/>
      </svg>
    ),
  },
  {
    id: "witch",
    name: "Witch",
    bg: "#3a0ca3",
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <polygon points="50,2 28,38 72,38" fill="#1a0030"/>
        <rect x="18" y="36" width="64" height="10" rx="5" fill="#2d0050"/>
        <ellipse cx="20" cy="65" rx="12" ry="25" fill="#1a1a1a"/>
        <ellipse cx="80" cy="65" rx="12" ry="25" fill="#1a1a1a"/>
        <ellipse cx="50" cy="62" rx="28" ry="30" fill="#c8e6c9"/>
        <ellipse cx="37" cy="56" rx="7" ry="8" fill="#6a0dad"/>
        <ellipse cx="63" cy="56" rx="7" ry="8" fill="#6a0dad"/>
        <ellipse cx="37" cy="56" rx="4" ry="4" fill="#111"/>
        <ellipse cx="63" cy="56" rx="4" ry="4" fill="#111"/>
        <ellipse cx="38" cy="54" rx="2" ry="2" fill="#fff"/>
        <ellipse cx="64" cy="54" rx="2" ry="2" fill="#fff"/>
        <polygon points="50,10 52,16 58,16 53,20 55,26 50,22 45,26 47,20 42,16 48,16" fill="#ffd700" opacity="0.9"/>
        <path d="M 36 76 Q 50 86 64 76" stroke="#4a7c59" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M 48 64 Q 46 70 50 72 Q 54 70 52 64" fill="#a8d5a2"/>
      </svg>
    ),
  },
];

interface AvatarPickerProps {
  onSelect: (avatar: { id: string; name: string; bg: string }) => void;
  selected?: string;
}

export function AvatarPicker({ onSelect, selected }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {avatarList.map((a) => (
        <div
          key={a.id}
          onClick={() => onSelect({ id: a.id, name: a.name, bg: a.bg })}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <div
            style={{ background: a.bg, borderColor: selected === a.id ? "#fff" : "transparent" }}
            className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
          >
            {a.svg}
          </div>
          <span className={`text-xs ${selected === a.id ? "text-white font-bold" : "text-muted-foreground"}`}>
            {a.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export { avatarList };
