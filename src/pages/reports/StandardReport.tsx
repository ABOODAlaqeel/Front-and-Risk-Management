import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/Loader";
import { riskApi } from "@/api";
import type { Risk } from "@/types";
import { useI18n } from "@/i18n";
import { Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAuth } from "@/auth/authContext";

const csvEscape = (value: unknown) => {
  const s = String(value ?? "");
  if (/[\n\r,"]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadTextFile = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const StandardReport: React.FC = () => {
  const { strings, isRTL } = useI18n();
  const { can } = useAuth();
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

  const exportCsv = () => {
    if (!can("canExport")) return;

    const headers = [
      strings.table.id,
      strings.table.title,
      strings.table.category,
      strings.table.level,
      strings.table.status,
      strings.table.owner,
      strings.table.score,
    ];

    const rows = risks.map((r) => [
      r.id,
      r.title,
      r.category,
      r.level,
      r.status,
      r.owner,
      r.score,
    ]);
    const csv = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");
    downloadTextFile(
      `risk-standard-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
  };

  if (loading) return <PageLoader text={strings.common.loading} />;

  const criticalCount = risks.filter((r) => r.level === "Critical").length;
  const highCount = risks.filter((r) => r.level === "High").length;
  const closedCount = risks.filter((r) => r.status === "Closed").length;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">
            {strings.reports.standardTitle}
          </h1>
          <p className="text-muted-foreground">
            {strings.reports.standardSubtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 me-2" />
            {strings.reports.print}
          </Button>
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={!can("canExport")}
          >
            <Download className="h-4 w-4 me-2" />
            {strings.reports.exportCsv}
          </Button>
        </div>
      </div>

      <Card className="hidden print:block">
        <CardHeader>
          <CardTitle className={isRTL ? "text-right" : "text-left"}>
            {strings.reports.standardTitle}
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
          <CardTitle>{strings.reports.summaryTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {risks.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {strings.reports.totalRisks}
              </div>
            </div>
            <div className="text-center p-4 bg-status-critical/10 rounded-lg">
              <div className="text-3xl font-bold text-status-critical">
                {criticalCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {strings.reports.criticalRisks}
              </div>
            </div>
            <div className="text-center p-4 bg-status-warning/10 rounded-lg">
              <div className="text-3xl font-bold text-status-warning">
                {highCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {strings.reports.highRisks}
              </div>
            </div>
            <div className="text-center p-4 bg-status-success/10 rounded-lg">
              <div className="text-3xl font-bold text-status-success">
                {closedCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {strings.reports.closedRisks}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.reports.detailedTableTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {strings.reports.noRisksAvailable}
            </p>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{strings.table.id}</TableHead>
                    <TableHead>{strings.table.title}</TableHead>
                    <TableHead>{strings.table.category}</TableHead>
                    <TableHead>{strings.table.status}</TableHead>
                    <TableHead
                      className={cn(isRTL ? "text-left" : "text-right")}
                    >
                      {strings.table.score}
                    </TableHead>
                    <TableHead>{strings.table.level}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks
                    .slice()
                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.id}</TableCell>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>
                          {strings.risks.categories?.[
                            r.category as keyof typeof strings.risks.categories
                          ] ?? r.category}
                        </TableCell>
                        <TableCell>
                          {strings.risks.statuses?.[
                            r.status as keyof typeof strings.risks.statuses
                          ] ?? r.status}
                        </TableCell>
                        <TableCell
                          className={cn(isRTL ? "text-left" : "text-right")}
                        >
                          {r.score}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.level}>
                            {strings.risks.levels?.[
                              r.level as keyof typeof strings.risks.levels
                            ] ?? r.level}
                          </StatusBadge>
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

export default StandardReport;
