import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/Loader";
import { riskApi } from "@/api";
import type { Risk } from "@/types";
import { useI18n } from "@/i18n";
import { FileText, LineChart, Settings2, Table2 } from "lucide-react";

const ReportsHome: React.FC = () => {
  const { strings } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [risks, setRisks] = React.useState<Risk[]>([]);
  const [overdueRisks, setOverdueRisks] = React.useState<Risk[]>([]);
  const [overdueLoading, setOverdueLoading] = React.useState(true);

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

  React.useEffect(() => {
    const loadOverdue = async () => {
      try {
        setOverdueRisks(await riskApi.getOverdueReview());
      } catch {
        setOverdueRisks([]);
      } finally {
        setOverdueLoading(false);
      }
    };
    void loadOverdue();
  }, []);

  if (loading || overdueLoading)
    return <PageLoader text={strings.common.loading} />;

  const total = risks.length;
  const critical = risks.filter((r) => r.level === "Critical").length;
  const high = risks.filter((r) => r.level === "High").length;
  const closed = risks.filter((r) => r.status === "Closed").length;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">{strings.page.reportsHome}</h1>
        <p className="text-muted-foreground">{strings.reports.homeSubtitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">
              {strings.reports.totalRisks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">
              {strings.reports.criticalRisks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-status-critical">
              {critical}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">
              {strings.reports.highRisks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-status-warning">{high}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">
              {strings.reports.closedRisks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-status-success">{closed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Review Risks Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            {strings.reports.overdueReviewTitle || "Risks Overdue for Review"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueRisks.length === 0 ? (
            <p className="text-muted-foreground">
              {strings.reports.noOverdueRisks ||
                "No risks are overdue for review."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border-b">
                      {strings.reports.fieldTitle || "Title"}
                    </th>
                    <th className="px-2 py-1 border-b">
                      {strings.reports.fieldOwner || "Owner"}
                    </th>
                    <th className="px-2 py-1 border-b">
                      {strings.reports.fieldCategory || "Category"}
                    </th>
                    <th className="px-2 py-1 border-b">
                      {strings.reports.fieldStatus || "Status"}
                    </th>
                    <th className="px-2 py-1 border-b">
                      {strings.reports.fieldLastReviewedAt || "Last Reviewed"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overdueRisks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-accent/30">
                      <td className="px-2 py-1 border-b font-medium">
                        {risk.title}
                      </td>
                      <td className="px-2 py-1 border-b">{risk.owner}</td>
                      <td className="px-2 py-1 border-b">{risk.category}</td>
                      <td className="px-2 py-1 border-b">{risk.status}</td>
                      <td className="px-2 py-1 border-b">
                        {risk.lastReviewedAt
                          ? new Date(risk.lastReviewedAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.reports.quickReportsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {strings.reports.executiveReport}
                </p>
                <p className="text-sm text-muted-foreground">
                  {strings.reports.executiveSubtitle}
                </p>
              </div>
              <LineChart className="h-5 w-5 text-primary" />
            </div>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/reports/executive">{strings.actions.viewAll}</Link>
            </Button>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {strings.reports.standardReport}
                </p>
                <p className="text-sm text-muted-foreground">
                  {strings.reports.standardSubtitle}
                </p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/reports/standard">{strings.actions.viewAll}</Link>
            </Button>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{strings.reports.customReport}</p>
                <p className="text-sm text-muted-foreground">
                  {strings.reports.customSubtitle}
                </p>
              </div>
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/reports/custom">{strings.actions.viewAll}</Link>
            </Button>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {strings.reports.registerReport}
                </p>
                <p className="text-sm text-muted-foreground">
                  {strings.reports.registerSubtitle}
                </p>
              </div>
              <Table2 className="h-5 w-5 text-primary" />
            </div>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/reports/register">{strings.actions.viewAll}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsHome;
