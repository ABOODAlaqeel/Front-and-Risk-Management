/**
 * BCP Plans Page - Business continuity plans overview.
 */
import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/common/Loader";
import { bcpApi } from "@/api";
import type { BCPTest, BCPService, DRSite } from "@/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ArrowRight,
  FileText,
  Server,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  TestTubeDiagonal,
} from "lucide-react";

// ===========================================
// Types
// ===========================================

interface BCPlanData {
  lastUpdated: string;
  status: string;
  sections: string[];
  title?: string;
  version?: string;
  description?: string;
  objectives?: string;
}

interface DRPlanData {
  lastUpdated: string;
  rto: string;
  rpo: string;
  sites: DRSite[];
  title?: string;
  version?: string;
}

// ===========================================
// Helper Functions
// ===========================================

const isValidDate = (value: string): boolean => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

const formatDate = (value: string, locale: string): string => {
  if (!value || !isValidDate(value)) return "-";
  try {
    return new Date(value).toLocaleDateString(locale);
  } catch {
    return value;
  }
};

const getTestStats = (
  tests: BCPTest[],
  type: BCPTest["type"],
  locale: string
) => {
  const now = new Date();
  const list = tests.filter((t) => t.type === type && isValidDate(t.date));

  const executed = list
    .filter((t) => t.status !== "Planned")
    .map((t) => new Date(t.date))
    .filter((d) => !Number.isNaN(d.getTime()));
  const lastExecuted =
    executed.length > 0
      ? new Date(
          Math.max(...executed.map((d) => d.getTime()))
        ).toLocaleDateString(locale)
      : "-";

  const upcoming = list
    .filter((t) => t.status === "Planned")
    .map((t) => new Date(t.date))
    .filter((d) => !Number.isNaN(d.getTime()) && d >= now);
  const nextPlanned =
    upcoming.length > 0
      ? new Date(
          Math.min(...upcoming.map((d) => d.getTime()))
        ).toLocaleDateString(locale)
      : "-";

  const passed = list.filter((t) => t.status === "Passed").length;
  const failed = list.filter((t) => t.status === "Failed").length;
  const total = list.length;

  return { lastExecuted, nextPlanned, passed, failed, total };
};

const statusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-status-success/15 text-status-success border-status-success/30";
    case "draft":
      return "bg-muted/40 text-muted-foreground border-muted";
    case "under_review":
    case "under review":
    case "in review":
      return "bg-status-warning/15 text-status-warning border-status-warning/30";
    case "approved":
      return "bg-primary/15 text-primary border-primary/30";
    case "archived":
      return "bg-muted/30 text-muted-foreground border-muted";
    default:
      return "bg-muted/40 text-muted-foreground border-muted";
  }
};

const BCPPlans: React.FC = () => {
  const { strings, isRTL, language } = useI18n();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const [loading, setLoading] = React.useState(true);
  const [bcPlan, setBcPlan] = React.useState<BCPlanData | null>(null);
  const [drPlan, setDrPlan] = React.useState<DRPlanData | null>(null);
  const [tests, setTests] = React.useState<BCPTest[]>([]);
  const [services, setServices] = React.useState<BCPService[]>([]);
  const [drSites, setDrSites] = React.useState<DRSite[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [bc, dr, t, svc, sites] = await Promise.all([
          bcpApi.getBCPlan(),
          bcpApi.getDRPlan(),
          bcpApi.getTests?.() ?? Promise.resolve([]),
          bcpApi.getServices?.() ?? Promise.resolve([]),
          bcpApi.getDRSites?.() ?? Promise.resolve([]),
        ]);
        setBcPlan(bc as BCPlanData);
        setDrPlan(dr as DRPlanData);
        setTests(Array.isArray(t) ? (t as BCPTest[]) : []);
        setServices(Array.isArray(svc) ? (svc as BCPService[]) : []);
        setDrSites(Array.isArray(sites) ? sites : []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <PageLoader text={strings.common.loading} />;

  const bcpStats = getTestStats(tests, "BCP", locale);
  const drStats = getTestStats(tests, "DR", locale);

  const statusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return strings.bcp.statusActive;
      case "draft":
        return strings.bcp.statusDraft;
      case "under_review":
      case "under review":
      case "in review":
        return strings.bcp.statusInReview;
      case "approved":
        return strings.bcp.statusApproved;
      case "archived":
        return strings.bcp.statusArchived;
      default:
        return status || "-";
    }
  };

  // Services statistics
  const criticalServices = services.filter(
    (s) => s.criticality?.toLowerCase() === "critical"
  ).length;

  // DR Sites statistics
  const hotSites = drSites.filter((s) =>
    (s.site_type || "").toLowerCase().includes("hot")
  ).length;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.bcpPlans.title}</h1>
          <p className="text-muted-foreground">{strings.bcpPlans.subtitle}</p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Server className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{services.length}</p>
            <p className="text-xs text-muted-foreground">
              {strings.bcpPlans.servicesLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto text-status-danger mb-2" />
            <p className="text-2xl font-bold">{criticalServices}</p>
            <p className="text-xs text-muted-foreground">
              {strings.bcpPlans.criticalServicesLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{drSites.length}</p>
            <p className="text-xs text-muted-foreground">
              {strings.bcpPlans.drSitesLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto text-status-danger mb-2" />
            <p className="text-2xl font-bold">{hotSites}</p>
            <p className="text-xs text-muted-foreground">
              {strings.bcpPlans.hotSitesLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TestTubeDiagonal className="h-6 w-6 mx-auto text-status-warning mb-2" />
            <p className="text-2xl font-bold">{tests.length}</p>
            <p className="text-xs text-muted-foreground">
              {strings.bcpPlans.testsLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto text-status-success mb-2" />
            <p className="text-2xl font-bold">
              {bcpStats.passed + drStats.passed}
            </p>
            <p className="text-xs text-muted-foreground">
              {strings.bcpPlans.passedTestsLabel}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BCP Plan Card */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4">
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {strings.bcpPlans.bcpCardTitle}
                  </CardTitle>
                  <CardDescription>
                    {strings.bcpPlans.bcpCardDesc}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn("border", statusBadgeClass(bcPlan?.status || ""))}
              >
                {statusLabel(bcPlan?.status || "")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Plan Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">
                  {strings.bcpPlans.lastUpdated}
                </p>
                <p className="font-medium text-sm">
                  {formatDate(bcPlan?.lastUpdated || "", locale)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">
                  {strings.bcpPlans.sectionsLabel}
                </p>
                <p className="font-medium text-sm">
                  {bcPlan?.sections?.length || 0}{" "}
                  {strings.bcpPlans.sectionsCount}
                </p>
              </div>
            </div>

            {/* Sections Preview */}
            {bcPlan?.sections && bcPlan.sections.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {strings.bcpPlans.planSectionsLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {bcPlan.sections.slice(0, 4).map((s, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                  {bcPlan.sections.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{bcPlan.sections.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Test Dates */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border bg-background/50">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  {strings.bcpPlans.lastTest}
                </div>
                <p className="text-sm font-medium">{bcpStats.lastExecuted}</p>
              </div>
              <div className={cn(isRTL ? "text-left" : "text-right")}>
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground mb-1",
                    isRTL ? "" : "justify-end"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {strings.bcpPlans.nextTest}
                </div>
                <p className="text-sm font-medium">{bcpStats.nextPlanned}</p>
              </div>
            </div>

            {/* Action Button */}
            <Button asChild variant="secondary" className="w-full mt-4">
              <Link
                to="/bcp/plan"
                className="flex items-center justify-center gap-2"
              >
                {strings.bcpPlans.viewDetails}
                <ArrowRight
                  className={cn("h-4 w-4", isRTL ? "rotate-180" : "")}
                />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* DR Plan Card */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4">
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-danger/10">
                  <Building2 className="h-5 w-5 text-status-danger" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {strings.bcpPlans.drCardTitle}
                  </CardTitle>
                  <CardDescription>
                    {strings.bcpPlans.drCardDesc}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="border bg-status-success/15 text-status-success border-status-success/30"
              >
                {strings.bcp.statusActive}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Plan Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">RTO</p>
                <p className="font-medium text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {drPlan?.rto || "-"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">RPO</p>
                <p className="font-medium text-sm flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {drPlan?.rpo || "-"}
                </p>
              </div>
            </div>

            {/* DR Sites Preview */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                {strings.bcpPlans.drSitesPreviewLabel.replace(
                  "{count}",
                  String(drSites.length)
                )}
              </p>
              {drSites.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {drSites.slice(0, 3).map((site) => (
                    <Badge key={site.id} variant="outline" className="text-xs">
                      {site.name}
                    </Badge>
                  ))}
                  {drSites.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{drSites.length - 3}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {strings.bcpPlans.noRecoverySites}
                </p>
              )}
            </div>

            {/* Test Dates */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border bg-background/50">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  {strings.bcpPlans.lastTest}
                </div>
                <p className="text-sm font-medium">{drStats.lastExecuted}</p>
              </div>
              <div className={cn(isRTL ? "text-left" : "text-right")}>
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground mb-1",
                    isRTL ? "" : "justify-end"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {strings.bcpPlans.nextTest}
                </div>
                <p className="text-sm font-medium">{drStats.nextPlanned}</p>
              </div>
            </div>

            {/* Action Button */}
            <Button asChild variant="secondary" className="w-full mt-4">
              <Link
                to="/bcp/dr"
                className="flex items-center justify-center gap-2"
              >
                {strings.bcpPlans.viewDetails}
                <ArrowRight
                  className={cn("h-4 w-4", isRTL ? "rotate-180" : "")}
                />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card hover:bg-muted/30 transition-colors cursor-pointer">
          <Link to="/bcp/services">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{strings.bcp.servicesTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {strings.bcpPlans.servicesSummary
                      .replace("{services}", String(services.length))
                      .replace("{critical}", String(criticalServices))}
                  </p>
                </div>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    isRTL ? "rotate-180" : ""
                  )}
                />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="glass-card hover:bg-muted/30 transition-colors cursor-pointer">
          <Link to="/bcp/tests">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-warning/10">
                  <TestTubeDiagonal className="h-5 w-5 text-status-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{strings.bcpTests.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {strings.bcpPlans.testsSummary
                      .replace("{tests}", String(tests.length))
                      .replace(
                        "{planned}",
                        String(
                          tests.filter((t) => t.status === "Planned").length
                        )
                      )}
                  </p>
                </div>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    isRTL ? "rotate-180" : ""
                  )}
                />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="glass-card hover:bg-muted/30 transition-colors cursor-pointer">
          <Link to="/bcp/dashboard">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-success/10">
                  <CheckCircle2 className="h-5 w-5 text-status-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{strings.bcpDashboard.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {strings.bcpPlans.dashboardOverviewDesc}
                  </p>
                </div>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    isRTL ? "rotate-180" : ""
                  )}
                />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Tests */}
      {tests.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <CardTitle className="text-base">
                {strings.bcpPlans.recentTestsTitle}
              </CardTitle>
              <Link to="/bcp/tests">
                <Button variant="ghost" size="sm" className="text-xs">
                  {strings.actions.viewAll}
                  <ArrowRight
                    className={cn("h-3 w-3 ml-1", isRTL ? "rotate-180" : "")}
                  />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="py-2 px-3 text-right font-medium">
                      {strings.bcpTests.name}
                    </th>
                    <th className="py-2 px-3 text-center font-medium">
                      {strings.bcpTests.type}
                    </th>
                    <th className="py-2 px-3 text-center font-medium">
                      {strings.bcpTests.date}
                    </th>
                    <th className="py-2 px-3 text-center font-medium">
                      {strings.bcpTests.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tests.slice(0, 5).map((test) => (
                    <tr
                      key={test.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-3 px-3 text-sm">{test.name}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            test.type === "BCP"
                              ? "border-primary text-primary"
                              : "border-status-danger text-status-danger"
                          )}
                        >
                          {test.type === "BCP"
                            ? strings.bcpTests.typeBCP
                            : strings.bcpTests.typeDR}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center text-sm">
                        {formatDate(test.date, locale)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            test.status === "Passed"
                              ? "default"
                              : test.status === "Failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {test.status === "Passed"
                            ? strings.bcpTests.statusPassed
                            : test.status === "Failed"
                            ? strings.bcpTests.statusFailed
                            : strings.bcpTests.statusPlanned}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BCPPlans;
