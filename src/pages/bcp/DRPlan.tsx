/**
 * DR Plan Page - Disaster recovery plan and sites.
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/authContext";
import { bcpApi } from "@/api";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Server,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Pencil,
  Building2,
  Zap,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import type { BCPService, BCPTest, DRSite } from "@/types";

// ===========================================
// Types
// ===========================================

interface DRPlanData {
  lastUpdated: string;
  rto: string;
  rpo: string;
  title?: string;
  version?: string;
  description?: string;
  status?: string;
}

interface DRSiteFormData {
  id?: number;
  name: string;
  description: string;
  siteType: string;
  location: string;
  capacity: number | null;
  rto: string;
  rpo: string;
  isPrimary: boolean;
  isActive: boolean;
  notes: string;
}

const emptySiteForm: DRSiteFormData = {
  name: "",
  description: "",
  siteType: "warm_site",
  location: "",
  capacity: null,
  rto: "",
  rpo: "",
  isPrimary: false,
  isActive: true,
  notes: "",
};

// ===========================================
// Helper Functions
// ===========================================

const siteTypeBadgeClass = (type: string) => {
  switch (type?.toLowerCase().replace(" ", "_")) {
    case "hot_site":
      return "bg-status-danger/15 text-status-danger border-status-danger/30";
    case "warm_site":
      return "bg-status-warning/15 text-status-warning border-status-warning/30";
    case "cold_site":
      return "bg-blue-500/15 text-blue-500 border-blue-500/30";
    case "cloud":
      return "bg-purple-500/15 text-purple-500 border-purple-500/30";
    default:
      return "bg-muted/40 text-muted-foreground border-muted";
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

const DRPlan: React.FC = () => {
  const { toast } = useToast();
  const { can } = useAuth();
  const { strings, isRTL, language } = useI18n();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<DRPlanData | null>(null);
  const [sites, setSites] = useState<DRSite[]>([]);
  const [services, setServices] = useState<BCPService[]>([]);
  const [tests, setTests] = useState<BCPTest[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [siteDialog, setSiteDialog] = useState(false);
  const [siteForm, setSiteForm] = useState<DRSiteFormData>(emptySiteForm);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [siteToDelete, setSiteToDelete] = useState<DRSite | null>(null);

  const canEdit = can("canEdit");

  // ===========================================
  // Data Loading
  // ===========================================

  const loadData = async () => {
    try {
      const [planData, sitesData, servicesData, testsData] = await Promise.all([
        bcpApi.getDRPlan(),
        bcpApi.getDRSites(),
        bcpApi.getServices(),
        bcpApi.getTests(),
      ]);

      setPlan(planData);
      setSites(sitesData);
      setServices(servicesData);
      setTests(testsData);
    } catch (error) {
      toast({
        title: strings.drPlanPage.toastLoadFailedTitle,
        description: strings.drPlanPage.toastLoadFailedDesc,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    init();
  }, []);

  // ===========================================
  // Plan Handlers
  // ===========================================

  const handleSavePlan = async () => {
    if (!plan || !canEdit) return;

    setSaving(true);
    try {
      await bcpApi.updateDRPlan({
        rto: plan.rto,
        rpo: plan.rpo,
        lastUpdated: new Date().toISOString().slice(0, 10),
      });

      toast({ title: strings.drPlanPage.toastPlanSaved });
    } catch (error) {
      toast({
        title: strings.drPlanPage.toastPlanSaveFailed,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ===========================================
  // Site Handlers
  // ===========================================

  const openAddSite = () => {
    setSiteForm(emptySiteForm);
    setDialogMode("add");
    setSiteDialog(true);
  };

  const openEditSite = (site: DRSite) => {
    setSiteForm({
      id: parseInt(site.id.replace(/\D/g, ""), 10) || 0,
      name: site.name,
      description: site.description || "",
      siteType: site.site_type || site.siteType || "warm_site",
      location: site.location || "",
      capacity: site.capacity || null,
      rto: site.rto || "",
      rpo: site.rpo || "",
      isPrimary: !!site.is_primary || !!site.isPrimary,
      isActive: site.is_active !== false && site.isActive !== false,
      notes: site.notes || "",
    });
    setDialogMode("edit");
    setSiteDialog(true);
  };

  const openViewSite = (site: DRSite) => {
    setSiteForm({
      id: parseInt(site.id.replace(/\D/g, ""), 10) || 0,
      name: site.name,
      description: site.description || "",
      siteType: site.site_type || site.siteType || "warm_site",
      location: site.location || "",
      capacity: site.capacity || null,
      rto: site.rto || "",
      rpo: site.rpo || "",
      isPrimary: !!site.is_primary || !!site.isPrimary,
      isActive: site.is_active !== false && site.isActive !== false,
      notes: site.notes || "",
    });
    setDialogMode("view");
    setSiteDialog(true);
  };

  const handleSaveSite = async () => {
    if (!siteForm.name.trim()) {
      toast({
        title: strings.drPlanPage.toastSiteNameRequired,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: siteForm.name,
        description: siteForm.description,
        site_type: siteForm.siteType,
        location: siteForm.location,
        capacity: siteForm.capacity,
        rto: siteForm.rto,
        rpo: siteForm.rpo,
        is_primary: siteForm.isPrimary,
        is_active: siteForm.isActive,
        notes: siteForm.notes,
      };

      if (dialogMode === "edit" && siteForm.id) {
        await bcpApi.updateDRSite(siteForm.id, data);
        toast({ title: strings.drPlanPage.toastSiteUpdated });
      } else {
        await bcpApi.createDRSite(data);
        toast({ title: strings.drPlanPage.toastSiteCreated });
      }

      await loadData();
      setSiteDialog(false);
    } catch (error) {
      toast({
        title: strings.drPlanPage.toastSiteSaveFailed,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;

    try {
      const numericId = parseInt(siteToDelete.id.replace(/\D/g, ""), 10);
      await bcpApi.deleteDRSite(numericId);
      toast({ title: strings.drPlanPage.toastSiteDeleted });
      await loadData();
    } catch (error) {
      toast({
        title: strings.drPlanPage.toastSiteDeleteFailed,
        variant: "destructive",
      });
    } finally {
      setSiteToDelete(null);
    }
  };

  // ===========================================
  // Render
  // ===========================================

  if (loading) return <PageLoader />;

  if (!plan) {
    return (
      <div className="space-y-6 animate-in">
        <h1 className="text-2xl font-bold">{strings.drPlanPage.title}</h1>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {strings.drPlanPage.noPlanData}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const siteTypeLabel = (type: string) => {
    switch (type?.toLowerCase().replace(" ", "_")) {
      case "hot_site":
        return strings.drPlanPage.siteTypeHot;
      case "warm_site":
        return strings.drPlanPage.siteTypeWarm;
      case "cold_site":
        return strings.drPlanPage.siteTypeCold;
      case "cloud":
        return strings.drPlanPage.siteTypeCloud;
      case "mobile":
        return strings.drPlanPage.siteTypeMobile;
      default:
        return type;
    }
  };

  const criticalityLabel = (value: string) => {
    const key = value?.toLowerCase();
    if (key === "critical") return strings.bcp.criticalityCritical;
    if (key === "high") return strings.bcp.criticalityHigh;
    if (key === "medium") return strings.bcp.criticalityMedium;
    if (key === "low") return strings.bcp.criticalityLow;
    return value;
  };

  const testStatusLabel = (status: string) => {
    if (status === "Passed") return strings.bcpTests.statusPassed;
    if (status === "Failed") return strings.bcpTests.statusFailed;
    if (status === "Planned") return strings.bcpTests.statusPlanned;
    return status;
  };

  // Statistics
  const activeSites = sites.filter((s) => s.is_active !== false).length;
  const hotSites = sites.filter((s) =>
    (s.site_type || "").toLowerCase().includes("hot")
  ).length;
  const drTests = tests.filter((t) => t.type === "DR");
  const passedDRTests = drTests.filter((t) => t.status === "Passed").length;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.drPlanPage.title}</h1>
          <p className="text-muted-foreground">{strings.drPlanPage.subtitle}</p>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              RTO: {plan.rto}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              RPO: {plan.rpo}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {strings.drPlanPage.lastUpdated}:{" "}
              {formatDate(plan.lastUpdated, locale)}
            </span>
          </div>
        </div>

        {canEdit && (
          <Button
            onClick={handleSavePlan}
            disabled={saving}
            className="rounded-full px-5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Save className="h-4 w-4 me-2" />
            )}
            {strings.drPlanPage.saveChanges}
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
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className={cn(isRTL ? "text-right" : "text-left")}>
                <p className="text-2xl font-bold">{sites.length}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.drPlanPage.statsSites}
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
                <Zap className="h-5 w-5 text-status-danger" />
              </div>
              <div className={cn(isRTL ? "text-right" : "text-left")}>
                <p className="text-2xl font-bold">{hotSites}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.drPlanPage.statsHotSites}
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
                <p className="text-2xl font-bold">{activeSites}</p>
                <p className="text-xs text-muted-foreground">
                  {strings.drPlanPage.statsActiveSites}
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
                <p className="text-2xl font-bold">
                  {passedDRTests}/{drTests.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {strings.drPlanPage.statsTestsPassed}
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
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview">
            {strings.drPlanPage.tabOverview}
          </TabsTrigger>
          <TabsTrigger value="sites">{strings.drPlanPage.tabSites}</TabsTrigger>
          <TabsTrigger value="services">
            {strings.drPlanPage.tabServices}
          </TabsTrigger>
          <TabsTrigger value="tests">{strings.drPlanPage.tabTests}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recovery Objectives */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {strings.drPlanPage.recoveryObjectivesTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{strings.drPlanPage.rtoLabel}</Label>
                    <Input
                      value={plan.rto}
                      onChange={(e) =>
                        setPlan({ ...plan, rto: e.target.value })
                      }
                      disabled={!canEdit}
                      placeholder={strings.drPlanPage.rtoPlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{strings.drPlanPage.rpoLabel}</Label>
                    <Input
                      value={plan.rpo}
                      onChange={(e) =>
                        setPlan({ ...plan, rpo: e.target.value })
                      }
                      disabled={!canEdit}
                      placeholder={strings.drPlanPage.rpoPlaceholder}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium mb-2">
                    {strings.drPlanPage.rtoRpoInfoTitle}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>{strings.drPlanPage.rtoInfo}</li>
                    <li>{strings.drPlanPage.rpoInfo}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  {strings.drPlanPage.infraSummaryTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">
                      {strings.drPlanPage.infraTotalSites}
                    </span>
                    <Badge variant="secondary">{sites.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">
                      {strings.drPlanPage.infraHotSites}
                    </span>
                    <Badge className="bg-status-danger/15 text-status-danger">
                      {hotSites}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">
                      {strings.drPlanPage.infraCriticalServices}
                    </span>
                    <Badge variant="secondary">{services.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">
                      {strings.drPlanPage.infraDrTests}
                    </span>
                    <Badge variant="secondary">{drTests.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sites Tab */}
        <TabsContent value="sites" className="space-y-4">
          <Card className="glass-card">
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <div>
                <CardTitle className="text-base">
                  {strings.drPlanPage.sitesTitle}
                </CardTitle>
                <CardDescription>
                  {strings.drPlanPage.sitesDesc}
                </CardDescription>
              </div>
              {canEdit && (
                <Button
                  variant="secondary"
                  onClick={openAddSite}
                  className="rounded-full"
                >
                  <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {strings.drPlanPage.addSite}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {strings.drPlanPage.emptySitesTitle}
                  </p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={openAddSite}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {strings.drPlanPage.emptySitesAction}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border",
                            siteTypeBadgeClass(site.site_type || "")
                          )}
                        >
                          {siteTypeLabel(site.site_type || "warm_site")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {site.id}
                        </span>
                      </div>

                      <h4 className="font-medium mb-1">{site.name}</h4>

                      {site.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3" />
                          {site.location}
                        </p>
                      )}

                      <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                        {site.rto && <span>RTO: {site.rto}</span>}
                        {site.rpo && <span>RPO: {site.rpo}</span>}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewSite(site)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditSite(site)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setSiteToDelete(site)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  {strings.drPlanPage.servicesTitle}
                </CardTitle>
                <CardDescription>
                  {strings.drPlanPage.servicesDesc}
                </CardDescription>
              </div>
              <Link to="/bcp/services">
                <Button variant="outline" size="sm" className="rounded-full">
                  {strings.drPlanPage.manageServices}
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
                  {strings.drPlanPage.emptyServices}{" "}
                  <Link to="/bcp/services" className="text-primary underline">
                    {strings.drPlanPage.addServices}
                  </Link>
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-sm">
                        <th className="py-2 px-3 text-right">
                          {strings.drPlanPage.tableService}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {strings.drPlanPage.tableCriticality}
                        </th>
                        <th className="py-2 px-3 text-center">RTO</th>
                        <th className="py-2 px-3 text-center">RPO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr
                          key={service.id}
                          className="border-b border-border/50"
                        >
                          <td className="py-3 px-3">
                            <span className="text-sm font-medium">
                              {service.name}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {service.id}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant={
                                service.criticality?.toLowerCase() ===
                                "critical"
                                  ? "destructive"
                                  : service.criticality?.toLowerCase() ===
                                    "high"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {criticalityLabel(service.criticality || "")}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center text-sm">
                            {service.rto}
                          </td>
                          <td className="py-3 px-3 text-center text-sm">
                            {service.rpo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  {strings.drPlanPage.testsTitle}
                </CardTitle>
                <CardDescription>
                  {strings.drPlanPage.testsDesc}
                </CardDescription>
              </div>
              <Link to="/bcp/tests">
                <Button variant="outline" size="sm" className="rounded-full">
                  {strings.drPlanPage.manageTests}
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
              {drTests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {strings.drPlanPage.emptyTests}{" "}
                  <Link to="/bcp/tests" className="text-primary underline">
                    {strings.drPlanPage.scheduleTest}
                  </Link>
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-sm">
                        <th className="py-2 px-3 text-right">
                          {strings.drPlanPage.tableTest}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {strings.drPlanPage.tableDate}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {strings.drPlanPage.tableStatus}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {drTests.map((test) => (
                        <tr key={test.id} className="border-b border-border/50">
                          <td className="py-3 px-3 text-sm">{test.name}</td>
                          <td className="py-3 px-3 text-center text-sm">
                            {formatDate(test.date, locale)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant={
                                test.status === "Passed"
                                  ? "default"
                                  : test.status === "Failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {testStatusLabel(test.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Site Dialog */}
      <Dialog open={siteDialog} onOpenChange={setSiteDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add"
                ? strings.drPlanPage.dialogAddTitle
                : dialogMode === "edit"
                ? strings.drPlanPage.dialogEditTitle
                : strings.drPlanPage.dialogViewTitle}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "view"
                ? strings.drPlanPage.dialogViewDesc
                : strings.drPlanPage.dialogEditDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{strings.drPlanPage.siteNameLabel} *</Label>
                <Input
                  value={siteForm.name}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, name: e.target.value })
                  }
                  disabled={dialogMode === "view"}
                  placeholder={strings.drPlanPage.siteNamePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label>{strings.drPlanPage.siteTypeLabel}</Label>
                <Select
                  value={siteForm.siteType}
                  onValueChange={(v) =>
                    setSiteForm({ ...siteForm, siteType: v })
                  }
                  disabled={dialogMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot_site">
                      {strings.drPlanPage.siteTypeHot}
                    </SelectItem>
                    <SelectItem value="warm_site">
                      {strings.drPlanPage.siteTypeWarm}
                    </SelectItem>
                    <SelectItem value="cold_site">
                      {strings.drPlanPage.siteTypeCold}
                    </SelectItem>
                    <SelectItem value="cloud">
                      {strings.drPlanPage.siteTypeCloud}
                    </SelectItem>
                    <SelectItem value="mobile">
                      {strings.drPlanPage.siteTypeMobile}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{strings.drPlanPage.locationLabel}</Label>
              <Input
                value={siteForm.location}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, location: e.target.value })
                }
                disabled={dialogMode === "view"}
                placeholder={strings.drPlanPage.locationPlaceholder}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>RTO</Label>
                <Input
                  value={siteForm.rto}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, rto: e.target.value })
                  }
                  disabled={dialogMode === "view"}
                  placeholder="4 hours"
                />
              </div>
              <div className="space-y-2">
                <Label>RPO</Label>
                <Input
                  value={siteForm.rpo}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, rpo: e.target.value })
                  }
                  disabled={dialogMode === "view"}
                  placeholder="1 hour"
                />
              </div>
              <div className="space-y-2">
                <Label>{strings.drPlanPage.capacityLabel}</Label>
                <Input
                  type="number"
                  value={siteForm.capacity || ""}
                  onChange={(e) =>
                    setSiteForm({
                      ...siteForm,
                      capacity: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  disabled={dialogMode === "view"}
                  placeholder={strings.drPlanPage.capacityPlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{strings.drPlanPage.notesLabel}</Label>
              <Textarea
                value={siteForm.notes}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, notes: e.target.value })
                }
                disabled={dialogMode === "view"}
                rows={3}
                placeholder={strings.drPlanPage.notesPlaceholder}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSiteDialog(false)}>
              {dialogMode === "view"
                ? strings.drPlanPage.close
                : strings.actions.cancel}
            </Button>
            {dialogMode !== "view" && (
              <Button onClick={handleSaveSite} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {dialogMode === "add"
                  ? strings.actions.add
                  : strings.actions.save}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!siteToDelete}
        onOpenChange={(open) => !open && setSiteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.drPlanPage.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.drPlanPage.deleteDesc.replace(
                "{name}",
                siteToDelete?.name || ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSite}
              className="bg-destructive text-destructive-foreground"
            >
              {strings.drPlanPage.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DRPlan;
