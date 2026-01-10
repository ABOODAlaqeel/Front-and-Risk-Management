import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { riskApi } from "@/api";
import { PageLoader } from "@/components/common/Loader";
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
import type { Risk } from "@/types";
import { Download, FileText } from "lucide-react";
import { useI18n } from "@/i18n";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const getQuarterLabel = (d: Date) => {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
};

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

const Reports: React.FC = () => {
  const { toast } = useToast();
  const { can } = useAuth();
  const { strings, isRTL } = useI18n();

  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await riskApi.getAll();
        setRisks(data);
      } catch {
        toast({
          title: strings.reports.failedToLoadTitle,
          description: strings.common.pleaseTryAgain,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const period = useMemo(() => getQuarterLabel(new Date()), []);

  const summary = useMemo(() => {
    const total = risks.length;
    const byLevel = {
      Critical: risks.filter((r) => r.level === "Critical").length,
      High: risks.filter((r) => r.level === "High").length,
      Medium: risks.filter((r) => r.level === "Medium").length,
      Low: risks.filter((r) => r.level === "Low").length,
    };
    const closed = risks.filter((r) => r.status === "Closed").length;
    return { total, closed, byLevel };
  }, [risks]);

  const topRisks = useMemo(() => {
    return [...risks]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10);
  }, [risks]);

  const displayRisks = useMemo(() => {
    if (showAll)
      return [...risks].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return topRisks;
  }, [risks, showAll, topRisks]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of risks) map.set(r.category, (map.get(r.category) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [risks]);

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of risks) map.set(r.status, (map.get(r.status) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [risks]);

  const exportExcel = () => {
    if (!can("canExport")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.reports.noExportPermission,
        variant: "destructive",
      });
      return;
    }

    const header = [
      "id",
      "title",
      "category",
      "owner",
      "status",
      "likelihood",
      "impact",
      "score",
      "level",
      "createdAt",
      "updatedAt",
    ];
    const rows = risks.map((r) => [
      r.id,
      r.title,
      r.category,
      r.owner,
      r.status,
      r.likelihood,
      r.impact,
      r.score,
      r.level,
      r.createdAt,
      r.updatedAt,
    ]);
    const csv = [
      header.join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");
    downloadTextFile(
      `risk-register-${period}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
    toast({
      title: strings.reports.exportReadyTitle,
      description: strings.reports.exportCsvDesc,
    });
  };

  const exportPdf = () => {
    if (!can("canExport")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.reports.noExportPermission,
        variant: "destructive",
      });
      return;
    }

    const htmlEscape = (value: unknown) => {
      const s = String(value ?? "");
      return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const categoryRows = categoryBreakdown
      .map(
        (r) =>
          `<tr><td>${htmlEscape(
            r.category
          )}</td><td style="text-align:end;">${htmlEscape(r.count)}</td></tr>`
      )
      .join("");

    const statusRows = statusBreakdown
      .map(
        (r) =>
          `<tr><td>${htmlEscape(
            r.status
          )}</td><td style="text-align:end;">${htmlEscape(r.count)}</td></tr>`
      )
      .join("");

    const registerRows = displayRisks
      .map(
        (r) =>
          `<tr>
            <td>${htmlEscape(r.id)}</td>
            <td>${htmlEscape(r.title)}</td>
            <td>${htmlEscape(r.owner)}</td>
            <td>${htmlEscape(r.status)}</td>
            <td style="text-align:end;">${htmlEscape(r.score)}</td>
            <td>${htmlEscape(r.level)}</td>
          </tr>`
      )
      .join("");

    const html = `<!doctype html>
<html lang="${isRTL ? "ar" : "en"}" dir="${isRTL ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(strings.reports.reportTitle)} - ${htmlEscape(
      period
    )}</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; }
      h1 { margin: 0 0 8px 0; }
      .meta { color: #555; margin-bottom: 16px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 16px 0 24px; }
      .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 16px 0 24px; }
      .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: start; vertical-align: top; }
      th { background: #fafafa; }
      .small { font-size: 12px; color: #555; }
      .muted { color: #666; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>${htmlEscape(strings.reports.reportTitle)}</h1>
    <div class="meta">${htmlEscape(strings.reports.period)}: ${htmlEscape(
      period
    )} • ${htmlEscape(strings.reports.generated)}: ${htmlEscape(
      new Date().toISOString()
    )}</div>
    <div class="grid">
      <div class="card"><div class="small">${htmlEscape(
        strings.reports.totalRisks
      )}</div><div style="font-size: 20px; font-weight: 700;">${
      summary.total
    }</div></div>
      <div class="card"><div class="small">${htmlEscape(
        strings.reports.closedRisks
      )}</div><div style="font-size: 20px; font-weight: 700;">${
      summary.closed
    }</div></div>
      <div class="card"><div class="small">Critical</div><div style="font-size: 20px; font-weight: 700;">${
        summary.byLevel.Critical
      }</div></div>
      <div class="card"><div class="small">High</div><div style="font-size: 20px; font-weight: 700;">${
        summary.byLevel.High
      }</div></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="small">${htmlEscape(strings.reports.byCategory)}</div>
        ${
          categoryBreakdown.length === 0
            ? `<div class="muted" style="margin-top:6px;">${htmlEscape(
                strings.reports.noData
              )}</div>`
            : `
          <table style="margin-top:6px;">
            <thead><tr><th>${htmlEscape(
              strings.table.category
            )}</th><th style="text-align:end;">${htmlEscape(
                strings.table.count
              )}</th></tr></thead>
            <tbody>${categoryRows}</tbody>
          </table>
        `
        }
      </div>
      <div class="card">
        <div class="small">${htmlEscape(strings.reports.byStatus)}</div>
        ${
          statusBreakdown.length === 0
            ? `<div class="muted" style="margin-top:6px;">${htmlEscape(
                strings.reports.noData
              )}</div>`
            : `
          <table style="margin-top:6px;">
            <thead><tr><th>${htmlEscape(
              strings.table.status
            )}</th><th style="text-align:end;">${htmlEscape(
                strings.table.count
              )}</th></tr></thead>
            <tbody>${statusRows}</tbody>
          </table>
        `
        }
      </div>
    </div>

    <h2>${htmlEscape(strings.reports.registerTitle)}</h2>
    <table>
      <thead>
        <tr>
          <th>${htmlEscape(strings.table.id)}</th><th>${htmlEscape(
      strings.table.title
    )}</th><th>${htmlEscape(strings.table.owner)}</th><th>${htmlEscape(
      strings.table.status
    )}</th><th>${htmlEscape(strings.table.score)}</th><th>${htmlEscape(
      strings.table.level
    )}</th>
        </tr>
      </thead>
      <tbody>
        ${registerRows}
      </tbody>
    </table>
    <p class="small">${htmlEscape(
      showAll ? strings.reports.showingAll : strings.reports.showingTop10
    )}.</p>
    <p class="small">${htmlEscape(strings.reports.noteHtml)}</p>
  </body>
</html>`;

    downloadTextFile(
      `risk-report-${period}.html`,
      html,
      "text/html;charset=utf-8"
    );
    toast({
      title: strings.reports.exportReadyTitle,
      description: strings.reports.exportHtmlDesc,
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.page.reportsHome}</h1>
          <p className="text-muted-foreground">
            {strings.reports.period}: {period}
          </p>
        </div>
        <div className="flex gap-2">
          {can("canExport") && (
            <>
              <Button variant="outline" onClick={exportPdf}>
                <Download className="h-4 w-4 me-2" />
                {strings.reports.exportHtml}
              </Button>
              <Button variant="outline" onClick={exportExcel}>
                <Download className="h-4 w-4 me-2" />
                {strings.reports.exportCsv}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/reports/executive">{strings.reports.executiveReport}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/reports/standard">{strings.reports.standardReport}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/reports/custom">{strings.reports.customReport}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle
              className={cn(
                "flex items-center gap-2",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <FileText className="h-4 w-4" />
              {strings.reports.totalRisks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{strings.reports.criticalRisks}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.byLevel.Critical}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{strings.reports.highRisks}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.byLevel.High}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{strings.reports.closedRisks}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.closed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{strings.reports.byCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {strings.reports.noData}
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{strings.table.category}</TableHead>
                      <TableHead className={isRTL ? "text-left" : "text-right"}>
                        {strings.table.count}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryBreakdown.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell className="font-medium">
                          {row.category}
                        </TableCell>
                        <TableCell
                          className={isRTL ? "text-left" : "text-right"}
                        >
                          {row.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{strings.reports.byStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {strings.reports.noData}
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{strings.table.status}</TableHead>
                      <TableHead className={isRTL ? "text-left" : "text-right"}>
                        {strings.table.count}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusBreakdown.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell className="font-medium">
                          {row.status}
                        </TableCell>
                        <TableCell
                          className={isRTL ? "text-left" : "text-right"}
                        >
                          {row.count}
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

      <Card className="glass-card">
        <CardHeader>
          <div
            className={cn(
              "flex items-center justify-between gap-4",
              isRTL ? "flex-row-reverse" : ""
            )}
          >
            <CardTitle>{strings.reports.registerTitle}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? strings.reports.top10 : strings.reports.all}
            </Button>
          </div>
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
                    <TableHead>{strings.table.owner}</TableHead>
                    <TableHead>{strings.table.status}</TableHead>
                    <TableHead className={isRTL ? "text-left" : "text-right"}>
                      {strings.table.score}
                    </TableHead>
                    <TableHead>{strings.table.level}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRisks.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell>{r.title}</TableCell>
                      <TableCell>{r.owner}</TableCell>
                      <TableCell>
                        {strings.risks.statuses?.[
                          r.status as keyof typeof strings.risks.statuses
                        ] ?? r.status}
                      </TableCell>
                      <TableCell className={isRTL ? "text-left" : "text-right"}>
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
          <p className="text-xs text-muted-foreground mt-2">
            {showAll
              ? `${strings.reports.showingAll}.`
              : `${strings.reports.showingTop10}.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
