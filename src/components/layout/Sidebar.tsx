import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/authContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Grid3X3,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Server,
  FileText,
  Settings,
  History,
  Activity,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Users,
  Bell,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/i18n";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/utils/constants";

interface NavItem {
  titleKey: keyof ReturnType<typeof useI18n>["strings"]["nav"];
  href?: string;
  icon: React.ElementType;
  children?: {
    titleKey: keyof ReturnType<typeof useI18n>["strings"]["nav"];
    href: string;
    permission?: NavItem["permission"];
  }[];
  adminOnly?: boolean;
  permission?: PermissionKey;
}

const navItems: NavItem[] = [
  { titleKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { titleKey: "risksDashboard", href: "/risks/dashboard", icon: Grid3X3 },
  { titleKey: "risks", href: "/risks", icon: AlertTriangle },
  {
    titleKey: "followUp",
    href: "/risks/followup",
    icon: Activity,
    permission: "canViewFollowUp",
  },
  {
    titleKey: "assessments",
    href: "/assessments/new",
    icon: ClipboardCheck,
    permission: "canCreate",
  },
  {
    titleKey: "treatments",
    href: "/treatments",
    icon: Shield,
    permission: "canViewTreatments",
  },
  {
    titleKey: "riskAppetite",
    href: "/risk-appetite",
    icon: Target,
    permission: "canViewSettings",
  },
  {
    titleKey: "policies",
    href: "/policies",
    icon: FileText,
    permission: "canViewSettings",
  },
  {
    titleKey: "analysis",
    icon: BarChart3,
    children: [
      {
        titleKey: "analysisDashboard",
        href: "/analysis/dashboard",
        permission: "canViewAnalysis",
      },
      {
        titleKey: "riskMatrix",
        href: "/analysis/matrix",
        permission: "canViewAnalysis",
      },
    ],
  },
  {
    titleKey: "bcpdr",
    icon: Server,
    children: [
      {
        titleKey: "bcpDashboard",
        href: "/bcp/dashboard",
        permission: "canViewBCP",
      },
      { titleKey: "bcpPlans", href: "/bcp/plans", permission: "canViewBCP" },
      {
        titleKey: "criticalServices",
        href: "/bcp/services",
        permission: "canViewBCP",
      },
      { titleKey: "bcpPlan", href: "/bcp/plan", permission: "canViewBCP" },
      { titleKey: "drPlan", href: "/bcp/dr", permission: "canViewBCP" },
      { titleKey: "bcpTests", href: "/bcp/tests", permission: "canViewBCP" },
    ],
  },
  {
    titleKey: "reports",
    icon: FileText,
    children: [
      {
        titleKey: "reportsHome",
        href: "/reports/home",
        permission: "canViewReports",
      },
      {
        titleKey: "reportsExecutive",
        href: "/reports/executive",
        permission: "canViewReports",
      },
      {
        titleKey: "reportsStandard",
        href: "/reports/standard",
        permission: "canViewReports",
      },
      {
        titleKey: "reportsCustom",
        href: "/reports/custom",
        permission: "canViewReports",
      },
      {
        titleKey: "reportsRegister",
        href: "/reports/register",
        permission: "canViewReports",
      },
    ],
  },
  {
    titleKey: "settings",
    icon: Settings,
    children: [
      {
        titleKey: "users",
        href: "/settings/users",
        permission: "canManageUsers",
      },
      {
        titleKey: "roles",
        href: "/settings/roles",
        permission: "canViewSettings",
      },
      {
        titleKey: "permissions",
        href: "/settings/permissions",
        permission: "canViewSettings",
      },
      {
        titleKey: "system",
        href: "/settings/system",
        permission: "canViewSettings",
      },
      {
        titleKey: "backup",
        href: "/settings/backup",
        permission: "canViewSettings",
      },
    ],
  },
  {
    titleKey: "notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    titleKey: "committee",
    href: "/committee",
    icon: Users,
    permission: "canViewSettings",
  },
  {
    titleKey: "audit",
    href: "/audit",
    icon: History,
    permission: "canViewAudit",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const { strings, isRTL } = useI18n();
  const [openGroups, setOpenGroups] = React.useState<
    Array<NavItem["titleKey"]>
  >(["bcpdr", "settings"]);

  const toggleGroup = (title: NavItem["titleKey"]) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const filteredNavItems = navItems.filter((item) => {
    if (item.permission && !can(item.permission)) return false;
    return true;
  });

  const filterChildren = (item: NavItem) => {
    if (!item.children) return item;
    const children = item.children.filter((child) =>
      child.permission ? can(child.permission) : true
    );
    return { ...item, children };
  };

  const visibleNavItems = filteredNavItems
    .map(filterChildren)
    .filter((item) => !item.children || item.children.length > 0);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-50 h-full w-64 bg-sidebar border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          isOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full"
            : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-sidebar-foreground">
                RiskMS
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-2 space-y-1">
              {visibleNavItems.map((item) => {
                if (item.children) {
                  return (
                    <Collapsible
                      key={item.titleKey}
                      open={openGroups.includes(item.titleKey)}
                      onOpenChange={() => toggleGroup(item.titleKey)}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{strings.nav[item.titleKey]}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              openGroups.includes(item.titleKey) && "rotate-180"
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-10 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={onClose}
                            className={cn(
                              "block px-3 py-2 rounded-lg text-sm transition-colors",
                              isActive(child.href)
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            {strings.nav[child.titleKey]}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                return (
                  <Link
                    key={item.titleKey}
                    to={item.href!}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive(item.href!)
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{strings.nav[item.titleKey]}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Menu */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {user?.name}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60">
                      {user?.role}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-muted-foreground">
                  <span className="truncate">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {strings.actions.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
