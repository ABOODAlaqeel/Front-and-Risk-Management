import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/common/Loader";
import { StatusBadge } from "@/components/common/StatusBadge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { treatmentApi, riskApi } from "@/api";
import { userApi } from "@/api";
import { ACTION_STATUSES, TREATMENT_APPROACHES } from "@/utils/constants";
import { usePermissions } from "@/hooks/usePermissions";
import type { Risk, Treatment, TreatmentAction, User } from "@/types";
import { ArrowLeft, Plus, Save, Pencil, Trash2, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";

type ActionDraft = {
  title: string;
  owner: string;
  assigneeId?: number;
  dueDate: string;
  status: (typeof ACTION_STATUSES)[number];
  evidenceLink?: string;
};

const emptyDraft = (): ActionDraft => ({
  title: "",
  owner: "",
  assigneeId: undefined,
  dueDate: new Date().toISOString().slice(0, 10),
  status: "Not Started",
  evidenceLink: "",
});

const TreatmentPlan: React.FC = () => {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can, canEdit, canCreate, canManageUsers } = usePermissions();
  const { strings, isRTL } = useI18n();

  const today = new Date().toISOString().slice(0, 10);

  const getStatusLabel = (status: string) =>
    (strings.risks.statuses as Record<string, string> | undefined)?.[status] ??
    status;
  const getLevelLabel = (levelLabel: string) =>
    (strings.risks.levels as Record<string, string> | undefined)?.[
      levelLabel
    ] ?? levelLabel;

  const [isLoading, setIsLoading] = useState(true);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [treatmentsByRiskId, setTreatmentsByRiskId] = useState<
    Record<string, Treatment>
  >({});
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [approach, setApproach] =
    useState<(typeof TREATMENT_APPROACHES)[number]>("Mitigate");
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<TreatmentAction | null>(
    null
  );
  const [actionDraft, setActionDraft] = useState<ActionDraft>(emptyDraft());
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<User[]>([]);

  const [actionToDelete, setActionToDelete] = useState<TreatmentAction | null>(
    null
  );

  const overdueActionsCount = useMemo(() => {
    if (!treatment || !treatment.actions || treatment.actions.length === 0)
      return 0;
    return treatment.actions.filter(
      (a) => a.status !== "Done" && a.dueDate < today
    ).length;
  }, [treatment, today]);

  const treatmentProgress = useMemo(() => {
    if (treatment?._progress !== undefined && treatment._progress !== null) {
      return treatment._progress;
    }
    if (!treatment || !treatment.actions || treatment.actions.length === 0)
      return 0;
    const done = treatment.actions.filter((a) => a.status === "Done").length;
    return Math.round((done / treatment.actions.length) * 100);
  }, [treatment]);

  const getApproachLabel = (value: (typeof TREATMENT_APPROACHES)[number]) => {
    switch (value) {
      case "Mitigate":
        return strings.treatments.approachMitigate;
      case "Transfer":
        return strings.treatments.approachTransfer;
      case "Avoid":
        return strings.treatments.approachAvoid;
      case "Accept":
        return strings.treatments.approachAccept;
      default:
        return value;
    }
  };

  const getActionStatusLabel = (value: (typeof ACTION_STATUSES)[number]) => {
    switch (value) {
      case "Not Started":
        return strings.treatments.statusNotStarted;
      case "In Progress":
        return strings.treatments.statusInProgress;
      case "Done":
        return strings.treatments.statusDone;
      default:
        return value;
    }
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        if (!riskId) {
          const [allRisks, allTreatments] = await Promise.all([
            riskApi.getAll(),
            treatmentApi.getAll(),
          ]);
          const orderedRisks = [...allRisks].sort(
            (a, b) => (b.score ?? 0) - (a.score ?? 0)
          );
          setRisks(orderedRisks);

          const byRisk: Record<string, Treatment> = {};
          for (const t of allTreatments) {
            const prev = byRisk[t.riskId];
            if (!prev) {
              byRisk[t.riskId] = t;
              continue;
            }

            const prevDate = new Date(
              prev.updatedAt ?? prev.createdAt ?? 0
            ).getTime();
            const nextDate = new Date(
              t.updatedAt ?? t.createdAt ?? 0
            ).getTime();
            if (nextDate >= prevDate) byRisk[t.riskId] = t;
          }

          setTreatmentsByRiskId(byRisk);
          return;
        }

        const [foundRisk, foundTreatment] = await Promise.all([
          riskApi.getById(riskId),
          treatmentApi.getByRiskId(riskId),
        ]);

        if (!foundRisk) {
          toast({
            title: strings.treatments.riskNotFoundTitle,
            description: strings.treatments.riskNotFoundDesc,
            variant: "destructive",
          });
          navigate("/risks");
          return;
        }

        setRisk(foundRisk);
        // getByRiskId returns an array, take the first one or null
        const treatmentPlan = Array.isArray(foundTreatment)
          ? foundTreatment.length > 0
            ? foundTreatment[0]
            : null
          : foundTreatment;
        setTreatment(treatmentPlan);
        setApproach(treatmentPlan?.approach ?? "Mitigate");
      } catch {
        toast({
          title: strings.treatments.failedToLoad,
          description: strings.common.pleaseTryAgain,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskId]);

  useEffect(() => {
    const loadOwners = async () => {
      if (!canManageUsers) return;
      try {
        const users = await userApi.getUsers({ perPage: 100 });
        setAvailableOwners(users);
      } catch {
        setAvailableOwners([]);
      }
    };
    void loadOwners();
  }, [canManageUsers]);

  const refreshTreatment = async () => {
    if (!riskId) return;
    const latestList = await treatmentApi.getByRiskId(riskId);
    const latest = Array.isArray(latestList)
      ? latestList.length > 0
        ? latestList[0]
        : null
      : latestList;
    setTreatment(latest);
    setApproach(latest?.approach ?? approach);
  };

  const handleCreateOrUpdatePlan = async () => {
    if (!riskId) return;

    if (!treatment) {
      if (!can("canCreate")) {
        toast({
          title: strings.common.notAllowed,
          description: strings.treatments.noCreatePermission,
          variant: "destructive",
        });
        return;
      }
    } else if (!can("canEdit")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.treatments.noEditPlanPermission,
        variant: "destructive",
      });
      return;
    }

    setIsSavingPlan(true);
    try {
      if (!treatment) {
        const created = await treatmentApi.create({
          riskId,
          approach,
          actions: [],
        });
        setTreatment(created);
        toast({ title: strings.treatments.created });
      } else {
        const updated = await treatmentApi.update(treatment.id, { approach });
        setTreatment(updated);
        toast({ title: strings.treatments.updated });
      }
    } catch {
      toast({
        title: strings.treatments.saveFailedTitle,
        description: strings.treatments.saveFailedDesc,
        variant: "destructive",
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const openAddAction = () => {
    setEditingAction(null);
    setActionDraft(emptyDraft());
    setIsActionDialogOpen(true);
  };

  const openEditAction = (action: TreatmentAction) => {
    setEditingAction(action);
    setActionDraft({
      title: action.title,
      owner: action.owner,
      assigneeId: action._assigneeId,
      dueDate: action.dueDate,
      status: action.status,
      evidenceLink: action.evidenceLink || "",
    });
    setIsActionDialogOpen(true);
  };

  const handleSaveAction = async () => {
    if (!treatment) return;
    if (!can("canEdit")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.treatments.noEditActionsPermission,
        variant: "destructive",
      });
      return;
    }

    if (
      !actionDraft.title.trim() ||
      !actionDraft.owner.trim() ||
      !actionDraft.dueDate
    ) {
      toast({
        title: strings.treatments.missingFieldsTitle,
        description: strings.treatments.missingFieldsDesc,
        variant: "destructive",
      });
      return;
    }

    setIsSavingAction(true);
    try {
      if (!editingAction) {
        await treatmentApi.addAction(treatment.id, {
          title: actionDraft.title.trim(),
          owner: actionDraft.owner.trim(),
          assigneeId: actionDraft.assigneeId,
          dueDate: actionDraft.dueDate,
          status: actionDraft.status,
          evidenceLink: actionDraft.evidenceLink?.trim() || undefined,
        });
        toast({ title: strings.treatments.actionAdded });
      } else {
        await treatmentApi.updateAction(treatment.id, editingAction.id, {
          title: actionDraft.title.trim(),
          owner: actionDraft.owner.trim(),
          assigneeId: actionDraft.assigneeId,
          dueDate: actionDraft.dueDate,
          status: actionDraft.status,
          evidenceLink: actionDraft.evidenceLink?.trim() || undefined,
        });
        toast({ title: strings.treatments.actionUpdated });
      }

      setIsActionDialogOpen(false);
      setEditingAction(null);
      await refreshTreatment();
    } catch {
      toast({
        title: strings.treatments.saveFailedTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!treatment || !actionToDelete) return;
    if (!can("canEdit")) {
      toast({
        title: strings.common.notAllowed,
        description: strings.treatments.noEditActionsPermission,
        variant: "destructive",
      });
      return;
    }

    try {
      await treatmentApi.deleteAction(treatment.id, actionToDelete.id);
      toast({ title: strings.treatments.actionRemoved });
      setActionToDelete(null);
      await refreshTreatment();
    } catch {
      toast({
        title: strings.treatments.deleteFailedTitle,
        description: strings.treatments.deleteFailedDesc,
        variant: "destructive",
      });
    }
  };

  const handleQuickStatusChange = async (
    action: TreatmentAction,
    nextStatus: ActionDraft["status"]
  ) => {
    if (!treatment) return;
    if (!can("canEdit")) return;
    try {
      await treatmentApi.updateAction(treatment.id, action.id, {
        status: nextStatus,
      });
      await refreshTreatment();
    } catch {
      toast({
        title: strings.treatments.updateFailedTitle,
        description: strings.treatments.updateFailedDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {isLoading ? (
        <PageLoader />
      ) : !riskId ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {strings.treatments.plansTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {strings.treatments.plansSubtitle}
              </p>
            </div>
          </div>

          {risks.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  {strings.treatments.noRisksFound}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {risks.map((r) => {
                const plan = treatmentsByRiskId[r.id];
                const today = new Date().toISOString().slice(0, 10);
                const totalActions = plan?.actions?.length ?? 0;
                const doneActions = plan
                  ? plan.actions.filter((a) => a.status === "Done").length
                  : 0;
                const overdueActions = plan
                  ? plan.actions.filter(
                      (a) => a.status !== "Done" && a.dueDate < today
                    ).length
                  : 0;
                const progress =
                  plan?._progress !== undefined && plan._progress !== null
                    ? plan._progress
                    : totalActions === 0
                    ? 0
                    : Math.round((doneActions / totalActions) * 100);

                return (
                  <Card key={r.id} className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">{r.id}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.level}>
                          {getLevelLabel(r.level)}
                        </StatusBadge>
                        <StatusBadge status={r.status}>
                          {getStatusLabel(r.status)}
                        </StatusBadge>
                      </div>

                      {plan ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {strings.treatments.progress}
                            </span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress className="h-2" value={progress} />
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {strings.treatments.completed}: {doneActions}/
                              {totalActions}
                            </Badge>
                            {overdueActions > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {strings.followup.overdue}: {overdueActions}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {strings.treatments.approach}:{" "}
                              {getApproachLabel(plan.approach)}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {strings.risks.details.noTreatmentPlan}
                        </p>
                      )}

                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/treatments/${r.id}`}>
                          {strings.treatments.managePlan}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />{" "}
            {strings.actions.back}
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {strings.treatments.planTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {risk ? (
                  <>
                    {risk.id} — {risk.title}
                  </>
                ) : (
                  riskId
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={`/risks/${riskId}`}>
                  {strings.treatments.viewRisk}
                </Link>
              </Button>
              {(treatment ? can("canEdit") : can("canCreate")) && (
                <Button
                  onClick={handleCreateOrUpdatePlan}
                  disabled={isSavingPlan}
                >
                  {isSavingPlan ? (
                    <Loader2
                      className={
                        isRTL
                          ? "ml-2 h-4 w-4 animate-spin"
                          : "mr-2 h-4 w-4 animate-spin"
                      }
                    />
                  ) : (
                    <Save className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  )}
                  {treatment
                    ? strings.treatments.savePlan
                    : strings.treatments.createPlan}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">
                  {strings.treatments.planSettings}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{strings.treatments.approach}</Label>
                  <Select
                    value={approach}
                    onValueChange={(v) =>
                      setApproach(v as (typeof TREATMENT_APPROACHES)[number])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={strings.treatments.selectApproach}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {TREATMENT_APPROACHES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {getApproachLabel(a)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm font-medium mb-1">
                    {strings.treatments.progress}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {strings.treatments.completed}
                    </span>
                    <span className="font-medium">{treatmentProgress}%</span>
                  </div>
                  <Progress className="h-2" value={treatmentProgress} />
                </div>

                {!treatment && (
                  <p className="text-sm text-muted-foreground">
                    {strings.treatments.noPlanYet}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {strings.treatments.actionsTitle}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {overdueActionsCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {strings.followup.overdue}: {overdueActionsCount}
                    </Badge>
                  )}
                  {treatment && can("canEdit") && (
                    <Button size="sm" onClick={openAddAction}>
                      <Plus
                        className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                      />
                      {strings.treatments.addAction}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!treatment ? (
                  <p className="text-sm text-muted-foreground">
                    {strings.treatments.createPlanToStartActions}
                  </p>
                ) : !treatment.actions || treatment.actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {strings.treatments.noActionsYet}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {treatment.actions.map((action) => {
                      const isOverdue =
                        action.status !== "Done" && action.dueDate < today;
                      return (
                        <div
                          key={action.id}
                          className={
                            isOverdue
                              ? "p-4 rounded-lg border border-status-warning/30 bg-status-warning/5"
                              : "p-4 rounded-lg border border-border bg-muted/30"
                          }
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <p className="font-medium">{action.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {strings.treatments.ownerPrefix} {action.owner}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {strings.treatments.duePrefix} {action.dueDate}
                              </p>
                              {action.evidenceLink && (
                                <a
                                  href={action.evidenceLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {strings.treatments.evidence}
                                </a>
                              )}
                            </div>

                            <div className="flex flex-col items-start sm:items-end gap-2">
                              {can("canEdit") ? (
                                <Select
                                  value={action.status}
                                  onValueChange={(v) =>
                                    handleQuickStatusChange(
                                      action,
                                      v as ActionDraft["status"]
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ACTION_STATUSES.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {getActionStatusLabel(s)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <StatusBadge status={action.status}>
                                  {getActionStatusLabel(action.status)}
                                </StatusBadge>
                              )}

                              {can("canEdit") && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditAction(action)}
                                  >
                                    <Pencil
                                      className={
                                        isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"
                                      }
                                    />
                                    {strings.actions.edit}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setActionToDelete(action)}
                                  >
                                    <Trash2
                                      className={
                                        isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"
                                      }
                                    />
                                    {strings.actions.delete}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog
            open={isActionDialogOpen}
            onOpenChange={setIsActionDialogOpen}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingAction
                    ? strings.treatments.editAction
                    : strings.treatments.addActionDialog}
                </DialogTitle>
                <DialogDescription>
                  {strings.treatments.actionDialogDesc}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">{strings.treatments.fieldTitle}</Label>
                  <Input
                    id="title"
                    value={actionDraft.title}
                    onChange={(e) =>
                      setActionDraft((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder={strings.treatments.placeholderActionTitle}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">
                      {strings.treatments.fieldOwner}
                    </Label>
                    {canManageUsers ? (
                      <Select
                        value={
                          actionDraft.assigneeId
                            ? String(actionDraft.assigneeId)
                            : ""
                        }
                        onValueChange={(val) => {
                          const numericId = parseInt(val, 10);
                          const match = availableOwners.find(
                            (u) => (u._backendId ?? parseInt(u.id, 10)) === numericId
                          );
                          setActionDraft((prev) => ({
                            ...prev,
                            assigneeId: Number.isNaN(numericId)
                              ? undefined
                              : numericId,
                            owner: match?.name || prev.owner,
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={strings.treatments.placeholderOwner}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOwners.map((u) => (
                            <SelectItem
                              key={u.id}
                              value={String(u._backendId ?? u.id)}
                            >
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="owner"
                        value={actionDraft.owner}
                        onChange={(e) =>
                          setActionDraft((prev) => ({
                            ...prev,
                            owner: e.target.value,
                          }))
                        }
                        placeholder={strings.treatments.placeholderOwner}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">
                      {strings.treatments.fieldDueDate}
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={actionDraft.dueDate}
                      onChange={(e) =>
                        setActionDraft((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{strings.treatments.fieldStatus}</Label>
                    <Select
                      value={actionDraft.status}
                      onValueChange={(v) =>
                        setActionDraft((prev) => ({
                          ...prev,
                          status: v as ActionDraft["status"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getActionStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evidence">
                      {strings.treatments.fieldEvidence}
                    </Label>
                    <Input
                      id="evidence"
                      value={actionDraft.evidenceLink || ""}
                      onChange={(e) =>
                        setActionDraft((prev) => ({
                          ...prev,
                          evidenceLink: e.target.value,
                        }))
                      }
                      placeholder={strings.treatments.placeholderEvidence}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsActionDialogOpen(false)}
                  disabled={isSavingAction}
                >
                  {strings.actions.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAction}
                  disabled={isSavingAction}
                >
                  {isSavingAction ? (
                    <Loader2
                      className={
                        isRTL
                          ? "ml-2 h-4 w-4 animate-spin"
                          : "mr-2 h-4 w-4 animate-spin"
                      }
                    />
                  ) : (
                    <Save className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  )}
                  {strings.actions.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!actionToDelete}
            onOpenChange={(open) =>
              !open ? setActionToDelete(null) : undefined
            }
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {strings.treatments.deleteActionTitle}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {strings.treatments.deleteActionDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{strings.actions.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAction}>
                  {strings.actions.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default TreatmentPlan;
