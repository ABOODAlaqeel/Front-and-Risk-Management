/**
 * BCP Plan Page - Business continuity plan management.
 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageLoader } from "@/components/common/Loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/authContext";
import { bcpApi } from "@/api";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  FileText,
  Users,
  Phone,
  AlertTriangle,
  Target,
  Calendar,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle2,
  Server,
  Pencil,
  Eye,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import type { BCPService, BCPTest } from "@/types";

// ===========================================
// Types
// ===========================================

interface BCPPlanData {
  id?: number;
  title: string;
  version: string;
  description: string;
  status: string;
  effective_date: string | null;
  review_date: string | null;
  last_reviewed_at: string | null;
  owner_id: number | null;
  owner_name?: string;
  sections: string[];
  objectives: string;
  scope: string;
  assumptions: string;
  emergency_contacts: EmergencyContact[];
  communication_plan: string;
  activation_triggers: string[];
  updated_at?: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  priority: number;
}

interface Section {
  id: string;
  title: string;
  content: string;
}

// API data from backend.
interface APIBCPPlanData {
  lastUpdated?: string;
  status?: string;
  sections?: string[];
  title?: string;
  version?: string;
  description?: string;
  effective_date?: string | null;
  review_date?: string | null;
  last_reviewed_at?: string | null;
  owner_id?: number | null;
  owner_name?: string;
  objectives?: string;
  scope?: string;
  assumptions?: string;
  emergency_contacts?: EmergencyContact[];
  communication_plan?: string;
  activation_triggers?: string[];
}

// ===========================================
// Helper Functions
// ===========================================

const statusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-status-success/15 text-status-success border-status-success/30";
    case "draft":
      return "bg-muted/40 text-muted-foreground border-muted";
    case "under_review":
    case "under review":
      return "bg-status-warning/15 text-status-warning border-status-warning/30";
    case "approved":
      return "bg-primary/15 text-primary border-primary/30";
    case "archived":
      return "bg-muted/30 text-muted-foreground border-muted";
    default:
      return "bg-muted/40 text-muted-foreground border-muted";
  }
};

const statusLabel = (status: string, strings: Record<string, string>) => {
  switch (status?.toLowerCase()) {
    case "active":
      return strings.statusActive;
    case "draft":
      return strings.statusDraft;
    case "under_review":
    case "under review":
      return strings.statusInReview;
    case "approved":
      return strings.statusApproved;
    case "archived":
      return strings.statusArchived;
    default:
      return status;
  }
};

const testStatusLabel = (status: string, strings: Record<string, string>) => {
  switch (status?.toLowerCase()) {
    case "planned":
      return strings.statusPlanned;
    case "passed":
      return strings.statusPassed;
    case "failed":
      return strings.statusFailed;
    case "completed":
      return strings.statusCompleted;
    default:
      return status;
  }
};

const testTypeLabel = (type: string, strings: Record<string, string>) => {
  switch (type?.toLowerCase()) {
    case "bcp":
      return strings.typeBCP;
    case "dr":
      return strings.typeDR;
    default:
      return type;
  }
};

const formatDate = (dateStr: string | null, locale: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString(locale);
  } catch {
    return dateStr;
  }
};

// ===========================================
// Main Component
// ===========================================

const BCPPlan: React.FC = () => {
  const { toast } = useToast();
  const { can } = useAuth();
  const { strings, isRTL, language } = useI18n();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<BCPPlanData | null>(null);
  const [services, setServices] = useState<BCPService[]>([]);
  const [tests, setTests] = useState<BCPTest[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [sectionDialog, setSectionDialog] = useState(false);
  const [contactDialog, setContactDialog] = useState(false);
  const [triggerDialog, setTriggerDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<{
    index: number;
    value: string;
  } | null>(null);
  const [editingContact, setEditingContact] = useState<{
    index: number;
    contact: EmergencyContact;
  } | null>(null);
  const [newSection, setNewSection] = useState("");
  const [newContact, setNewContact] = useState<EmergencyContact>({
    id: "",
    name: "",
    role: "",
    phone: "",
    email: "",
    priority: 1,
  });
  const [newTrigger, setNewTrigger] = useState("");

  const canEdit = can("canEdit");

  // ===========================================
  // Data Loading
  // ===========================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [planData, servicesData, testsData] = await Promise.all([
          bcpApi.getBCPlan(),
          bcpApi.getServices(),
          bcpApi.getTests(),
        ]);

        // Transform plan data
        const apiData = planData as APIBCPPlanData;
        setPlan({
          title: apiData.title || strings.bcpPlanPage.title,
          version: apiData.version || "1.0",
          description: apiData.description || "",
          status: apiData.status || "Draft",
          effective_date: apiData.effective_date || null,
          review_date: apiData.review_date || null,
          last_reviewed_at: apiData.last_reviewed_at || null,
          owner_id: apiData.owner_id || null,
          owner_name: apiData.owner_name || "",
          sections: apiData.sections || [],
          objectives: apiData.objectives || "",
          scope: apiData.scope || "",
          assumptions: apiData.assumptions || "",
          emergency_contacts: apiData.emergency_contacts || [],
          communication_plan: apiData.communication_plan || "",
          activation_triggers: apiData.activation_triggers || [],
          updated_at: apiData.lastUpdated || "",
        });

        setServices(servicesData);
        setTests(testsData);
      } catch (error) {
        toast({
          title: strings.bcpPlanPage.toastLoadFailedTitle,
          description: strings.bcpPlanPage.toastLoadFailedDesc,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ===========================================
  // Save Handler
  // ===========================================

  const handleSave = async () => {
    if (!plan || !canEdit) return;

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        ...plan,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      await bcpApi.updateBCPlan(updateData);

      toast({ title: strings.bcpPlanPage.toastSaved });
    } catch (error) {
      toast({
        title: strings.bcpPlanPage.toastSaveFailed,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ===========================================
  // Section Handlers
  // ===========================================

  const addSection = () => {
    if (!newSection.trim()) return;
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            sections: [...prev.sections, newSection.trim()],
          }
        : prev
    );
    setNewSection("");
    setSectionDialog(false);
  };

  const updateSection = (index: number, value: string) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = [...prev.sections];
      next[index] = value;
      return { ...prev, sections: next };
    });
  };

  const removeSection = (index: number) => {
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index),
          }
        : prev
    );
  };

  // ===========================================
  // Contact Handlers
  // ===========================================

  const addContact = () => {
    if (!newContact.name.trim()) return;
    const contact = { ...newContact, id: `EC-${Date.now()}` };
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            emergency_contacts: [...prev.emergency_contacts, contact],
          }
        : prev
    );
    setNewContact({
      id: "",
      name: "",
      role: "",
      phone: "",
      email: "",
      priority: 1,
    });
    setContactDialog(false);
  };

  const removeContact = (index: number) => {
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            emergency_contacts: prev.emergency_contacts.filter(
              (_, i) => i !== index
            ),
          }
        : prev
    );
  };

  // ===========================================
  // Trigger Handlers
  // ===========================================

  const addTrigger = () => {
    if (!newTrigger.trim()) return;
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            activation_triggers: [
              ...prev.activation_triggers,
              newTrigger.trim(),
            ],
          }
        : prev
    );
    setNewTrigger("");
    setTriggerDialog(false);
  };

  const removeTrigger = (index: number) => {
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            activation_triggers: prev.activation_triggers.filter(
              (_, i) => i !== index
            ),
          }
        : prev
    );
  };

  // ===========================================
  // Render
  // ===========================================

  if (loading) return <PageLoader />;

  if (!plan) {
    return (
      <div className="space-y-6 animate-in">
        <h1 className="text-2xl font-bold">{strings.bcpPlanPage.title}</h1>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {strings.bcpPlanPage.noPlanData}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Statistics
  const criticalServices = services.filter(
    (s) => s.criticality?.toLowerCase() === "critical"
  ).length;
  const upcomingTests = tests.filter((t) => t.status === "Planned").length;
  const passedTests = tests.filter((t) => t.status === "Passed").length;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <p className="text-muted-foreground">
            {strings.bcpPlanPage.subtitle}
          </p>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Badge
              variant="secondary"
              className={cn("gap-2 border", statusBadgeClass(plan.status))}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  plan.status?.toLowerCase() === "active"
                    ? "bg-status-success"
                    : "bg-muted-foreground"
                )}
              />
              {statusLabel(plan.status, strings.bcp || {})}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              {strings.bcpPlanPage.versionLabel} {plan.version}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {strings.bcpPlanPage.lastUpdated}:{" "}
              {formatDate(plan.updated_at || null, locale)}
            </span>
          </div>
        </div>

        {canEdit && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full px-5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Save className="h-4 w-4 me-2" />
            )}
            {strings.bcpPlanPage.saveChanges}
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div
              className={cn(
                "flex items-center gap-3",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div className={cn(isRTL ? "text-right" : "text-left")}>
                <p className="text-2xl font-bold">{services.length}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpPlanPage.statsServices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div
              className={cn(
                "flex items-center gap-3",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div className="p-2 rounded-lg bg-status-danger/10">
                <AlertTriangle className="h-5 w-5 text-status-danger" />
              </div>
              <div className={cn(isRTL ? "text-right" : "text-left")}>
                <p className="text-2xl font-bold">{criticalServices}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpPlanPage.statsCriticalServices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div
              className={cn(
                "flex items-center gap-3",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div className="p-2 rounded-lg bg-status-warning/10">
                <Calendar className="h-5 w-5 text-status-warning" />
              </div>
              <div className={cn(isRTL ? "text-right" : "text-left")}>
                <p className="text-2xl font-bold">{upcomingTests}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpPlanPage.statsPlannedTests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div
              className={cn(
                "flex items-center gap-3",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div className="p-2 rounded-lg bg-status-success/10">
                <CheckCircle2 className="h-5 w-5 text-status-success" />
              </div>
              <div className={cn(isRTL ? "text-right" : "text-left")}>
                <p className="text-2xl font-bold">{passedTests}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.bcpPlanPage.statsPassedTests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">
            {strings.bcpPlanPage.tabOverview}
          </TabsTrigger>
          <TabsTrigger value="sections">
            {strings.bcpPlanPage.tabSections}
          </TabsTrigger>
          <TabsTrigger value="emergency">
            {strings.bcpPlanPage.tabEmergency}
          </TabsTrigger>
          <TabsTrigger value="services">
            {strings.bcpPlanPage.tabServices}
          </TabsTrigger>
          <TabsTrigger value="tests">
            {strings.bcpPlanPage.tabTests}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {strings.bcpPlanPage.basicInfoTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{strings.bcpPlanPage.labelTitle}</Label>
                    <Input
                      value={plan.title}
                      onChange={(e) =>
                        setPlan({ ...plan, title: e.target.value })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{strings.bcpPlanPage.labelVersion}</Label>
                    <Input
                      value={plan.version}
                      onChange={(e) =>
                        setPlan({ ...plan, version: e.target.value })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{strings.bcpPlanPage.labelStatus}</Label>
                  <Select
                    value={plan.status.toLowerCase().replace(" ", "_")}
                    onValueChange={(v) => setPlan({ ...plan, status: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        {strings.bcp.statusDraft}
                      </SelectItem>
                      <SelectItem value="under_review">
                        {strings.bcp.statusInReview}
                      </SelectItem>
                      <SelectItem value="approved">
                        {strings.bcp.statusApproved}
                      </SelectItem>
                      <SelectItem value="active">
                        {strings.bcp.statusActive}
                      </SelectItem>
                      <SelectItem value="archived">
                        {strings.bcp.statusArchived}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{strings.bcpPlanPage.labelDescription}</Label>
                  <Textarea
                    value={plan.description}
                    onChange={(e) =>
                      setPlan({ ...plan, description: e.target.value })
                    }
                    disabled={!canEdit}
                    rows={3}
                    placeholder={strings.bcpPlanPage.descriptionPlaceholder}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates & Ownership */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {strings.bcpPlanPage.datesOwnershipTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{strings.bcpPlanPage.effectiveDateLabel}</Label>
                    <Input
                      type="date"
                      value={plan.effective_date?.slice(0, 10) || ""}
                      onChange={(e) =>
                        setPlan({ ...plan, effective_date: e.target.value })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{strings.bcpPlanPage.reviewDateLabel}</Label>
                    <Input
                      type="date"
                      value={plan.review_date?.slice(0, 10) || ""}
                      onChange={(e) =>
                        setPlan({ ...plan, review_date: e.target.value })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{strings.bcpPlanPage.objectivesLabel}</Label>
                  <Textarea
                    value={plan.objectives}
                    onChange={(e) =>
                      setPlan({ ...plan, objectives: e.target.value })
                    }
                    disabled={!canEdit}
                    rows={3}
                    placeholder={strings.bcpPlanPage.objectivesPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{strings.bcpPlanPage.scopeLabel}</Label>
                  <Textarea
                    value={plan.scope}
                    onChange={(e) =>
                      setPlan({ ...plan, scope: e.target.value })
                    }
                    disabled={!canEdit}
                    rows={3}
                    placeholder={strings.bcpPlanPage.scopePlaceholder}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card className="glass-card">
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div>
                <CardTitle className="text-base">
                  {strings.bcpPlanPage.sectionsTitle}
                </CardTitle>
                <CardDescription>
                  {strings.bcpPlanPage.sectionsDesc}
                </CardDescription>
              </div>
              {canEdit && (
                <Button
                  variant="secondary"
                  onClick={() => setSectionDialog(true)}
                  className="rounded-full"
                >
                  <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {strings.bcpPlanPage.addSection}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {plan.sections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {strings.bcpPlanPage.noSections}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plan.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border bg-background/50 p-4 pt-10 min-h-[100px]"
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          "absolute top-3 gap-2",
                          isRTL ? "right-3" : "left-3"
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                        {strings.bcpPlanPage.sectionLabel.replace(
                          "{index}",
                          String(idx + 1)
                        )}
                      </Badge>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(idx)}
                          className={cn(
                            "absolute top-2 text-destructive hover:text-destructive",
                            isRTL ? "left-2" : "right-2"
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <Input
                        value={section}
                        onChange={(e) => updateSection(idx, e.target.value)}
                        disabled={!canEdit}
                        className="bg-transparent border-0 focus:ring-0 text-sm font-medium"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Emergency Contacts */}
            <Card className="glass-card">
              <CardHeader
                className={cn(
                  "flex flex-row items-center justify-between",
                  isRTL ? "flex-row-reverse" : ""
                )}
              >
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {strings.bcpPlanPage.emergencyContactsTitle}
                  </CardTitle>
                </div>
                {canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setContactDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {plan.emergency_contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {strings.bcpPlanPage.noEmergencyContacts}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {plan.emergency_contacts.map((contact, idx) => (
                      <div
                        key={contact.id || idx}
                        className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
                      >
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {contact.role}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.phone}
                          </p>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeContact(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activation Triggers */}
            <Card className="glass-card">
              <CardHeader
                className={cn(
                  "flex flex-row items-center justify-between",
                  isRTL ? "flex-row-reverse" : ""
                )}
              >
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {strings.bcpPlanPage.activationTriggersTitle}
                  </CardTitle>
                  <CardDescription>
                    {strings.bcpPlanPage.activationTriggersDesc}
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTriggerDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {plan.activation_triggers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {strings.bcpPlanPage.noTriggers}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {plan.activation_triggers.map((trigger, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-status-warning" />
                          <span className="text-sm">{trigger}</span>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTrigger(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Communication Plan */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {strings.bcpPlanPage.communicationPlanTitle}
              </CardTitle>
              <CardDescription>
                {strings.bcpPlanPage.communicationPlanDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={plan.communication_plan}
                onChange={(e) =>
                  setPlan({ ...plan, communication_plan: e.target.value })
                }
                disabled={!canEdit}
                rows={4}
                placeholder={strings.bcpPlanPage.communicationPlanPlaceholder}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card className="glass-card">
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div>
                <CardTitle className="text-base">
                  {strings.bcpPlanPage.linkedServicesTitle}
                </CardTitle>
                <CardDescription>
                  {strings.bcpPlanPage.linkedServicesDesc}
                </CardDescription>
              </div>
              <Link to="/bcp/services">
                <Button variant="outline" size="sm" className="rounded-full">
                  {strings.bcpPlanPage.viewAll}
                  <ArrowRight
                    className={cn(
                      "h-4 w-4",
                      isRTL ? "mr-2 rotate-180" : "ml-2"
                    )}
                  />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {strings.bcpPlanPage.noLinkedServices}{" "}
                  <Link to="/bcp/services" className="text-primary underline">
                    {strings.bcpPlanPage.addServices}
                  </Link>
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.slice(0, 6).map((service) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-lg border bg-background/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            service.criticality?.toLowerCase() === "critical"
                              ? "destructive"
                              : service.criticality?.toLowerCase() === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {service.criticality}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {service.id}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{service.name}</p>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>RTO: {service.rto}</span>
                        <span>RPO: {service.rpo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card className="glass-card">
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div>
                <CardTitle className="text-base">
                  {strings.bcpPlanPage.planTestsTitle}
                </CardTitle>
                <CardDescription>
                  {strings.bcpPlanPage.planTestsDesc}
                </CardDescription>
              </div>
              <Link to="/bcp/tests">
                <Button variant="outline" size="sm" className="rounded-full">
                  {strings.bcpPlanPage.manageTests}
                  <ArrowRight
                    className={cn(
                      "h-4 w-4",
                      isRTL ? "mr-2 rotate-180" : "ml-2"
                    )}
                  />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {strings.bcpPlanPage.noTests}{" "}
                  <Link to="/bcp/tests" className="text-primary underline">
                    {strings.bcpPlanPage.scheduleTest}
                  </Link>
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-sm">
                        <th
                          className={cn(
                            "py-2 px-3",
                            isRTL ? "text-right" : "text-left"
                          )}
                        >
                          {strings.bcpPlanPage.tableTest}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {strings.bcpPlanPage.tableType}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {strings.bcpPlanPage.tableDate}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {strings.bcpPlanPage.tableStatus}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.slice(0, 5).map((test) => {
                        const normalizedStatus = test.status?.toLowerCase();
                        const statusVariant =
                          normalizedStatus === "passed"
                            ? "default"
                            : normalizedStatus === "failed"
                            ? "destructive"
                            : "secondary";

                        return (
                          <tr
                            key={test.id}
                            className="border-b border-border/50"
                          >
                            <td className="py-3 px-3 text-sm">{test.name}</td>
                            <td className="py-3 px-3 text-center">
                              <Badge variant="outline">
                                {testTypeLabel(
                                  test.type,
                                  strings.bcpTests || {}
                                )}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-center text-sm">
                              {formatDate(test.date || null, locale)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge variant={statusVariant}>
                                {testStatusLabel(
                                  test.status,
                                  strings.bcpTests || {}
                                )}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Section Dialog */}
      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {strings.bcpPlanPage.addSectionDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {strings.bcpPlanPage.addSectionDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{strings.bcpPlanPage.sectionTitleLabel}</Label>
              <Input
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder={strings.bcpPlanPage.sectionTitlePlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialog(false)}>
              {strings.actions.cancel}
            </Button>
            <Button onClick={addSection}>{strings.actions.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={contactDialog} onOpenChange={setContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {strings.bcpPlanPage.addContactDialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{strings.bcpPlanPage.nameLabel}</Label>
                <Input
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{strings.bcpPlanPage.roleLabel}</Label>
                <Input
                  value={newContact.role}
                  onChange={(e) =>
                    setNewContact({ ...newContact, role: e.target.value })
                  }
                  placeholder={strings.bcpPlanPage.rolePlaceholder}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{strings.bcpPlanPage.phoneLabel}</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{strings.bcpPlanPage.emailLabel}</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialog(false)}>
              {strings.actions.cancel}
            </Button>
            <Button onClick={addContact}>{strings.actions.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Trigger Dialog */}
      <Dialog open={triggerDialog} onOpenChange={setTriggerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {strings.bcpPlanPage.addTriggerDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {strings.bcpPlanPage.addTriggerDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{strings.bcpPlanPage.triggerLabel}</Label>
              <Input
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                placeholder={strings.bcpPlanPage.triggerPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerDialog(false)}>
              {strings.actions.cancel}
            </Button>
            <Button onClick={addTrigger}>{strings.actions.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BCPPlan;
