import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/authContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { NotificationBell } from "@/components/notifications";

interface HeaderProps {
  onMenuClick: () => void;
}

const routeTitles: Record<
  string,
  (t: ReturnType<typeof useI18n>["strings"]) => string
> = {
  "/dashboard": (t) => t.page.dashboard,
  "/risks/dashboard": (t) => t.page.risksDashboard,
  "/risks": (t) => t.page.riskRegister,
  "/risks/new": (t) => t.page.newRisk,
  "/risks/followup": (t) => t.page.followUp,
  "/analysis/dashboard": (t) => t.page.analysisDashboard,
  "/analysis/matrix": (t) => t.page.riskMatrix,
  "/assessments": (t) => t.page.assessments,
  "/assessments/new": (t) => t.page.newAssessment,
  "/treatments": (t) => t.page.treatmentPlans,
  "/bcp/dashboard": (t) => t.page.bcpDashboard,
  "/bcp/plans": (t) => t.page.bcpPlans,
  "/bcp/services": (t) => t.page.criticalServices,
  "/bcp/plan": (t) => t.page.bcpPlan,
  "/bcp/dr": (t) => t.page.drPlan,
  "/bcp/tests": (t) => t.page.bcpTests,
  "/reports": (t) => t.page.reports,
  "/reports/home": (t) => t.page.reportsHome,
  "/reports/register": (t) => t.page.reports,
  "/reports/executive": (t) => t.page.reportsExecutive,
  "/reports/standard": (t) => t.page.reportsStandard,
  "/reports/custom": (t) => t.page.reportsCustom,
  "/settings/roles": (t) => t.page.roleManagement,
  "/settings/permissions": (t) => t.page.permissions,
  "/settings/system": (t) => t.page.systemSettings,
  "/settings/users": (t) => t.page.users,
  "/audit": (t) => t.page.auditLog,
  "/notifications": (t) => t.nav.notifications,
  "/committee": (t) => t.nav.committee,
  "/risk-appetite": (t) => t.nav.riskAppetite,
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { strings, language, setLanguage, isRTL } = useI18n();

  const getPageTitle = () => {
    // Check exact match first
    if (routeTitles[location.pathname]) {
      return routeTitles[location.pathname](strings);
    }
    // Check for dynamic routes like /risks/:id
    if (
      location.pathname.startsWith("/risks/") &&
      location.pathname !== "/risks/new"
    ) {
      return strings.page.riskDetails;
    }
    if (location.pathname.startsWith("/treatments/")) {
      return strings.page.treatmentPlan;
    }
    return strings.page.appName;
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [];
    let path = "";

    for (const part of parts) {
      path += `/${part}`;
      const title =
        routeTitles[path]?.(strings) ||
        part.charAt(0).toUpperCase() + part.slice(1);
      breadcrumbs.push({ title, path });
    }

    return breadcrumbs;
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border flex items-center px-4 lg:px-6 gap-4">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs / Title */}
      <div className="flex-1 min-w-0">
        <div
          className={
            isRTL
              ? "hidden md:flex items-center gap-1 text-sm text-muted-foreground flex-row-reverse text-right"
              : "hidden md:flex items-center gap-1 text-sm text-muted-foreground"
          }
        >
          {getBreadcrumbs().map((crumb, index, arr) => (
            <React.Fragment key={crumb.path}>
              <span
                className={
                  index === arr.length - 1 ? "text-foreground font-medium" : ""
                }
              >
                {crumb.title}
              </span>
              {index < arr.length - 1 && (
                <ChevronRight
                  className={isRTL ? "h-4 w-4 rotate-180" : "h-4 w-4"}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <h1 className="md:hidden text-lg font-semibold truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Language */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="shrink-0">
            {strings.common.language}:{" "}
            {language === "ar" ? strings.lang.arabic : strings.lang.english}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLanguage("en")}>
            {strings.lang.english}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage("ar")}>
            {strings.lang.arabic}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <NotificationBell />

      {/* User Role Badge */}
      <Badge variant="outline" className="hidden sm:flex">
        {user?.role}
      </Badge>
    </header>
  );
};

export default Header;
