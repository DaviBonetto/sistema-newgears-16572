import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GlobalEditButton } from "@/components/GlobalEditButton";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Calendar,
  Trophy,
  Lightbulb,
  Rocket,
  Tv,
  User,
  LogOut,
  Users,
  CalendarRange,
  Bot,
  StickyNote,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Metas", href: "/tasks", icon: CheckSquare },
  { name: "Evidências", href: "/evidences", icon: FileText },
  { name: "Calendário", href: "/calendar", icon: Calendar },
  { name: "Linha do Tempo", href: "/timeline", icon: CalendarRange },
  { name: "Equipe GEARS", href: "/team", icon: Users },
  { name: "Metodologias", href: "/methodologies", icon: Lightbulb },
  { name: "Projeto Inovação", href: "/innovation", icon: Trophy },
  { name: "Robô", href: "/robot", icon: Bot },
  { name: "Brainstorming", href: "/brainstorming", icon: Lightbulb },
  { name: "Projeto Final", href: "/final-project", icon: Trophy },
  { name: "Anotações", href: "/notes", icon: StickyNote },
  { name: "Modo TV", href: "/tv", icon: Tv },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Load sidebar state from database
  useEffect(() => {
    const loadSidebarState = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("sidebar_collapsed")
        .eq("id", user.id)
        .single();
      
      if (data?.sidebar_collapsed !== null) {
        setCollapsed(data.sidebar_collapsed);
      }
    };
    
    loadSidebarState();
  }, [user]);

  // Save sidebar state to database
  const toggleSidebar = async () => {
    const newState = !collapsed;
    setCollapsed(newState);
    
    if (user) {
      await supabase
        .from("profiles")
        .update({ sidebar_collapsed: newState })
        .eq("id", user.id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-3 justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="h-4 w-4" />
              </div>
              <span>Sistema GEARS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="space-y-1 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-2">
          <Button
            variant="outline"
            className={cn(
              "w-full",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={() => navigate("/profile")}
            title={collapsed ? "Meu Perfil" : undefined}
          >
            <User className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Meu Perfil"}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "mt-2 w-full text-muted-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={handleSignOut}
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </aside>

      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "pl-16" : "pl-64"
        )}
      >
        <div className="mx-auto max-w-7xl p-6">{children}</div>
        <GlobalEditButton />
      </main>
    </div>
  );
}
