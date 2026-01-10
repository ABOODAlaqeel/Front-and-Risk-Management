/**
 * BCP Dashboard - Business continuity overview
 * Provides a consolidated view of BCP/DR statistics.
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
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/common/Loader";
import { bcpApi } from "@/api";
import type { BCPService, BCPTest, DRSite } from "@/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowRight,
  Server,
  FileText,
  TestTubeDiagonal,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  TrendingUp,
  Shield,
} from "lucide-react";

// ===========================================
// Types
// ===========================================

interface BCPlanData {
  lastUpdated: string;
  status: string;
  sections: string[];
  title?: string;
  objectives?: string;
}

interface DRPlanData {
  lastUpdated: string;
  rto: string;
  rpo: string;
  sites: DRSite[];
}

// ===========================================
// Helper Functions
// ===========================================

const parseDurationToHours = (value: string): number | null => {
  const raw = value?.trim().toLowerCase() || "";
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  if (raw.includes("minute")) return n / 60;
  if (raw.includes("hour")) return n;
  if (raw.includes("day")) return n * 24;
  return n;
};

const formatDate = (value: string, locale: string): string => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(locale);
  } catch {
    return value;
  }
};

const statusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-status-success/15 text-status-success";
    case "draft":
      return "bg-muted/40 text-muted-foreground";
    case "under_review":
    case "in review":
      return "bg-status-warning/15 text-status-warning";
    case "approved":
      return "bg-primary/15 text-primary";
    default:
      return "bg-muted/40 text-muted-foreground";
  }
};

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const siteTypeBadgeClass = (siteType?: string) => {
  const normalized = (siteType || "").toLowerCase();
  if (normalized.includes("hot"))
    return "border-status-danger text-status-danger";
  if (normalized.includes("warm"))
    return "border-status-warning text-status-warning";
  return "border-blue-500 text-blue-500";
};

const siteTypeLabel = (siteType?: string) =>
  (siteType || "warm_site")
    .replace("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

const siteActiveVariant = (isActive?: boolean): BadgeVariant =>
  isActive !== false ? "default" : "secondary";

// ===========================================
// Main Component
// ===========================================

const BCPDashboard: React.FC = () => {
  const { strings, isRTL, language } = useI18n();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const [loading, setLoading] = React.useState(true);
  const [services, setServices] = React.useState<BCPService[]>([]);
  const [plan, setPlan] = React.useState<BCPlanData | null>(null);
  const [dr, setDr] = React.useState<DRPlanData | null>(null);
  const [tests, setTests] = React.useState<BCPTest[]>([]);
  const [drSites, setDrSites] = React.useState<DRSite[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [svc, bc, drPlan, testsList, sites] = await Promise.all([
          bcpApi.getServices(),
          bcpApi.getBCPlan(),
          bcpApi.getDRPlan(),
          bcpApi.getTests?.() ?? Promise.resolve([]),
          bcpApi.getDRSites?.() ?? Promise.resolve([]),
        ]);
        setServices(svc);
        setPlan(bc as BCPlanData);
        setDr(drPlan as DRPlanData);
        setTests(Array.isArray(testsList) ? (testsList as BCPTest[]) : []);
        setDrSites(Array.isArray(sites) ? sites : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <PageLoader text={strings.common.loading} />;

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

  // Services Statistics
  const totalServices = services.length;
  const criticalServices = services.filter(
    (s) => s.criticality?.toLowerCase() === "critical"
  ).length;
  const highServices = services.filter(
    (s) => s.criticality?.toLowerCase() === "high"
  ).length;
  const mediumServices = services.filter(
    (s) => s.criticality?.toLowerCase() === "medium"
  ).length;
  const lowServices = services.filter(
    (s) => s.criticality?.toLowerCase() === "low"
  ).length;

  // Tests Statistics
  const totalTests = tests.length;
  const passedTests = tests.filter((t) => t.status === "Passed").length;
  const failedTests = tests.filter((t) => t.status === "Failed").length;
  const plannedTests = tests.filter((t) => t.status === "Planned").length;
  const bcpTests = tests.filter((t) => t.type === "BCP").length;
  const drTests = tests.filter((t) => t.type === "DR").length;
  const successRate =
    totalTests > 0
      ? Math.round((passedTests / (passedTests + failedTests || 1)) * 100)
      : 0;

  // Upcoming Tests (next 30 days)
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 30);
  const upcomingTests = tests.filter((t) => {
    if (t.status !== "Planned") return false;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) return false;
    return d >= now && d <= windowEnd;
  });

  // Average RTO
  const rtoHours = services
    .filter(
      (s) =>
        s.criticality?.toLowerCase() === "critical" ||
        s.criticality?.toLowerCase() === "high"
    )
    .map((s) => parseDurationToHours(s.rto))
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const avgRtoHours =
    rtoHours.length > 0
      ? rtoHours.reduce((acc, v) => acc + v, 0) / rtoHours.length
      : null;

  // Readiness calculation
  const readyPlans = (plan ? 1 : 0) + (dr ? 1 : 0);
  const readinessPct = Math.round((readyPlans / 2) * 100);

  // Distribution data for progress bars
  const distRows = [
    {
      key: "critical",
      label: strings.bcp.criticalityCritical,
      count: criticalServices,
      color: "bg-status-danger",
      pct: totalServices > 0 ? (criticalServices / totalServices) * 100 : 0,
    },
    {
      key: "high",
      label: strings.bcp.criticalityHigh,
      count: highServices,
      color: "bg-status-warning",
      pct: totalServices > 0 ? (highServices / totalServices) * 100 : 0,
    },
    {
      key: "medium",
      label: strings.bcp.criticalityMedium,
      count: mediumServices,
      color: "bg-status-medium",
      pct: totalServices > 0 ? (mediumServices / totalServices) * 100 : 0,
    },
    {
      key: "low",
      label: strings.bcp.criticalityLow,
      count: lowServices,
      color: "bg-status-low",
      pct: totalServices > 0 ? (lowServices / totalServices) * 100 : 0,
    },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            {strings.bcpDashboard.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {strings.bcpDashboard.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/bcp/plans">
              <FileText className="h-4 w-4 me-2" />
              {strings.bcpDashboard.plans}
            </Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-full">
            <Link to="/bcp/services">
              <Server className="h-4 w-4 me-2" />
              {strings.bcpDashboard.services}
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalServices}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpDashboard.services}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-danger/10">
                <AlertTriangle className="h-5 w-5 text-status-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalServices}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpDashboard.critical}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{drSites.length}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpDashboard.drSites}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-warning/10">
                <TestTubeDiagonal className="h-5 w-5 text-status-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTests}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpDashboard.tests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-success/10">
                <CheckCircle2 className="h-5 w-5 text-status-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpDashboard.successRateLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {avgRtoHours !== null ? avgRtoHours.toFixed(1) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpDashboard.avgRtoHoursLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tests Alert */}
      {upcomingTests.length > 0 && (
        <Alert className="glass-card border-status-warning/40 bg-status-warning/5">
          <AlertTriangle className="h-4 w-4 text-status-warning" />
          <AlertTitle className="text-status-warning">
            {strings.bcpDashboard.upcomingTestsTitle}
          </AlertTitle>
          <AlertDescription>
            {strings.bcpDashboard.upcomingTestsDesc.replace(
              "{count}",
              String(upcomingTests.length)
            )}
            .{" "}
            <Link to="/bcp/tests" className="text-primary underline">
              {strings.bcp.viewDetails}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {strings.bcpDashboard.bcpStatus}
            </CardTitle>
            <CardDescription>
              {strings.bcpDashboard.planStatusDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* BCP Plan */}
            <div className="p-4 rounded-lg border bg-background/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {strings.bcpPlans.bcpCardTitle}
                  </span>
                </div>
                <Badge className={statusBadgeClass(plan?.status || "")}>
                  {statusLabel(plan?.status || "")}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {strings.bcpDashboard.lastUpdated}:
                  </span>
                  <span className="mr-2 font-medium">
                    {formatDate(plan?.lastUpdated || "", locale)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {strings.bcpDashboard.sections}:
                  </span>
                  <span className="mr-2 font-medium">
                    {plan?.sections?.length || 0}
                  </span>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full mt-3"
              >
                <Link to="/bcp/plan">
                  {strings.bcp.viewDetails}
                  <ArrowRight
                    className={cn("h-4 w-4 mr-2", isRTL ? "rotate-180" : "")}
                  />
                </Link>
              </Button>
            </div>

            {/* DR Plan */}
            <div className="p-4 rounded-lg border bg-background/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-status-danger" />
                  <span className="font-medium">
                    {strings.bcpPlans.drCardTitle}
                  </span>
                </div>
                <Badge className="bg-status-success/15 text-status-success">
                  {strings.bcp.statusActive}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {strings.bcp.rtoTarget}:
                  </span>
                  <span className="mr-2 font-medium">{dr?.rto || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {strings.bcp.rpoTarget}:
                  </span>
                  <span className="mr-2 font-medium">{dr?.rpo || "-"}</span>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full mt-3"
              >
                <Link to="/bcp/dr">
                  {strings.bcp.viewDetails}
                  <ArrowRight
                    className={cn("h-4 w-4 mr-2", isRTL ? "rotate-180" : "")}
                  />
                </Link>
              </Button>
            </div>

            {/* Readiness Progress */}
            <div className="p-4 rounded-lg border bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {strings.bcpDashboard.readinessLabel}
                </span>
                <span className="text-sm text-muted-foreground">
                  {readinessPct}%
                </span>
              </div>
              <Progress value={readinessPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Services Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {strings.bcpDashboard.distributionTitle}
            </CardTitle>
            <CardDescription>
              {strings.bcpDashboard.distributionSubtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {distRows.map((row) => (
              <div key={row.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {strings.bcpDashboard.countOfTotal
                      .replace("{count}", String(row.count))
                      .replace("{total}", String(totalServices))}
                  </span>
                </div>
                <div className="relative h-2 rounded bg-muted/30 overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all",
                      row.color
                    )}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}

            <Button asChild variant="outline" size="sm" className="w-full mt-4">
              <Link to="/bcp/services">
                {strings.bcpDashboard.editServices}
                <ArrowRight
                  className={cn("h-4 w-4 mr-2", isRTL ? "rotate-180" : "")}
                />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tests and Sites Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tests Summary */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TestTubeDiagonal className="h-4 w-4" />
                {strings.bcpDashboard.testsSummaryTitle}
              </CardTitle>
              <Link to="/bcp/tests">
                <Button variant="ghost" size="sm">
                  {strings.actions.viewAll}
                  <ArrowRight className="h-4 w-4 mr-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-background/50 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-status-success" />
                </div>
                <p className="text-2xl font-bold text-status-success">
                  {passedTests}
                </p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpTests.statusPassed}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-background/50 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <XCircle className="h-5 w-5 text-status-danger" />
                </div>
                <p className="text-2xl font-bold text-status-danger">
                  {failedTests}
                </p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpTests.statusFailed}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-background/50 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <Calendar className="h-5 w-5 text-status-warning" />
                </div>
                <p className="text-2xl font-bold text-status-warning">
                  {plannedTests}
                </p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpTests.statusPlanned}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-background/50 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <TestTubeDiagonal className="h-5 w-5 text-primary" />
                </div>
                <p className="text-lg font-bold">
                  <span className="text-primary">{bcpTests}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-status-danger">{drTests}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpTests.typeBCP} / {strings.bcpTests.typeDR}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DR Sites Summary */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {strings.bcp.recoverySites}
              </CardTitle>
              <Link to="/bcp/dr">
                <Button variant="ghost" size="sm">
                  {strings.actions.viewAll}
                  <ArrowRight className="h-4 w-4 mr-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {drSites.length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {strings.bcp.noSites}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/bcp/dr">{strings.bcp.addSite}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {drSites.slice(0, 4).map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          (site.site_type || "").toLowerCase().includes("hot")
                            ? "border-status-danger text-status-danger"
                            : (site.site_type || "")
                                .toLowerCase()
                                .includes("warm")
                            ? "border-status-warning text-status-warning"
                            : "border-blue-500 text-blue-500"
                        )}
                      >
                        {(site.site_type || "warm_site")
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                      <span className="font-medium text-sm">{site.name}</span>
                    </div>
                    <Badge
                      variant={
                        site.is_active !== false ? "default" : "secondary"
                      }
                    >
                      {site.is_active !== false
                        ? strings.bcp.statusActive
                        : strings.bcp.statusInactive}
                    </Badge>
                  </div>
                ))}
                {drSites.length > 4 && (
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link to="/bcp/dr">
                      {strings.bcpDashboard.moreSites.replace(
                        "{count}",
                        String(drSites.length - 4)
                      )}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">
            {strings.bcpDashboard.quickLinks}
          </CardTitle>
          <CardDescription>
            {strings.bcpDashboard.quickLinksDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              asChild
              variant="secondary"
              className="justify-start h-auto py-3"
            >
              <Link to="/bcp/plan" className="flex flex-col items-start">
                <span className="font-medium">
                  {strings.bcpPlans.bcpCardTitle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan?.sections?.length || 0} {strings.bcpDashboard.sections}
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="justify-start h-auto py-3"
            >
              <Link to="/bcp/dr" className="flex flex-col items-start">
                <span className="font-medium">
                  {strings.bcpPlans.drCardTitle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {drSites.length} {strings.bcpDashboard.sites}
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="justify-start h-auto py-3"
            >
              <Link to="/bcp/services" className="flex flex-col items-start">
                <span className="font-medium">
                  {strings.bcpDashboard.services}
                </span>
                <span className="text-xs text-muted-foreground">
                  {totalServices} {strings.bcpDashboard.services}
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="justify-start h-auto py-3"
            >
              <Link to="/bcp/tests" className="flex flex-col items-start">
                <span className="font-medium">
                  {strings.bcpDashboard.tests}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plannedTests} {strings.bcpTests.statusPlanned}
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BCPDashboard;
