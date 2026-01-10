import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/common/Loader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { riskApi } from "@/api";
import type { Risk } from "@/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Shield,
} from "lucide-react";

const ExecutiveReport: React.FC = () => {
  const { strings, isRTL } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [risks, setRisks] = React.useState<Risk[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        setRisks(await riskApi.getAll());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const critical = risks.filter((r) => r.level === "Critical");
  const high = risks.filter((r) => r.level === "High");
  const inProgress = risks.filter(
    (r) => r.status === "Open" || r.status === "Monitoring"
  );
  const closed = risks.filter((r) => r.status === "Closed");

  const topPriority = [...risks]
    .filter((r) => r.level === "Critical" || r.level === "High")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  if (loading) return <PageLoader text={strings.common.loading} />;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">
            {strings.reports.executiveTitle}
          </h1>
          <p className="text-muted-foreground">
            {strings.reports.executiveSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="h-4 w-4 me-2" />
            {strings.reports.print}
          </Button>
          <Button asChild>
            <Link to="/reports/custom">{strings.reports.customReport}</Link>
          </Button>
        </div>
      </div>

      <Card className="hidden print:block">
        <CardHeader>
          <CardTitle className={isRTL ? "text-right" : "text-left"}>
            {strings.reports.executiveTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.reports.executiveSummaryTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {strings.reports.executiveSummaryText
              .replace("{total}", String(risks.length))
              .replace("{critical}", String(critical.length))
              .replace("{closed}", String(closed.length))}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <Shield className="h-7 w-7 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{risks.length}</div>
              <div className="text-xs text-muted-foreground">
                {strings.reports.totalRisks}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-status-critical/10 text-center">
              <AlertTriangle className="h-7 w-7 text-status-critical mx-auto mb-2" />
              <div className="text-2xl font-bold">{critical.length}</div>
              <div className="text-xs text-muted-foreground">
                {strings.reports.criticalRisks}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-status-warning/10 text-center">
              <Clock className="h-7 w-7 text-status-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">{inProgress.length}</div>
              <div className="text-xs text-muted-foreground">
                {strings.reports.inProgress}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-status-success/10 text-center">
              <CheckCircle className="h-7 w-7 text-status-success mx-auto mb-2" />
              <div className="text-2xl font-bold">{closed.length}</div>
              <div className="text-xs text-muted-foreground">
                {strings.reports.closedRisks}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {strings.reports.highRisksLabel}: {high.length}
            </Badge>
            <Badge variant="secondary">{strings.reports.top5Included}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.reports.keyRisksTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {topPriority.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {strings.reports.noPriorityRisks}
            </p>
          ) : (
            <div className="space-y-3">
              {topPriority.map((r) => (
                <div key={r.id} className="p-4 border border-border rounded-lg">
                  <div
                    className={cn(
                      "flex items-start justify-between gap-4",
                      isRTL ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          isRTL ? "flex-row-reverse" : ""
                        )}
                      >
                        <p className="font-semibold truncate">{r.title}</p>
                        <StatusBadge status={r.level}>
                          {strings.risks.levels?.[
                            r.level as keyof typeof strings.risks.levels
                          ] ?? r.level}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {r.description}
                      </p>
                      <div
                        className={cn(
                          "flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground",
                          isRTL ? "flex-row-reverse" : ""
                        )}
                      >
                        <span>
                          {strings.table.id}:{" "}
                          <span className="text-foreground">{r.id}</span>
                        </span>
                        <span>
                          {strings.table.owner}:{" "}
                          <span className="text-foreground">{r.owner}</span>
                        </span>
                        <span>
                          {strings.table.score}:{" "}
                          <span className="text-foreground font-semibold">
                            {r.score}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="shrink-0 print:hidden"
                    >
                      <Link to={`/risks/${r.id}`}>
                        {strings.reports.viewRisk}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.reports.recommendationsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>{strings.reports.reco1}</li>
            <li>{strings.reports.reco2}</li>
            <li>{strings.reports.reco3}</li>
            <li>{strings.reports.reco4}</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="glass-card print:hidden">
        <CardHeader>
          <CardTitle>{strings.reports.quickLinksTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/reports/home">{strings.reports.reportsHome}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/reports/standard">{strings.reports.standardReport}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/analysis/matrix">{strings.page.riskMatrix}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveReport;
