/**
 * RiskAppetitePage - Risk appetite page.
 *
 * View and manage risk appetite and limits.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/common/Loader";
import { useToast } from "@/hooks/use-toast";
import { riskAppetiteApi } from "@/api";
import { useI18n } from "@/i18n";
import type {
  AppetiteThresholds,
  AppetiteSummary,
  ExceededRisk,
  AppetiteLevel,
} from "@/api/riskAppetiteApi";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Settings,
  RefreshCw,
  Play,
  Target,
  Shield,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

// ===========================================
// Helper Functions
// ===========================================

const getLevelBadge = (
  level: AppetiteLevel,
  labels: {
    within: string;
    approaching: string;
    exceeded: string;
    critical: string;
  }
) => {
  const config: Record<
    AppetiteLevel,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: React.ReactNode;
    }
  > = {
    within_appetite: {
      label: labels.within,
      variant: "outline",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    approaching_limit: {
      label: labels.approaching,
      variant: "secondary",
      icon: <TrendingUp className="h-3 w-3" />,
    },
    exceeded: {
      label: labels.exceeded,
      variant: "default",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    critical: {
      label: labels.critical,
      variant: "destructive",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const c = config[level] || config.within_appetite;
  return (
    <Badge variant={c.variant} className="flex items-center gap-1">
      {c.icon}
      {c.label}
    </Badge>
  );
};

const getComplianceColor = (rate: number) => {
  if (rate >= 90) return "text-green-500";
  if (rate >= 70) return "text-yellow-500";
  if (rate >= 50) return "text-orange-500";
  return "text-red-500";
};

// ===========================================
// Component
// ===========================================

const RiskAppetitePage: React.FC = () => {
  const { strings } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const levelLabels = {
    within: strings.riskAppetitePage.levelWithin,
    approaching: strings.riskAppetitePage.levelApproaching,
    exceeded: strings.riskAppetitePage.levelExceeded,
    critical: strings.riskAppetitePage.levelCritical,
  };

  // State
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<AppetiteSummary | null>(null);
  const [exceededRisks, setExceededRisks] = React.useState<ExceededRisk[]>([]);
  const [thresholds, setThresholds] = React.useState<AppetiteThresholds | null>(
    null
  );
  const [editThresholds, setEditThresholds] = React.useState<
    Partial<AppetiteThresholds>
  >({});
  const [thresholdsDialogOpen, setThresholdsDialogOpen] = React.useState(false);
  const [checkingAll, setCheckingAll] = React.useState(false);

  // ===========================================
  // Data Fetching
  // ===========================================

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData, exceededData, thresholdsData] = await Promise.all([
        riskAppetiteApi.getSummary(),
        riskAppetiteApi.getExceededRisks(),
        riskAppetiteApi.getThresholds(),
      ]);
      setSummary(summaryData);
      setExceededRisks(exceededData.risks || []);
      setThresholds(thresholdsData);
      setEditThresholds(thresholdsData);
    } catch (error) {
      console.error("Failed to load risk appetite data:", error);
      toast({
        title: strings.riskAppetitePage.toastErrorTitle,
        description: strings.riskAppetitePage.toastLoadFailed,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // ===========================================
  // Actions
  // ===========================================

  const handleCheckAllRisks = async () => {
    try {
      setCheckingAll(true);
      const result = await riskAppetiteApi.checkAllRisks();
      toast({
        title: strings.riskAppetitePage.toastCheckDoneTitle,
        description: strings.riskAppetitePage.toastCheckDoneDesc
          .replace("{total}", String(result.total_checked))
          .replace("{notifications}", String(result.notifications_sent))
          .replace("{escalations}", String(result.escalations_created)),
      });
      loadData();
    } catch (error) {
      toast({
        title: strings.riskAppetitePage.toastErrorTitle,
        description: strings.riskAppetitePage.toastCheckFailed,
        variant: "destructive",
      });
    } finally {
      setCheckingAll(false);
    }
  };

  const handleUpdateThresholds = async () => {
    try {
      await riskAppetiteApi.updateThresholds(editThresholds);
      toast({
        title: strings.riskAppetitePage.toastUpdateDoneTitle,
        description: strings.riskAppetitePage.toastUpdateDoneDesc,
      });
      setThresholdsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: strings.riskAppetitePage.toastErrorTitle,
        description: strings.riskAppetitePage.toastUpdateFailed,
        variant: "destructive",
      });
    }
  };

  // ===========================================
  // Render
  // ===========================================

  if (loading) {
    return <PageLoader text={strings.common.loading} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6" />
            {strings.riskAppetitePage.title}
          </h1>
          <p className="text-muted-foreground">
            {strings.riskAppetitePage.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {strings.riskAppetitePage.refresh}
          </Button>
          <Dialog
            open={thresholdsDialogOpen}
            onOpenChange={setThresholdsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {strings.riskAppetitePage.thresholdsSettings}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {strings.riskAppetitePage.thresholdsTitle}
                </DialogTitle>
                <DialogDescription>
                  {strings.riskAppetitePage.thresholdsDesc}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{strings.riskAppetitePage.lowLabel}</Label>
                    <Input
                      type="number"
                      value={editThresholds.low || ""}
                      onChange={(e) =>
                        setEditThresholds({
                          ...editThresholds,
                          low: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>{strings.riskAppetitePage.mediumLabel}</Label>
                    <Input
                      type="number"
                      value={editThresholds.medium || ""}
                      onChange={(e) =>
                        setEditThresholds({
                          ...editThresholds,
                          medium: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{strings.riskAppetitePage.highLabel}</Label>
                    <Input
                      type="number"
                      value={editThresholds.high || ""}
                      onChange={(e) =>
                        setEditThresholds({
                          ...editThresholds,
                          high: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>{strings.riskAppetitePage.criticalLabel}</Label>
                    <Input
                      type="number"
                      value={editThresholds.critical || ""}
                      onChange={(e) =>
                        setEditThresholds({
                          ...editThresholds,
                          critical: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>{strings.riskAppetitePage.approachingLabel}</Label>
                  <Input
                    type="number"
                    value={editThresholds.approaching_percentage || ""}
                    onChange={(e) =>
                      setEditThresholds({
                        ...editThresholds,
                        approaching_percentage: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setThresholdsDialogOpen(false)}
                >
                  {strings.riskAppetitePage.cancel}
                </Button>
                <Button onClick={handleUpdateThresholds}>
                  {strings.riskAppetitePage.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleCheckAllRisks} disabled={checkingAll}>
            <Play className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {checkingAll
              ? strings.riskAppetitePage.checking
              : strings.riskAppetitePage.checkAll}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.riskAppetitePage.totalActive}
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_active_risks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.riskAppetitePage.withinAppetite}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {summary?.within_appetite || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.riskAppetitePage.exceededAppetite}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary?.exceeded_appetite || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.riskAppetitePage.complianceRate}
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                getComplianceColor(summary?.compliance_rate || 0)
              )}
            >
              {summary?.compliance_rate || 0}%
            </div>
            <Progress value={summary?.compliance_rate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Thresholds Display */}
      {thresholds && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {strings.riskAppetitePage.currentThresholdsTitle}
            </CardTitle>
            <CardDescription>
              {strings.riskAppetitePage.currentThresholdsDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-600 dark:text-green-400">
                  {strings.riskAppetitePage.low}
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ≤ {thresholds.low}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  {strings.riskAppetitePage.medium}
                </div>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  ≤ {thresholds.medium}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  {strings.riskAppetitePage.high}
                </div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  ≤ {thresholds.high}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <div className="text-sm text-red-600 dark:text-red-400">
                  {strings.riskAppetitePage.critical}
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  ≥ {thresholds.critical}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {strings.riskAppetitePage.warningRate}
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {thresholds.approaching_percentage}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exceeded Risks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {strings.riskAppetitePage.exceededTitle.replace(
              "{count}",
              String(exceededRisks.length)
            )}
          </CardTitle>
          <CardDescription>
            {strings.riskAppetitePage.exceededDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exceededRisks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">
                {strings.riskAppetitePage.allWithinTitle}
              </p>
              <p className="text-sm">
                {strings.riskAppetitePage.allWithinDesc}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{strings.riskAppetitePage.tableCode}</TableHead>
                    <TableHead>{strings.riskAppetitePage.tableTitle}</TableHead>
                    <TableHead>{strings.riskAppetitePage.tableScore}</TableHead>
                    <TableHead>
                      {strings.riskAppetitePage.tableThreshold}
                    </TableHead>
                    <TableHead>
                      {strings.riskAppetitePage.tableExceeded}
                    </TableHead>
                    <TableHead>{strings.riskAppetitePage.tableLevel}</TableHead>
                    <TableHead>{strings.riskAppetitePage.tableStatus}</TableHead>
                    <TableHead className="w-[80px]">
                      {strings.riskAppetitePage.tableAction}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceededRisks.map((risk) => (
                    <TableRow
                      key={risk.id}
                      className="cursor-pointer hover:bg-accent/50"
                    >
                      <TableCell className="font-mono">
                        {risk.risk_code}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {risk.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{risk.score}</Badge>
                      </TableCell>
                      <TableCell>{risk.threshold}</TableCell>
                      <TableCell className="text-destructive font-medium">
                        +{risk.exceeded_by}
                      </TableCell>
                      <TableCell>{getLevelBadge(risk.level, levelLabels)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{risk.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/risks/${risk.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAppetitePage;
