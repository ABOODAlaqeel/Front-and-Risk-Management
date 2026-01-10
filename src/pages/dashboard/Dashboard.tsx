import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/common/Loader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAuth } from "@/auth/authContext";
import { riskApi, kriApi } from "@/api";
import type { Risk, KRI } from "@/types";
import type { BackendRiskStats } from "@/types/backend";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  ArrowRight,
  Plus,
  Shield,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useI18n } from "@/i18n";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// ===========================================
// Types
// ===========================================

interface CategoryData {
  category: string;
  count: number;
}

interface LevelData {
  name: string;
  value: number;
  color: string;
}

// ===========================================
// Colors
// ===========================================

const LEVEL_COLORS: Record<string, string> = {
  critical: "hsl(var(--status-critical))",
  high: "hsl(var(--status-high))",
  medium: "hsl(var(--status-medium))",
  low: "hsl(var(--status-low))",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// ===========================================
// Component
// ===========================================

const Dashboard: React.FC = () => {
  const { can } = useAuth();
  const { strings, language } = useI18n();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [kris, setKris] = useState<KRI[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BackendRiskStats | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [risksData, krisData, statsData] = await Promise.all([
          riskApi.getAll(),
          kriApi.getAll(),
          riskApi.getStats(),
        ]);
        setRisks(risksData);
        setKris(krisData);
        setStats(statsData as BackendRiskStats);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <PageLoader text={strings.dashboard.loading} />;

  // Calculated statistics
  const criticalRisks = risks.filter(
    (r) => r.level === "Critical" || r.level === "High"
  );
  const openRisks = risks.filter((r) => r.status === "Open");
  const kriStats = {
    green: kris.filter((k) => k.status === "green").length,
    yellow: kris.filter((k) => k.status === "yellow").length,
    red: kris.filter((k) => k.status === "red").length,
  };

  // Average risk score
  const avgScore =
    risks.length > 0
      ? (risks.reduce((acc, r) => acc + r.score, 0) / risks.length).toFixed(1)
      : "0.0";

  // Chart data from backend stats
  const riskByCategoryData: CategoryData[] =
    stats?.by_category?.map((c) => ({
      category: c.category_name,
      count: c.count,
    })) || [];

  // Risk by level data from backend
  const riskByLevelData: LevelData[] = stats?.by_level
    ? Object.entries(stats.by_level)
        .filter(([_, value]) => value > 0)
        .map(([level, value]) => ({
          name: level.charAt(0).toUpperCase() + level.slice(1),
          value: value,
          color: LEVEL_COLORS[level] || LEVEL_COLORS.medium,
        }))
    : [];

  // Risk by status data from backend
  const riskByStatusData = stats?.by_status
    ? Object.entries(stats.by_status)
        .filter(([_, value]) => value > 0)
        .map(([status, value]) => ({
          status:
            status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1),
          count: value,
        }))
    : [];

  const getKriStatusLabel = (status: string) => {
    if (status === "red") return strings.dashboard.alertCritical;
    if (status === "yellow") return strings.dashboard.alertWarning;
    return strings.dashboard.current;
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.dashboard.title}</h1>
          <p className="text-muted-foreground">{strings.dashboard.subtitle}</p>
        </div>
        {can("canCreate") && (
          <Button asChild>
            <Link to="/risks/new">
              <Plus className="mr-2 h-4 w-4" />
              {strings.actions.newRisk}
            </Link>
          </Button>
        )}
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.dashboard.totalRisks}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {stats?.total || risks.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Badge variant="secondary">
                {openRisks.length} {strings.dashboard.open}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.dashboard.criticalHighRisks}
                </p>
                <p className="text-3xl font-bold mt-1 text-status-critical">
                  {criticalRisks.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-status-critical/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-status-critical" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-status-critical">
              <TrendingUp className="h-4 w-4" />
              <span>{strings.dashboard.requiresAttention}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.dashboard.kriStatus}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-status-success font-bold">
                    {kriStats.green}
                  </span>
                  <span className="text-status-warning font-bold">
                    {kriStats.yellow}
                  </span>
                  <span className="text-status-danger font-bold">
                    {kriStats.red}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            <div className="flex gap-1 mt-4">
              {(() => {
                const total = kriStats.green + kriStats.yellow + kriStats.red;
                if (total <= 0) {
                  return <div className="h-2 w-full rounded-full bg-muted" />;
                }
                const segments: Array<"green" | "yellow" | "red"> = [
                  ...Array.from(
                    { length: kriStats.green },
                    () => "green" as const
                  ),
                  ...Array.from(
                    { length: kriStats.yellow },
                    () => "yellow" as const
                  ),
                  ...Array.from({ length: kriStats.red }, () => "red" as const),
                ];
                return (
                  <div className="flex w-full gap-1">
                    {segments.map((seg, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === segments.length - 1;
                      const color =
                        seg === "green"
                          ? "bg-status-success"
                          : seg === "yellow"
                          ? "bg-status-warning"
                          : "bg-status-danger";
                      return (
                        <div
                          key={`${seg}-${idx}`}
                          className={`h-2 flex-1 ${color} ${
                            isFirst ? "rounded-l-full" : ""
                          } ${isLast ? "rounded-r-full" : ""}`}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.dashboard.avgRiskScore}
                </p>
                <p className="text-3xl font-bold mt-1">{avgScore}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-chart-3" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-chart-2">
              <TrendingDown className="h-4 w-4" />
              <span>{strings.dashboard.fromLastMonth}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KRI Detail Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {strings.dashboard.keyRiskIndicators}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reports/home">
              {strings.actions.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kris.slice(0, 4).map((kri) => (
            <Card
              key={kri.id}
              className={`glass-card border kri-${kri.status}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{kri.metricName}</p>
                  <StatusBadge status={kri.status}>
                    {getKriStatusLabel(kri.status)}
                  </StatusBadge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">{kri.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {strings.dashboard.target}: {kri.targetValue}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {strings.dashboard.updated}:{" "}
                    {new Date(kri.updatedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk by Level Pie Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              {strings.dashboard.risksByLevel}
            </CardTitle>
            <CardDescription>{strings.dashboard.risksByLevelDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {riskByLevelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskByLevelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskByLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">{strings.dashboard.noData}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk by Category Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {strings.dashboard.risksByCategory}
            </CardTitle>
            <CardDescription>{strings.dashboard.risksByCategoryDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {riskByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskByCategoryData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {riskByCategoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">{strings.dashboard.noData}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk by Status Chart */}
      {riskByStatusData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {strings.dashboard.risksByStatus}
            </CardTitle>
            <CardDescription>{strings.dashboard.risksByStatusDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskByStatusData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="status"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Risks Table */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {strings.dashboard.criticalHighTableTitle}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/risks">
              {strings.actions.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.id}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.title}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.category}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.score}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.level}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.owner}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.status}
                  </th>
                </tr>
              </thead>
              <tbody>
                {criticalRisks.slice(0, 5).map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        to={`/risks/${risk.id}`}
                        className="text-sm font-mono text-primary hover:underline"
                      >
                        {risk.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/risks/${risk.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {risk.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {strings.risks.categories?.[
                        risk.category as keyof typeof strings.risks.categories
                      ] ?? risk.category}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold">{risk.score}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={risk.level}>
                        {strings.risks.levels?.[
                          risk.level as keyof typeof strings.risks.levels
                        ] ?? risk.level}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {risk.owner}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={risk.status}>
                        {strings.risks.statuses?.[
                          risk.status as keyof typeof strings.risks.statuses
                        ] ?? risk.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
                {criticalRisks.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {strings.dashboard.noCriticalHigh}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Panel */}
      <Card className="glass-card border-status-warning/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-status-warning" />
            {strings.dashboard.riskAlerts}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {kris
              .filter((k) => k.status === "red" || k.status === "yellow")
              .slice(0, 4)
              .map((kri) => (
                <div
                  key={kri.id}
                  className={`p-3 rounded-lg border ${
                    kri.status === "red" ? "kri-red" : "kri-yellow"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{kri.metricName}</p>
                      <p className="text-xs opacity-70">
                        {strings.dashboard.current}: {kri.value} |{" "}
                        {strings.dashboard.target}: {kri.targetValue}
                      </p>
                    </div>
                    <StatusBadge status={kri.status}>
                      {kri.status === "red"
                        ? strings.dashboard.alertCritical
                        : strings.dashboard.alertWarning}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            {kris.filter((k) => k.status === "red" || k.status === "yellow")
              .length === 0 && (
              <div className="text-center py-4 text-muted-foreground">{strings.dashboard.noAlerts}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
