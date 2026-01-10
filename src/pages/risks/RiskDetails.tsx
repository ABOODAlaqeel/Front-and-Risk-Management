import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { PageLoader } from "@/components/common/Loader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StageTimeline } from "@/components/common/StageTimeline";
import { Can } from "@/components/auth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  riskApi,
  assessmentApi,
  treatmentApi,
  userApi,
  incidentApi,
} from "@/api";
import type { Risk, Assessment, Treatment, AuditLog, Incident } from "@/types";
import { getRiskLevel } from "@/utils/constants";
import { useI18n } from "@/i18n";
import {
  ArrowLeft,
  Edit,
  ClipboardCheck,
  Shield,
  Calendar,
  User,
  FileText,
  History,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

const RiskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can, canEdit, canCreate, canDelete } = usePermissions();
  const { strings, isRTL } = useI18n();

  const getCategoryLabel = (category: string) =>
    (strings.risks.categories as Record<string, string> | undefined)?.[
      category
    ] ?? category;
  const getStatusLabel = (status: string) =>
    (strings.risks.statuses as Record<string, string> | undefined)?.[status] ??
    status;
  const getLevelLabel = (levelLabel: string) =>
    (strings.risks.levels as Record<string, string> | undefined)?.[
      levelLabel
    ] ?? levelLabel;

  const getTreatmentApproachLabel = (approach: string) => {
    const map: Record<string, string> = {
      Mitigate: strings.treatments.approachMitigate,
      Transfer: strings.treatments.approachTransfer,
      Avoid: strings.treatments.approachAvoid,
      Accept: strings.treatments.approachAccept,
    };
    return map[approach] ?? approach;
  };

  const getActionStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      "Not Started": strings.treatments.statusNotStarted,
      "In Progress": strings.treatments.statusInProgress,
      Done: strings.treatments.statusDone,
    };
    return map[status] ?? status;
  };

  const [risk, setRisk] = useState<Risk | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(
    null
  );
  const [isEditAssessmentOpen, setIsEditAssessmentOpen] = useState(false);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<Assessment | null>(null);

  const [editLikelihood, setEditLikelihood] = useState<number>(3);
  const [editImpact, setEditImpact] = useState<number>(3);
  const [editAssessor, setEditAssessor] = useState<string>("");
  const [editDate, setEditDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [editNotes, setEditNotes] = useState<string>("");

  const editScore = useMemo(
    () => editLikelihood * editImpact,
    [editLikelihood, editImpact]
  );
  const editLevel = useMemo(() => getRiskLevel(editScore).label, [editScore]);

  const reloadAssessments = async (riskId: string) => {
    const data = await assessmentApi.getByRiskId(riskId);
    setAssessments(data);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [
          riskData,
          assessmentData,
          treatmentData,
          auditData,
          incidentData,
        ] = await Promise.all([
          riskApi.getById(id),
          assessmentApi.getByRiskId(id),
          treatmentApi.getByRiskId(id),
          userApi.getAuditLogsByEntity("Risk", id),
          incidentApi.getByRiskId(id),
        ]);
        setRisk(riskData);
        setAssessments(assessmentData);
        setTreatment(treatmentData.length > 0 ? treatmentData[0] : null);
        setAuditLogs(auditData);
        setIncidents(incidentData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const openEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setEditLikelihood(assessment.likelihood);
    setEditImpact(assessment.impact);
    setEditAssessor(assessment.assessor);
    setEditDate(assessment.date);
    setEditNotes(assessment.notes ?? "");
    setIsEditAssessmentOpen(true);
  };

  const saveAssessmentEdits = async () => {
    if (!id || !editingAssessment) return;
    if (!can("canEdit")) return;
    if (!editAssessor.trim()) return;

    setIsSavingAssessment(true);
    try {
      await assessmentApi.update(editingAssessment.id, {
        likelihood: editLikelihood,
        impact: editImpact,
        notes: editNotes,
      });
      await reloadAssessments(id);
      setIsEditAssessmentOpen(false);
      setEditingAssessment(null);
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const confirmDeleteAssessment = async () => {
    if (!id || !assessmentToDelete) return;
    if (!can("canDelete")) return;
    try {
      await assessmentApi.delete(assessmentToDelete.id);
      await reloadAssessments(id);
      setAssessmentToDelete(null);
    } catch {
      // keep dialog open; user can retry
    }
  };

  if (loading)
    return <PageLoader text={strings.risks.details.loadingDetails} />;
  if (!risk) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">
          {strings.risks.details.notFoundTitle}
        </h2>
        <p className="text-muted-foreground mb-4">
          {strings.risks.details.notFoundDesc}
        </p>
        <Button onClick={() => navigate("/risks")}>
          {strings.risks.form.backToRiskRegister}
        </Button>
      </div>
    );
  }

  const treatmentProgress = (() => {
    if (!treatment) return 0;
    if (treatment._progress !== undefined && treatment._progress !== null) {
      return treatment._progress;
    }
    if (!treatment.actions || treatment.actions.length === 0) return 0;
    const done = treatment.actions.filter((a) => a.status === "Done").length;
    return Math.round((done / treatment.actions.length) * 100);
  })();

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => navigate("/risks")}
        >
          <ArrowLeft className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
          {strings.risks.form.backToRiskRegister}
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="font-mono">
                {risk.id}
              </Badge>
              <StatusBadge status={risk.level}>
                {getLevelLabel(risk.level)}
              </StatusBadge>
              <StatusBadge status={risk.status}>
                {getStatusLabel(risk.status)}
              </StatusBadge>
            </div>
            <h1 className="text-2xl font-bold">{risk.title}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {risk.description}
            </p>
          </div>

          <div className="flex gap-2">
            {can("canEdit") && (
              <Button variant="outline" asChild>
                <Link to={`/risks/${risk.id}/edit`}>
                  <Edit className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  {strings.risks.details.editRisk}
                </Link>
              </Button>
            )}
            {can("canCreate") && (
              <Button asChild>
                <Link to={`/assessments/new?riskId=${risk.id}`}>
                  <ClipboardCheck
                    className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                  />
                  {strings.risks.details.newAssessment}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.risks.form.scoreTitle}
                </p>
                <p className="text-xl font-bold">{risk.score}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <User className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.table.owner}
                </p>
                <p className="text-sm font-medium truncate">{risk.owner}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.table.category}
                </p>
                <p className="text-sm font-medium">
                  {getCategoryLabel(risk.category)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {strings.bcp.lastUpdated}
                </p>
                <p className="text-sm font-medium">
                  {new Date(risk.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Timeline */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {strings.risks.details.lifecycleTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StageTimeline stagesHistory={risk.stagesHistory} />
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Card className="glass-card lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">
                  {strings.risks.details.overview}
                </TabsTrigger>
                <TabsTrigger value="assessments">
                  {strings.risks.details.assessments}
                </TabsTrigger>
                <TabsTrigger value="treatment">
                  {strings.risks.details.treatment}
                </TabsTrigger>
                <TabsTrigger value="incidents">
                  {strings.risks.details.incidents}
                </TabsTrigger>
                <TabsTrigger value="audit">
                  {strings.risks.details.auditTrail}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Risk Matrix */}
                <div>
                  <h4 className="text-sm font-medium mb-3">
                    {strings.risks.details.riskAssessment}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{risk.likelihood}</p>
                      <p className="text-xs text-muted-foreground">
                        {strings.risks.details.likelihoodScale}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{risk.impact}</p>
                      <p className="text-xs text-muted-foreground">
                        {strings.risks.details.impactScale}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {risk.score}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {strings.risks.details.scoreScale}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Treatment Summary */}
                {treatment && can("canViewTreatments") && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      {strings.risks.details.treatmentProgress}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {strings.risks.details.approachLabel}{" "}
                          <span className="text-foreground">
                            {getTreatmentApproachLabel(treatment.approach)}
                          </span>
                        </span>
                        <span className="font-medium">
                          {treatmentProgress}%{" "}
                          {strings.risks.details.completeSuffix}
                        </span>
                      </div>
                      <Progress value={treatmentProgress} />
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/treatments/${risk.id}`}>
                          <Shield
                            className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                          />
                          {strings.risks.details.viewTreatmentPlan}
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assessments" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {strings.risks.details.assessmentHistory}
                    </h4>
                    {can("canCreate") && (
                      <Button size="sm" asChild>
                        <Link to={`/assessments/new?riskId=${risk.id}`}>
                          {strings.risks.details.addAssessment}
                        </Link>
                      </Button>
                    )}
                  </div>
                  {assessments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      {strings.risks.details.noAssessments}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {assessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="p-4 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{assessment.date}</p>
                              <p className="text-sm text-muted-foreground">
                                {strings.risks.details.byPrefix}{" "}
                                {assessment.assessor}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={assessment.level}>
                                {getLevelLabel(assessment.level)}
                              </StatusBadge>
                              {can("canEdit") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditAssessment(assessment)}
                                  aria-label={
                                    strings.risks.details.editAssessmentTitle
                                  }
                                  title={
                                    strings.risks.details.editAssessmentTitle
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {can("canDelete") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setAssessmentToDelete(assessment)
                                  }
                                  aria-label={
                                    strings.risks.details.deleteAssessmentTitle
                                  }
                                  title={
                                    strings.risks.details.deleteAssessmentTitle
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                {strings.risks.details.likelihoodLabel}
                              </span>{" "}
                              <span className="font-medium">
                                {assessment.likelihood}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                {strings.risks.details.impactLabel}
                              </span>{" "}
                              <span className="font-medium">
                                {assessment.impact}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                {strings.risks.details.scoreLabel}
                              </span>{" "}
                              <span className="font-bold">
                                {assessment.score}
                              </span>
                            </div>
                          </div>
                          {assessment.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {assessment.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <Dialog
                open={isEditAssessmentOpen}
                onOpenChange={setIsEditAssessmentOpen}
              >
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {strings.risks.details.editAssessmentTitle}
                    </DialogTitle>
                    <DialogDescription>
                      {strings.risks.details.editAssessmentDesc}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editAssessor">
                          {strings.risks.details.assessor}
                        </Label>
                        <Input
                          id="editAssessor"
                          value={editAssessor}
                          onChange={(e) => setEditAssessor(e.target.value)}
                          disabled={!can("canEdit")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDate">
                          {strings.risks.details.date}
                        </Label>
                        <Input
                          id="editDate"
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          disabled={!can("canEdit")}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{strings.risks.form.likelihood}</Label>
                          <span className="text-sm font-medium">
                            {editLikelihood}
                          </span>
                        </div>
                        <Slider
                          value={[editLikelihood]}
                          onValueChange={([v]) => setEditLikelihood(v)}
                          min={1}
                          max={5}
                          step={1}
                          disabled={!can("canEdit")}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{strings.risks.form.impact}</Label>
                          <span className="text-sm font-medium">
                            {editImpact}
                          </span>
                        </div>
                        <Slider
                          value={[editImpact]}
                          onValueChange={([v]) => setEditImpact(v)}
                          min={1}
                          max={5}
                          step={1}
                          disabled={!can("canEdit")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{editLikelihood}</p>
                        <p className="text-xs text-muted-foreground">
                          {strings.risks.form.likelihood}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{editImpact}</p>
                        <p className="text-xs text-muted-foreground">
                          {strings.risks.form.impact}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/10 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {editScore}
                        </p>
                        <div className="mt-1 flex justify-center">
                          <StatusBadge status={editLevel}>
                            {getLevelLabel(editLevel)}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editNotes">
                        {strings.risks.details.notes}
                      </Label>
                      <Textarea
                        id="editNotes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        disabled={!can("canEdit")}
                        rows={4}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditAssessmentOpen(false)}
                      disabled={isSavingAssessment}
                    >
                      {strings.actions.cancel}
                    </Button>
                    <Button
                      onClick={saveAssessmentEdits}
                      disabled={
                        !can("canEdit") ||
                        isSavingAssessment ||
                        !editAssessor.trim()
                      }
                    >
                      {isSavingAssessment ? (
                        <Loader2
                          className={
                            isRTL
                              ? "ml-2 h-4 w-4 animate-spin"
                              : "mr-2 h-4 w-4 animate-spin"
                          }
                        />
                      ) : (
                        <Save
                          className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                        />
                      )}
                      {strings.actions.save}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog
                open={!!assessmentToDelete}
                onOpenChange={(open) =>
                  !open ? setAssessmentToDelete(null) : undefined
                }
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {strings.risks.details.deleteAssessmentTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {strings.risks.details.deleteAssessmentDesc}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {strings.actions.cancel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmDeleteAssessment}
                      disabled={!can("canDelete")}
                    >
                      {strings.actions.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <TabsContent value="treatment" className="mt-0">
                {!can("canViewTreatments") ? (
                  <p className="text-sm text-muted-foreground py-4">
                    {strings.common.notAllowed}
                  </p>
                ) : treatment ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">
                          {strings.treatments.planTitle}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {strings.risks.details.approachLabel}{" "}
                          {getTreatmentApproachLabel(treatment.approach)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/treatments/${risk.id}`}>
                          {can("canEdit") || can("canCreate") ? (
                            <>
                              <Edit
                                className={
                                  isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"
                                }
                              />
                              {strings.risks.details.managePlan}
                            </>
                          ) : (
                            <>
                              <Shield
                                className={
                                  isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"
                                }
                              />
                              {strings.risks.details.viewTreatmentPlan}
                            </>
                          )}
                        </Link>
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {treatment.actions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {action.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {strings.treatments.ownerPrefix} {action.owner} •{" "}
                              {strings.treatments.duePrefix} {action.dueDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={
                                action.status === "Done"
                                  ? "green"
                                  : action.status === "In Progress"
                                  ? "yellow"
                                  : "red"
                              }
                            >
                              {getActionStatusLabel(action.status)}
                            </StatusBadge>
                            {action.evidenceLink && (
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={action.evidenceLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={
                                    strings.risks.details.openEvidence
                                  }
                                  title={strings.risks.details.openEvidence}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {strings.risks.details.noTreatmentPlan}
                    </p>
                    {can("canCreate") && (
                      <Button asChild>
                        <Link to={`/treatments/${risk.id}`}>
                          {strings.risks.details.createTreatmentPlan}
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="incidents" className="mt-0">
                {incidents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    {strings.risks.details.noRelatedIncidents}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {incident.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {incident.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={incident.severity}>
                            {strings.risks.levels?.[
                              incident.severity as keyof typeof strings.risks.levels
                            ] ?? incident.severity}
                          </StatusBadge>
                          <StatusBadge
                            status={
                              incident.status === "Resolved"
                                ? "green"
                                : "yellow"
                            }
                          >
                            {incident.status}
                          </StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="audit" className="mt-0">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    {strings.risks.details.noAuditEntries}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {log.actor}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default RiskDetails;
