import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/common/Loader";
import { riskApi } from "@/api";
import type { Risk } from "@/types";
import { useI18n } from "@/i18n";
import { FileText, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/authContext";
import { cn } from "@/lib/utils";

type FieldId =
  | "id"
  | "title"
  | "description"
  | "category"
  | "level"
  | "status"
  | "owner"
  | "likelihood"
  | "impact"
  | "score"
  | "createdAt"
  | "updatedAt";

const csvEscape = (value: unknown) => {
  const s = String(value ?? "");
  if (/[\n\r,"]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const htmlEscape = (value: unknown) => {
  const s = String(value ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

const getFieldValue = (r: Risk, field: FieldId): unknown => {
  switch (field) {
    case "id":
      return r.id;
    case "title":
      return r.title;
    case "description":
      return r.description;
    case "category":
      return r.category;
    case "level":
      return r.level;
    case "status":
      return r.status;
    case "owner":
      return r.owner;
    case "likelihood":
      return r.likelihood;
    case "impact":
      return r.impact;
    case "score":
      return r.score;
    case "createdAt":
      return r.createdAt;
    case "updatedAt":
      return r.updatedAt;
    default:
      return "";
  }
};

const CustomReport: React.FC = () => {
  const { strings, isRTL } = useI18n();
  const { toast } = useToast();
  const { can } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [risks, setRisks] = React.useState<Risk[]>([]);
  const [format, setFormat] = React.useState<"csv" | "html">("csv");

  const defaultFields: FieldId[] = [
    "id",
    "title",
    "level",
    "status",
    "owner",
    "score",
  ];
  const [selectedFields, setSelectedFields] =
    React.useState<FieldId[]>(defaultFields);

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

  const availableFields: Array<{ id: FieldId; label: string }> = [
    { id: "id", label: strings.table.id },
    { id: "title", label: strings.table.title },
    { id: "description", label: strings.table.description },
    { id: "category", label: strings.table.category },
    { id: "level", label: strings.table.level },
    { id: "status", label: strings.table.status },
    { id: "owner", label: strings.table.owner },
    { id: "likelihood", label: strings.reports.fieldLikelihood },
    { id: "impact", label: strings.reports.fieldImpact },
    { id: "score", label: strings.table.score },
    { id: "createdAt", label: strings.reports.fieldCreatedAt },
    { id: "updatedAt", label: strings.table.updated },
  ];

  const toggleField = (fieldId: FieldId) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((f) => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const reset = () => setSelectedFields(defaultFields);

  const generate = () => {
    if (!can("canExport")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.reports.noExportPermission,
        variant: "destructive",
      });
      return;
    }

    if (selectedFields.length === 0) {
      toast({
        title: strings.reports.missingFieldsTitle,
        description: strings.reports.missingFieldsDesc,
        variant: "destructive",
      });
      return;
    }

    const rows = risks
      .slice()
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((r) => selectedFields.map((f) => getFieldValue(r, f)));

    const fileBase = `risk-custom-${new Date().toISOString().slice(0, 10)}`;

    if (format === "csv") {
      const header = selectedFields
        .map((f) => availableFields.find((a) => a.id === f)?.label ?? f)
        .map(csvEscape)
        .join(",");
      const csv = [
        header,
        ...rows.map((row) => row.map(csvEscape).join(",")),
      ].join("\n");
      downloadTextFile(`${fileBase}.csv`, csv, "text/csv;charset=utf-8");
      toast({
        title: strings.reports.exportReadyTitle,
        description: strings.reports.exportCsvDesc,
      });
      return;
    }

    const th = selectedFields
      .map(
        (f) =>
          `<th>${htmlEscape(
            availableFields.find((a) => a.id === f)?.label ?? f
          )}</th>`
      )
      .join("");
    const trs = rows
      .map(
        (row) =>
          `<tr>${row.map((v) => `<td>${htmlEscape(v)}</td>`).join("")}</tr>`
      )
      .join("");

    const html = `<!doctype html>
<html lang="${isRTL ? "ar" : "en"}" dir="${isRTL ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(strings.reports.customTitle)}</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; }
      h1 { margin: 0 0 8px 0; }
      .meta { color: #555; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: start; vertical-align: top; }
      th { background: #fafafa; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>${htmlEscape(strings.reports.customTitle)}</h1>
    <div class="meta">${htmlEscape(strings.reports.generated)}: ${htmlEscape(
      new Date().toISOString()
    )}</div>
    <table>
      <thead><tr>${th}</tr></thead>
      <tbody>${trs}</tbody>
    </table>
    <p style="margin-top:12px;color:#666;font-size:12px;">${htmlEscape(
      strings.reports.noteHtml
    )}</p>
  </body>
</html>`;

    downloadTextFile(`${fileBase}.html`, html, "text/html;charset=utf-8");
    toast({
      title: strings.reports.exportReadyTitle,
      description: strings.reports.exportHtmlDesc,
    });
  };

  if (loading) return <PageLoader text={strings.common.loading} />;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">{strings.reports.customTitle}</h1>
        <p className="text-muted-foreground">
          {strings.reports.customSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">
                {strings.reports.reportConfigTitle}
              </CardTitle>
              <CardDescription>
                {strings.reports.reportConfigDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{strings.reports.format}</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as "csv" | "html")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                className={isRTL ? "flex gap-2 flex-row-reverse" : "flex gap-2"}
              >
                <Button
                  className="flex-1 gap-2"
                  onClick={generate}
                  disabled={!can("canExport")}
                >
                  <FileText className="h-4 w-4" />
                  {strings.reports.generate}
                </Button>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  {strings.actions.reset}
                </Button>
              </div>

              {!can("canExport") && (
                <p className="text-xs text-muted-foreground">
                  {strings.reports.exportPermissionHint}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{strings.reports.fieldsTitle}</CardTitle>
              <CardDescription>{strings.reports.fieldsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availableFields.map((field) => (
                  <div
                    key={field.id}
                    className={
                      isRTL
                        ? "flex items-center gap-2 flex-row-reverse"
                        : "flex items-center gap-2"
                    }
                  >
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                    <Label htmlFor={field.id} className="cursor-pointer">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{strings.reports.previewTitle}</CardTitle>
              <CardDescription>
                {strings.reports.previewDesc
                  .replace("{selected}", String(selectedFields.length))
                  .replace("{total}", String(availableFields.length))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedFields.map((id) => {
                  const label =
                    availableFields.find((f) => f.id === id)?.label ?? id;
                  return (
                    <span
                      key={id}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomReport;
