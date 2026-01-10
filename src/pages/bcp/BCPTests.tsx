import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/common/Loader";
import { useToast } from "@/hooks/use-toast";
import { bcpApi } from "@/api";
import type { BCPService, BCPTest } from "@/types";
import { useAuth } from "@/auth/authContext";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  Plus,
  CheckCircle2,
  Calendar,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusBadge = (
  status: BCPTest["status"],
  strings: ReturnType<typeof useI18n>["strings"]
) => {
  if (status === "Planned") {
    return (
      <Badge className="bg-primary/15 text-primary border border-primary/25">
        {strings.bcpTests.statusPlanned}
      </Badge>
    );
  }
  return (
    <Badge className="bg-status-high/15 text-status-high border border-status-high/30">
      {strings.bcpTests.statusCompleted}
    </Badge>
  );
};

const resultText = (
  status: BCPTest["status"],
  strings: ReturnType<typeof useI18n>["strings"]
) => {
  if (status === "Passed")
    return {
      text: strings.bcpTests.resultSuccess,
      className: "text-status-success",
    };
  if (status === "Failed")
    return {
      text: strings.bcpTests.resultFailed,
      className: "text-status-danger",
    };
  return { text: "—", className: "text-muted-foreground" };
};

const durationText = (
  test: BCPTest,
  strings: ReturnType<typeof useI18n>["strings"]
): string => {
  if (test.status === "Planned") return "—";
  if (
    typeof test.durationMinutes !== "number" ||
    !Number.isFinite(test.durationMinutes) ||
    test.durationMinutes <= 0
  )
    return "—";
  return `${test.durationMinutes} ${strings.bcpTests.minutesShort}`;
};

const displayId = (id: string): string => {
  const match = /^TEST-(\d+)$/.exec(id);
  if (!match) return id;
  return `T-${match[1]}`;
};

const BCPTests: React.FC = () => {
  const { strings, isRTL } = useI18n();
  const { toast } = useToast();
  const { can } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [tests, setTests] = React.useState<BCPTest[]>([]);
  const [services, setServices] = React.useState<BCPService[]>([]);
  const [drTargets, setDrTargets] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"add" | "edit" | "view">(
    "add"
  );
  const [editing, setEditing] = React.useState<BCPTest | null>(null);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<BCPTest["type"]>("BCP");
  const [date, setDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = React.useState<BCPTest["status"]>("Planned");
  const [durationMinutes, setDurationMinutes] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  const [drTargetId, setDrTargetId] = React.useState<string>("");

  const [toDelete, setToDelete] = React.useState<BCPTest | null>(null);

  React.useEffect(() => {
    if (!dialogOpen) return;
    if (dialogMode === "view") return;
    if (type !== "DR") return;
    if (!drTargetId.trim()) return;

    const exists = drTargets.some((t) => t.id === drTargetId.trim());
    if (!exists) setDrTargetId("");
  }, [dialogOpen, dialogMode, type, drTargetId, drTargets]);

  const validServiceIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of services) set.add(s.id);
    return set;
  }, [services]);

  const sanitizeServiceIds = React.useCallback(
    (ids: string[]) => {
      return ids.filter((id) => validServiceIds.has(id));
    },
    [validServiceIds]
  );

  React.useEffect(() => {
    if (!dialogOpen) return;
    if (dialogMode === "view") return;
    setServiceIds((prev) => sanitizeServiceIds(prev));
  }, [dialogOpen, dialogMode, sanitizeServiceIds]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        bcpApi.getTests(),
        bcpApi.getServices?.() ?? Promise.resolve([]),
      ]);
      setTests(t);
      setServices(Array.isArray(s) ? (s as BCPService[]) : []);

      try {
        const plan = await (bcpApi.getDRPlan?.() ?? Promise.resolve(null));
        const targets = (() => {
          if (!plan || typeof plan !== "object")
            return [] as Array<{ id: string; name: string }>;
          const maybe = plan as { sites?: unknown };
          if (!Array.isArray(maybe.sites)) return [];

          // New format: {id,name}[]
          const objects = (maybe.sites as unknown[])
            .map((v) =>
              v && typeof v === "object" ? (v as Record<string, unknown>) : null
            )
            .filter((v): v is Record<string, unknown> => !!v)
            .map((v) => ({
              id: typeof v.id === "string" ? v.id.trim() : "",
              name: typeof v.name === "string" ? v.name.trim() : "",
            }))
            .filter((s) => s.id.length > 0 && s.name.length > 0);
          if (objects.length > 0) return objects;

          // Old format fallback: string[]
          const strings = (maybe.sites as unknown[])
            .filter(
              (v): v is string => typeof v === "string" && v.trim().length > 0
            )
            .map((v) => v.trim());
          return strings.map((name, idx) => ({
            id: `DR-${String(idx + 1).padStart(3, "0")}`,
            name,
          }));
        })();
        setDrTargets(targets);
      } catch {
        setDrTargets([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setName("");
    setType("BCP");
    setDate(new Date().toISOString().slice(0, 10));
    setStatus("Planned");
    setDurationMinutes("");
    setNotes("");
    setServiceIds([]);
    setDrTargetId("");
  };

  const openCreate = () => {
    if (!can("canCreate")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.bcp.noPermissionCreate,
        variant: "destructive",
      });
      return;
    }
    setDialogMode("add");
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openView = (t: BCPTest) => {
    setDialogMode("view");
    setEditing(t);
    setName(t.name);
    setType(t.type);
    setDate(t.date);
    setStatus(t.status);
    setDurationMinutes(
      t.status === "Planned"
        ? ""
        : typeof t.durationMinutes === "number"
        ? String(t.durationMinutes)
        : ""
    );
    setNotes(t.notes ?? "");
    setServiceIds(
      sanitizeServiceIds(Array.isArray(t.serviceIds) ? t.serviceIds : [])
    );
    setDrTargetId(typeof t.drTargetId === "string" ? t.drTargetId : "");
    setDialogOpen(true);
  };

  const openEdit = (t: BCPTest) => {
    if (!can("canEdit")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.bcp.noPermissionEdit,
        variant: "destructive",
      });
      return;
    }
    setDialogMode("edit");
    setEditing(t);
    setName(t.name);
    setType(t.type);
    setDate(t.date);
    setStatus(t.status);
    setDurationMinutes(
      t.status === "Planned"
        ? ""
        : typeof t.durationMinutes === "number"
        ? String(t.durationMinutes)
        : ""
    );
    setNotes(t.notes ?? "");
    setServiceIds(
      sanitizeServiceIds(Array.isArray(t.serviceIds) ? t.serviceIds : [])
    );
    setDrTargetId(typeof t.drTargetId === "string" ? t.drTargetId : "");
    setDialogOpen(true);
  };

  const toggleService = (id: string, checked: boolean) => {
    setServiceIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  };

  const save = async () => {
    if (dialogMode === "view") {
      setDialogOpen(false);
      return;
    }

    if (!name.trim()) {
      toast({
        title: strings.bcpTests.missingFieldsTitle,
        description: strings.bcpTests.missingFieldsDesc,
        variant: "destructive",
      });
      return;
    }

    try {
      const sanitizedServiceIds = sanitizeServiceIds(serviceIds);
      const dur = durationMinutes.trim();
      const durNum = dur === "" ? undefined : Number(dur);
      const safeDurationMinutes =
        typeof durNum === "number" && Number.isFinite(durNum) && durNum > 0
          ? Math.round(durNum)
          : undefined;

      if (dialogMode === "edit" && editing) {
        if (!can("canEdit")) {
          toast({
            title: strings.common.notAllowed,
            description: strings.bcp.noPermissionEdit,
            variant: "destructive",
          });
          return;
        }
        await bcpApi.updateTest(editing.id, {
          name: name.trim(),
          type,
          date,
          status,
          durationMinutes:
            status === "Planned" ? undefined : safeDurationMinutes,
          notes: notes.trim() || undefined,
          serviceIds: sanitizedServiceIds.length
            ? sanitizedServiceIds
            : undefined,
          drTargetId:
            type === "DR" && drTargetId.trim() ? drTargetId.trim() : undefined,
        });
        toast({ title: strings.actions.save });
      } else {
        if (!can("canCreate")) {
          toast({
            title: strings.common.notAllowed,
            description: strings.bcp.noPermissionCreate,
            variant: "destructive",
          });
          return;
        }
        await bcpApi.createTest({
          name: name.trim(),
          type,
          date,
          status,
          durationMinutes:
            status === "Planned" ? undefined : safeDurationMinutes,
          notes: notes.trim() || undefined,
          serviceIds: sanitizedServiceIds.length
            ? sanitizedServiceIds
            : undefined,
          drTargetId:
            type === "DR" && drTargetId.trim() ? drTargetId.trim() : undefined,
        });
        toast({
          title: strings.bcpTests.createdTitle,
          description: strings.bcpTests.createdDesc,
        });
      }
      setDialogOpen(false);
      setEditing(null);
      resetForm();
      await load();
    } catch {
      toast({
        title: strings.bcpTests.saveFailedTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    if (!can("canDelete")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.bcp.noPermissionDelete,
        variant: "destructive",
      });
      return;
    }
    try {
      await bcpApi.deleteTest(toDelete.id);
      setToDelete(null);
      await load();
    } catch {
      toast({
        title: strings.bcpTests.saveFailedTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    }
  };

  const servicesById = React.useMemo(() => {
    const map = new Map<string, BCPService>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  const drTargetLabel = React.useMemo(() => {
    if (!drTargetId.trim()) return "—";
    const t = drTargets.find((x) => x.id === drTargetId.trim());
    return t ? `${t.id} • ${t.name}` : drTargetId.trim();
  }, [drTargetId, drTargets]);

  if (loading) return <PageLoader text={strings.common.loading} />;

  const plannedCount = tests.filter((t) => t.status === "Planned").length;
  const executed = tests.filter((t) => t.status !== "Planned");
  const executedCount = executed.length;
  const passedCount = executed.filter((t) => t.status === "Passed").length;
  const successRate =
    executedCount === 0 ? 0 : Math.round((passedCount / executedCount) * 100);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.bcpTests.title}</h1>
          <p className="text-muted-foreground">{strings.bcpTests.subtitle}</p>
        </div>
        {can("canCreate") && (
          <Button
            onClick={openCreate}
            variant="secondary"
            className="rounded-full px-5"
          >
            <Plus className="h-4 w-4 me-2" />
            {strings.bcpTests.scheduleTest}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn("space-y-1", isRTL ? "text-right" : "text-left")}
              >
                <div className="text-xs text-muted-foreground">
                  {strings.bcpTests.successRate}
                </div>
                <div className="text-2xl font-bold">{successRate}%</div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-status-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn("space-y-1", isRTL ? "text-right" : "text-left")}
              >
                <div className="text-xs text-muted-foreground">
                  {strings.bcpTests.scheduledTests}
                </div>
                <div className="text-2xl font-bold">{plannedCount}</div>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn("space-y-1", isRTL ? "text-right" : "text-left")}
              >
                <div className="text-xs text-muted-foreground">
                  {strings.bcpTests.executedTests}
                </div>
                <div className="text-2xl font-bold">{executedCount}</div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-status-high" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">
            {strings.bcpTests.listTitle}
          </CardTitle>
          <CardDescription>{strings.bcpTests.listDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.bcpTests.recordId}
                  </th>
                  <th
                    className={cn(
                      "py-3 px-4 font-medium",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {strings.bcpTests.plan}
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.bcpTests.date}
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.bcpTests.status}
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.bcpTests.result}
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.bcpTests.duration}
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    {strings.actions.viewAll}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => {
                  const res = resultText(t.status, strings);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-sm font-medium">
                        {displayId(t.id)}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4",
                          isRTL ? "text-right" : "text-left"
                        )}
                      >
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.type === "BCP"
                            ? strings.bcpTests.typeBCP
                            : strings.bcpTests.typeDR}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {t.date}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {statusBadge(t.status, strings)}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-center text-sm font-medium",
                          res.className
                        )}
                      >
                        {res.text}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {durationText(t, strings)}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={cn(
                            "flex items-center justify-center gap-1",
                            isRTL ? "flex-row-reverse" : ""
                          )}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openView(t)}
                            aria-label={strings.bcp.viewDetails}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {can("canEdit") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(t)}
                              aria-label={strings.actions.edit}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {can("canDelete") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setToDelete(t)}
                              aria-label={strings.actions.delete}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {tests.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {strings.bcpTests.noTests}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
            setEditing(null);
            setDialogMode("add");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "view"
                ? strings.bcp.viewDetails
                : dialogMode === "edit"
                ? strings.actions.edit
                : strings.bcpTests.addTest}
            </DialogTitle>
            <DialogDescription>{strings.bcpTests.dialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{strings.bcpTests.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={strings.bcpTests.namePlaceholder}
                disabled={dialogMode === "view"}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{strings.bcpTests.type}</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    const next = v as BCPTest["type"];
                    setType(next);
                    if (next !== "DR") setDrTargetId("");
                  }}
                  disabled={dialogMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BCP">
                      {strings.bcpTests.typeBCP}
                    </SelectItem>
                    <SelectItem value="DR">
                      {strings.bcpTests.typeDR}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">{strings.bcpTests.date}</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={dialogMode === "view"}
                />
              </div>
            </div>

            {type === "DR" && (
              <div className="space-y-2">
                <Label>{strings.bcp.targetId}</Label>
                {dialogMode === "view" ? (
                  <div
                    className={cn(
                      "rounded-md border bg-background/50 px-3 py-2 text-sm",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {drTargetLabel}
                  </div>
                ) : (
                  <Select
                    value={drTargetId || "none"}
                    onValueChange={(v) => setDrTargetId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={"—"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {drTargets.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.id} • {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>{strings.bcpTests.status}</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  const next = v as BCPTest["status"];
                  setStatus(next);
                  if (next === "Planned") setDurationMinutes("");
                }}
                disabled={dialogMode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">
                    {strings.bcpTests.statusPlanned}
                  </SelectItem>
                  <SelectItem value="Passed">
                    {strings.bcpTests.statusPassed}
                  </SelectItem>
                  <SelectItem value="Failed">
                    {strings.bcpTests.statusFailed}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status !== "Planned" && (
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">
                  {strings.bcpTests.durationMinutesLabel}
                </Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder={strings.bcpTests.durationMinutesPlaceholder}
                  disabled={dialogMode === "view"}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">{strings.bcpTests.notes}</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={strings.bcpTests.notesPlaceholder}
                disabled={dialogMode === "view"}
              />
            </div>

            <div className="space-y-2">
              <div
                className={cn(
                  "flex items-center justify-between gap-3",
                  isRTL ? "flex-row-reverse" : ""
                )}
              >
                <Label>{strings.bcp.linkedServices}</Label>
                <span className="text-xs text-muted-foreground">
                  {strings.bcp.linkedCount.replace(
                    "{count}",
                    String(serviceIds.length)
                  )}
                </span>
              </div>

              {services.length === 0 ? (
                <p
                  className={cn(
                    "text-sm text-muted-foreground",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {strings.bcp.noLinkedServices}
                </p>
              ) : dialogMode === "view" ? (
                serviceIds.length === 0 ? (
                  <p
                    className={cn(
                      "text-sm text-muted-foreground",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {strings.bcp.noLinkedServices}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {serviceIds
                      .map((id) => servicesById.get(id))
                      .filter((s): s is BCPService => !!s)
                      .map((s) => (
                        <div
                          key={s.id}
                          className={cn(
                            "flex items-center justify-between gap-3",
                            isRTL ? "flex-row-reverse" : ""
                          )}
                        >
                          <span className="text-sm font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {s.id}
                          </span>
                        </div>
                      ))}
                  </div>
                )
              ) : (
                <div className="max-h-40 overflow-auto rounded-md border bg-background/50 p-3 space-y-2">
                  {services
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((s) => {
                      const checked = serviceIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={cn(
                            "flex items-center justify-between gap-3 text-sm",
                            isRTL ? "flex-row-reverse" : ""
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-2",
                              isRTL ? "flex-row-reverse" : ""
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) =>
                                toggleService(s.id, v === true)
                              }
                            />
                            <span className="font-medium">{s.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {s.id}
                          </span>
                        </label>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className={cn(isRTL ? "sm:flex-row-reverse" : "")}>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {dialogMode === "view"
                ? strings.actions.back
                : strings.actions.cancel}
            </Button>
            {dialogMode !== "view" && (
              <Button onClick={save}>{strings.actions.save}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => (!open ? setToDelete(null) : undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{strings.actions.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `${toDelete.name}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(isRTL ? "sm:flex-row-reverse" : "")}>
            <AlertDialogCancel>{strings.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>
              {strings.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BCPTests;
