import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/api";
import {
  LayoutDashboard,
  Mail,
  FileText,
  Clock,
  Settings,
  LogOut,
  Server,
  BarChart3,
  Building2,
  Users,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Server, label: "SMTP Settings", path: "/dashboard/smtp" },
  { icon: FileText, label: "Templates", path: "/dashboard/templates" },
  { icon: Clock, label: "Scheduled", path: "/dashboard/scheduled" },
  { icon: Building2, label: "Companies", path: "/dashboard/companies" },
  { icon: Users, label: "HR Lists", path: "/dashboard/hr-lists" },
  { icon: BarChart3, label: "Logs & Reports", path: "/dashboard/logs" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const DashboardSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    logActivity("Visited page", { path: location.pathname });
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    onNavigate?.();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-4 lg:px-6 py-4 lg:py-5 border-b border-sidebar-border hover:opacity-90 transition-opacity">
        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-primary flex items-center justify-center">
          <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
        </div>
        <span className="text-lg lg:text-xl font-bold text-sidebar-foreground">MailFlow</span>
      </Link>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 lg:px-3 py-3 lg:py-4">
        <nav>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="px-2 lg:px-3 py-3 lg:py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border hidden lg:block">
        <DashboardSidebar />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">MailFlow</span>
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar">
            <DashboardSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <main className="p-4 lg:p-6 pt-[72px] lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
