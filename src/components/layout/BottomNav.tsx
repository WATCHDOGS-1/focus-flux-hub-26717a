import { Home, Users, Zap, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: "Home", path: "/dashboard" },
        { icon: Users, label: "Squads", path: "/squads" },
        { icon: Zap, label: "Focus", path: "/focus" },
        { icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
            <div className="glass-card rounded-2xl border border-white/10 px-6 py-4 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] bg-black/40 backdrop-blur-xl">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "relative flex flex-col items-center gap-1 transition-all duration-300 group",
                                isActive ? "text-primary scale-110" : "text-white/40 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary/20 blur-xl rounded-full" />
                            )}
                            <item.icon
                                className={cn(
                                    "w-6 h-6 transition-all duration-300",
                                    isActive ? "drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]" : "group-hover:scale-110"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn(
                                "text-[10px] font-bold tracking-wide uppercase transition-all",
                                isActive ? "text-white text-glow" : "text-transparent h-0 overflow-hidden group-hover:text-white/60 group-hover:h-auto"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
