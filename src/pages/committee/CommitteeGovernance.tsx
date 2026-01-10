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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/common/Loader";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";
import { riskApi, committeeApi } from "@/api";
import type { Risk, CommitteeMeeting, CommitteeEscalation } from "@/types";
import { useAuth } from "@/auth/authContext";
import { Plus, Trash2, Calendar, Users, AlertTriangle, FileText } from "lucide-react";

/* =======================
   Types
======================= */
type MeetingForm = {
  date: string;
  topic: string;
  notes: string;
  decision: string;
};

type EscalationForm = {
  risk_id: string;
  meeting_id: string;
  status: string;
  action: string;
  decision: string;
};

/* =======================
   Component
======================= */
const CommitteeGovernance: React.FC = () => {
  const { strings, language } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();

  // Backend allows: super_admin/admin/risk_manager; in frontend those map to:
  // Admin + Data Entry.
  const canManage = user?.role === "Admin" || user?.role === "Data Entry";

  // Data state
  const [loading, setLoading] = React.useState(true);
  const [criticalRisks, setCriticalRisks] = React.useState<Risk[]>([]);
  const [meetings, setMeetings] = React.useState<CommitteeMeeting[]>([]);
  const [escalations, setEscalations] = React.useState<CommitteeEscalation[]>(
    []
  );

  // Meeting Dialog state
  const [meetingDialogOpen, setMeetingDialogOpen] = React.useState(false);
  const [meetingForm, setMeetingForm] = React.useState<MeetingForm>({
    date: "",
    topic: "",
    notes: "",
    decision: "",
  });
  const [meetingSubmitting, setMeetingSubmitting] = React.useState(false);

  // Escalation Dialog state
  const [escalationDialogOpen, setEscalationDialogOpen] = React.useState(false);
  const [escalationForm, setEscalationForm] = React.useState<EscalationForm>({
    risk_id: "",
    meeting_id: "",
    status: "pending",
    action: "",
    decision: "",
  });
  const [escalationSubmitting, setEscalationSubmitting] = React.useState(false);

  // All risks for escalation select
  const [allRisks, setAllRisks] = React.useState<Risk[]>([]);

  /* =======================
     Load Data
  ======================= */
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [risksData, meetingsData, escalationsData] = await Promise.all([
        riskApi.getAll(),
        committeeApi.getMeetings(),
        committeeApi.getEscalations(),
      ]);
      console.log("Loaded risks:", risksData);
      setAllRisks(risksData || []);
      setCriticalRisks(
        (risksData || []).filter(
          (r) => r.level === "Critical" || r.level === "High"
        )
      );
      setMeetings(meetingsData || []);
      setEscalations(escalationsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: strings.committee.loadErrorTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [strings, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================
     Meeting Handlers
  ======================= */
  const resetMeetingForm = () => {
    setMeetingForm({ date: "", topic: "", notes: "", decision: "" });
  };

  const openMeetingDialog = () => {
    resetMeetingForm();
    setMeetingDialogOpen(true);
  };

  const handleMeetingSubmit = async () => {
    if (!meetingForm.date || !meetingForm.topic.trim()) {
      toast({
        title: strings.committee.missingFieldsTitle,
        description: strings.committee.missingMeetingFieldsDesc,
        variant: "destructive",
      });
      return;
    }

    setMeetingSubmitting(true);
    try {
      await committeeApi.createMeeting({
        date: new Date(meetingForm.date).toISOString(),
        topic: meetingForm.topic.trim(),
        notes: meetingForm.notes.trim(),
        decision: meetingForm.decision.trim(),
      });
      toast({
        title: strings.committee.meetingCreatedTitle,
        description: strings.committee.meetingCreatedDesc,
      });
      setMeetingDialogOpen(false);
      resetMeetingForm();
      await loadData();
    } catch (error) {
      const err = error as Error;
      toast({
        title: strings.committee.saveFailedTitle,
        description: err.message || strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    if (!window.confirm(strings.committee.deleteMeetingConfirm)) return;
    try {
      await committeeApi.deleteMeeting(id);
      toast({
        title: strings.committee.deletedTitle,
        description: strings.committee.deletedMeetingDesc,
      });
      await loadData();
    } catch (error) {
      toast({
        title: strings.committee.deleteFailedTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    }
  };

  /* =======================
     Escalation Handlers
  ======================= */
  const resetEscalationForm = () => {
    setEscalationForm({
      risk_id: "",
      meeting_id: "",
      status: "pending",
      action: "",
      decision: "",
    });
  };

  const openEscalationDialog = () => {
    resetEscalationForm();
    setEscalationDialogOpen(true);
  };

  const handleEscalationSubmit = async () => {
    if (!escalationForm.risk_id) {
      toast({
        title: strings.committee.missingFieldsTitle,
        description: strings.committee.missingEscalationDesc,
        variant: "destructive",
      });
      return;
    }

    setEscalationSubmitting(true);
    try {
      // Extract numeric ID from risk_id (e.g., "RISK-001" -> 1)
      const riskIdString = escalationForm.risk_id;
      let riskIdNum: number;

      if (riskIdString.startsWith("RISK-")) {
        riskIdNum = parseInt(riskIdString.replace("RISK-", ""), 10);
      } else {
        riskIdNum = parseInt(riskIdString, 10);
      }

      const escalationData = {
        risk_id: riskIdNum,
        meeting_id:
          escalationForm.meeting_id && escalationForm.meeting_id !== "none"
            ? Number(escalationForm.meeting_id)
            : undefined,
        status: escalationForm.status,
        action: escalationForm.action.trim(),
        decision: escalationForm.decision.trim(),
      };
      console.log("Creating escalation with data:", escalationData);

      const result = await committeeApi.createEscalation(escalationData);
      console.log("Escalation created:", result);

      toast({
        title: strings.committee.escalationCreatedTitle,
        description: strings.committee.escalationCreatedDesc,
      });
      setEscalationDialogOpen(false);
      resetEscalationForm();
      await loadData();
    } catch (error) {
      console.error("Error creating escalation:", error);
      const err = error as Error;
      toast({
        title: strings.committee.saveFailedTitle,
        description: err.message || strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setEscalationSubmitting(false);
    }
  };

  const handleDeleteEscalation = async (id: number) => {
    if (!window.confirm(strings.committee.deleteEscalationConfirm)) return;
    try {
      await committeeApi.deleteEscalation(id);
      toast({
        title: strings.committee.deletedTitle,
        description: strings.committee.deletedEscalationDesc,
      });
      await loadData();
    } catch (error) {
      toast({
        title: strings.committee.deleteFailedTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    }
  };

  /* =======================
     Helpers
  ======================= */
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString(
        language === "ar" ? "ar-SA" : "en-US"
      );
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      pending: { label: strings.committee.statusPending, variant: "secondary" },
      approved: { label: strings.committee.statusApproved, variant: "default" },
      rejected: { label: strings.committee.statusRejected, variant: "destructive" },
      resolved: { label: strings.committee.statusResolved, variant: "outline" },
    };
    const s = statusMap[status] || {
      label: status,
      variant: "secondary" as const,
    };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  /* =======================
     UI
  ======================= */
  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {strings.committee.title}
        </h1>
        <p className="text-muted-foreground">{strings.committee.subtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.committee.statsCriticalLabel}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalRisks.length}</div>
            <p className="text-xs text-muted-foreground">
              {strings.committee.statsCriticalDesc}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.committee.statsMeetingsLabel}
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-muted-foreground">
              {strings.committee.statsMeetingsDesc}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {strings.committee.statsEscalationsLabel}
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalations.length}</div>
            <p className="text-xs text-muted-foreground">
              {strings.committee.statsEscalationsDesc}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meetings Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {strings.committee.meetingsTitle}
            </CardTitle>
            <CardDescription>{strings.committee.meetingsDesc}</CardDescription>
          </div>
          {canManage && (
            <Button onClick={openMeetingDialog} size="sm">
              <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {strings.committee.addMeeting}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{strings.committee.noMeetings}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{strings.committee.meetingTableDate}</TableHead>
                    <TableHead>{strings.committee.meetingTableTopic}</TableHead>
                    <TableHead>{strings.committee.meetingTableNotes}</TableHead>
                    <TableHead>{strings.committee.meetingTableDecision}</TableHead>
                    {canManage && (
                      <TableHead className="w-[80px]">
                        {strings.committee.meetingTableActions}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell className="font-medium">
                        {formatDate(meeting.date)}
                      </TableCell>
                      <TableCell>{meeting.topic}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {meeting.notes || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {meeting.decision || "-"}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalations Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {strings.committee.escalationsTitle}
            </CardTitle>
            <CardDescription>{strings.committee.escalationsDesc}</CardDescription>
          </div>
          {canManage && criticalRisks.length > 0 && (
            <Button onClick={openEscalationDialog} size="sm" variant="outline">
              <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {strings.committee.addEscalation}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {escalations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{strings.committee.noEscalations}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{strings.committee.escalationTableRisk}</TableHead>
                    <TableHead>{strings.committee.escalationTableStatus}</TableHead>
                    <TableHead>{strings.committee.escalationTableAction}</TableHead>
                    <TableHead>{strings.committee.escalationTableDecision}</TableHead>
                    <TableHead>{strings.committee.escalationTableCreated}</TableHead>
                    {canManage && (
                      <TableHead className="w-[80px]">
                        {strings.committee.escalationTableActions}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalations.map((escalation) => (
                    <TableRow key={escalation.id}>
                      <TableCell className="font-medium">
                        RISK-{escalation.risk_id}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(escalation.status || "pending")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {escalation.action || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {escalation.decision || "-"}
                      </TableCell>
                      <TableCell>{formatDate(escalation.created_at)}</TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEscalation(escalation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Risks Section */}
      {criticalRisks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {strings.committee.criticalRisksTitle}
            </CardTitle>
            <CardDescription>{strings.committee.criticalRisksDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{strings.committee.criticalTableId}</TableHead>
                    <TableHead>{strings.committee.criticalTableTitle}</TableHead>
                    <TableHead>{strings.committee.criticalTableLevel}</TableHead>
                    <TableHead>{strings.committee.criticalTableOwner}</TableHead>
                    <TableHead>{strings.committee.criticalTableStatus}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalRisks.slice(0, 5).map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell className="font-medium">{risk.id}</TableCell>
                      <TableCell>{risk.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            risk.level === "Critical"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {risk.level === "Critical"
                            ? strings.committee.riskLevelCritical
                            : strings.committee.riskLevelHigh}
                        </Badge>
                      </TableCell>
                      <TableCell>{risk.owner}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{risk.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{strings.committee.meetingDialogTitle}</DialogTitle>
            <DialogDescription>{strings.committee.meetingDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-date">
                {strings.committee.meetingDateLabel} *
              </Label>
              <Input
                id="meeting-date"
                type="date"
                value={meetingForm.date}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, date: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-topic">
                {strings.committee.meetingTopicLabel} *
              </Label>
              <Input
                id="meeting-topic"
                value={meetingForm.topic}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, topic: e.target.value })
                }
                placeholder={strings.committee.meetingTopicPlaceholder}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-notes">
                {strings.committee.meetingNotesLabel}
              </Label>
              <Textarea
                id="meeting-notes"
                value={meetingForm.notes}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, notes: e.target.value })
                }
                placeholder={strings.committee.meetingNotesPlaceholder}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-decision">
                {strings.committee.meetingDecisionLabel}
              </Label>
              <Textarea
                id="meeting-decision"
                value={meetingForm.decision}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, decision: e.target.value })
                }
                placeholder={strings.committee.meetingDecisionPlaceholder}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>
              {strings.actions.cancel}
            </Button>
            <Button onClick={handleMeetingSubmit} disabled={meetingSubmitting}>
              {meetingSubmitting ? strings.committee.saving : strings.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalation Dialog */}
      <Dialog open={escalationDialogOpen} onOpenChange={setEscalationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{strings.committee.escalationDialogTitle}</DialogTitle>
            <DialogDescription>
              {strings.committee.escalationDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="escalation-risk">
                {strings.committee.escalationRiskLabel} *
              </Label>
              <Select
                value={escalationForm.risk_id}
                onValueChange={(value) =>
                  setEscalationForm({ ...escalationForm, risk_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={strings.committee.escalationRiskPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {allRisks.map((risk) => (
                    <SelectItem key={risk.id} value={String(risk.id)}>
                      {risk.id} - {risk.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="escalation-meeting">
                {strings.committee.escalationMeetingLabel}
              </Label>
              <Select
                value={escalationForm.meeting_id}
                onValueChange={(value) =>
                  setEscalationForm({ ...escalationForm, meeting_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={strings.committee.escalationMeetingPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {strings.committee.escalationMeetingNone}
                  </SelectItem>
                  {meetings.map((meeting) => (
                    <SelectItem key={meeting.id} value={String(meeting.id)}>
                      {formatDate(meeting.date)} - {meeting.topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="escalation-status">
                {strings.committee.escalationStatusLabel}
              </Label>
              <Select
                value={escalationForm.status}
                onValueChange={(value) =>
                  setEscalationForm({ ...escalationForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    {strings.committee.statusPending}
                  </SelectItem>
                  <SelectItem value="approved">
                    {strings.committee.statusApproved}
                  </SelectItem>
                  <SelectItem value="rejected">
                    {strings.committee.statusRejected}
                  </SelectItem>
                  <SelectItem value="resolved">
                    {strings.committee.statusResolved}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="escalation-action">
                {strings.committee.escalationActionLabel}
              </Label>
              <Textarea
                id="escalation-action"
                value={escalationForm.action}
                onChange={(e) =>
                  setEscalationForm({
                    ...escalationForm,
                    action: e.target.value,
                  })
                }
                placeholder={strings.committee.escalationActionPlaceholder}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="escalation-decision">
                {strings.committee.escalationDecisionLabel}
              </Label>
              <Textarea
                id="escalation-decision"
                value={escalationForm.decision}
                onChange={(e) =>
                  setEscalationForm({
                    ...escalationForm,
                    decision: e.target.value,
                  })
                }
                placeholder={strings.committee.escalationDecisionPlaceholder}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalationDialogOpen(false)}>
              {strings.actions.cancel}
            </Button>
            <Button onClick={handleEscalationSubmit} disabled={escalationSubmitting}>
              {escalationSubmitting ? strings.committee.saving : strings.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommitteeGovernance;
