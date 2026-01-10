/**
 * Policy Documents Page - Policies and procedures.
 *
 * View and manage policy documents and procedures.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/common/Loader";
import { Can } from "@/components/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { policyDocumentApi } from "@/api";
import type {
  PolicyDocument,
  PolicyDocumentInput,
  PolicyDocumentStats,
  PolicyDocumentType,
  PolicyDocumentStatus,
} from "@/api/policyDocumentApi";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Archive,
  Clock,
  AlertTriangle,
  Eye,
  RefreshCw,
  X,
} from "lucide-react";

// ===========================================
// Type Labels
// ===========================================

const TYPE_META: Record<PolicyDocumentType, { icon: string }> = {
  policy: { icon: "??" },
  framework: { icon: "???" },
  guideline: { icon: "??" },
  procedure: { icon: "??" },
  standard: { icon: "??" },
  manual: { icon: "??" },
  template: { icon: "??" },
  defense_line: { icon: "???" },
};

const TYPE_ORDER: PolicyDocumentType[] = [
  "policy",
  "framework",
  "guideline",
  "procedure",
  "standard",
  "manual",
  "template",
  "defense_line",
];

const STATUS_COLORS: Record<PolicyDocumentStatus, string> = {
  draft: "bg-gray-500",
  under_review: "bg-yellow-500",
  approved: "bg-blue-500",
  active: "bg-green-500",
  expired: "bg-red-500",
  archived: "bg-gray-400",
};

const STATUS_ORDER: PolicyDocumentStatus[] = [
  "draft",
  "under_review",
  "approved",
  "active",
  "expired",
  "archived",
];

// ===========================================
// Component
// ===========================================

const PolicyDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { strings, isRTL } = useI18n();
  const { canCreate, canEdit, canDelete } = usePermissions();

  // State
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [stats, setStats] = useState<PolicyDocumentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<PolicyDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<PolicyDocument | null>(null);
  const [viewDoc, setViewDoc] = useState<PolicyDocument | null>(null);

  // Form state
  const [formData, setFormData] = useState<PolicyDocumentInput>({
    title: "",
    type: "policy",
    status: "draft",
    version: "1.0",
  });

  // ===========================================
  // Data Loading
  // ===========================================

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsResult, statsResult] = await Promise.all([
        policyDocumentApi.getAll(),
        policyDocumentApi.getStatistics(),
      ]);
      setDocuments(docsResult.items || []);
      setStats(statsResult);
    } catch (error) {
      console.error("Failed to load policy documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===========================================
  // Filtering
  // ===========================================

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // ===========================================
  // Actions
  // ===========================================

  const openCreateDialog = () => {
    setEditingDoc(null);
    setFormData({
      title: "",
      type: "policy",
      status: "draft",
      version: "1.0",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (doc: PolicyDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      title_en: doc.title_en,
      description: doc.description,
      type: doc.type,
      category: doc.category,
      status: doc.status,
      version: doc.version,
      issue_date: doc.issue_date,
      effective_date: doc.effective_date,
      expiry_date: doc.expiry_date,
      review_date: doc.review_date,
      department: doc.department,
      keywords: doc.keywords,
      scope: doc.scope,
      notes: doc.notes,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: strings.policiesPage.toastTitleRequired,
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDoc) {
        await policyDocumentApi.update(editingDoc.id, formData);
        toast({ title: strings.policiesPage.toastUpdated });
      } else {
        await policyDocumentApi.create(formData);
        toast({ title: strings.policiesPage.toastCreated });
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: strings.policiesPage.toastError, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await policyDocumentApi.delete(deleteDoc.id);
      toast({ title: strings.policiesPage.toastDeleted });
      setDeleteDoc(null);
      loadData();
    } catch (error) {
      toast({ title: strings.policiesPage.toastError, variant: "destructive" });
    }
  };

  const handleApprove = async (doc: PolicyDocument) => {
    try {
      await policyDocumentApi.approve(doc.id);
      toast({ title: strings.policiesPage.toastApproved });
      loadData();
    } catch (error) {
      toast({ title: strings.policiesPage.toastError, variant: "destructive" });
    }
  };

  const handleActivate = async (doc: PolicyDocument) => {
    try {
      await policyDocumentApi.activate(doc.id);
      toast({ title: strings.policiesPage.toastActivated });
      loadData();
    } catch (error) {
      toast({ title: strings.policiesPage.toastError, variant: "destructive" });
    }
  };

  const handleArchive = async (doc: PolicyDocument) => {
    try {
      await policyDocumentApi.archive(doc.id);
      toast({ title: strings.policiesPage.toastArchived });
      loadData();
    } catch (error) {
      toast({ title: strings.policiesPage.toastError, variant: "destructive" });
    }
  };

  const handleMarkReviewed = async (doc: PolicyDocument) => {
    try {
      await policyDocumentApi.markReviewed(doc.id);
      toast({ title: strings.policiesPage.toastReviewed });
      loadData();
    } catch (error) {
      toast({ title: strings.policiesPage.toastError, variant: "destructive" });
    }
  };

  // ===========================================
  // Helpers
  // ===========================================

  const getTypeLabel = (type: PolicyDocumentType) =>
    strings.policiesPage.types?.[type] || type;;

  const getStatusLabel = (status: PolicyDocumentStatus) =>
    strings.policiesPage.statuses?.[status] || status;;

  const getStatusColor = (status: PolicyDocumentStatus) =>
    STATUS_COLORS[status] || "bg-gray-500";

  // ===========================================
  // Render
  // ===========================================

  if (loading) return <PageLoader text={strings.policiesPage.loading} />;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {strings.policiesPage.title}
          </h1>
          <p className="text-muted-foreground">
            {strings.policiesPage.subtitle}
          </p>
        </div>
        <Can permission="canCreate">
          <Button onClick={openCreateDialog}>
            <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {strings.policiesPage.newDocument}
          </Button>
        </Can>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">
                {strings.policiesPage.statsTotal}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-500">
                {stats.active}
              </p>
              <p className="text-sm text-muted-foreground">
                {strings.policiesPage.statsActive}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-500">{stats.draft}</p>
              <p className="text-sm text-muted-foreground">
                {strings.policiesPage.statsDraft}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-500">
                {stats.needs_review}
              </p>
              <p className="text-sm text-muted-foreground">
                {strings.policiesPage.statsNeedsReview}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">
                {strings.policiesPage.statsExpired}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">
                {stats.by_type?.policy || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {strings.policiesPage.statsPolicies}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                  isRTL ? "right-3" : "left-3"
                )}
              />
              <Input
                placeholder={strings.policiesPage.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "secondary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {strings.policiesPage.filters}
              </Button>
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {strings.policiesPage.refresh}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <Label className="mb-2 block">
                  {strings.policiesPage.typeLabel}
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={strings.policiesPage.allTypes} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {strings.policiesPage.allTypes}
                    </SelectItem>
                    {TYPE_ORDER.map((value) => (
                      <SelectItem key={value} value={value}>
                        {TYPE_META[value]?.icon} {getTypeLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">
                  {strings.policiesPage.statusLabel}
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={strings.policiesPage.allStatuses}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {strings.policiesPage.allStatuses}
                    </SelectItem>
                    {STATUS_ORDER.map((value) => (
                      <SelectItem key={value} value={value}>
                        {getStatusLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {strings.policiesPage.emptyTitle}
            </h3>
            <p className="text-muted-foreground mb-4">
              {strings.policiesPage.emptyDesc}
            </p>
            <Can permission="canCreate">
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 ml-2" />
                {strings.policiesPage.emptyAction}
              </Button>
            </Can>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                "glass-card hover:shadow-lg transition-shadow cursor-pointer",
                doc.is_expired && "border-red-500/50",
                doc.needs_review && !doc.is_expired && "border-yellow-500/50"
              )}
              onClick={() => setViewDoc(doc)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">
                        {TYPE_META[doc.type]?.icon || "📄"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {doc.document_code || `DOC-${doc.id}`}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-2">
                      {doc.title}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? "start" : "end"}>
                      <DropdownMenuItem onClick={() => setViewDoc(doc)}>
                        <Eye className="h-4 w-4 ml-2" />
                        {strings.policiesPage.actionView}
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(doc);
                          }}
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          {strings.policiesPage.actionEdit}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {doc.status === "draft" && canEdit && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(doc);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                          {strings.policiesPage.actionApprove}
                        </DropdownMenuItem>
                      )}
                      {doc.status === "approved" && canEdit && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivate(doc);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 ml-2 text-blue-500" />
                          {strings.policiesPage.actionActivate}
                        </DropdownMenuItem>
                      )}
                      {doc.needs_review && canEdit && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkReviewed(doc);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 ml-2 text-yellow-500" />
                          {strings.policiesPage.actionMarkReviewed}
                        </DropdownMenuItem>
                      )}
                      {doc.status === "active" && canEdit && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(doc);
                          }}
                        >
                          <Archive className="h-4 w-4 ml-2" />
                          {strings.policiesPage.actionArchive}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDoc(doc);
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            {strings.policiesPage.actionDelete}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {doc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn("text-white", getStatusColor(doc.status))}
                  >
                    {getStatusLabel(doc.status)}
                  </Badge>
                  <Badge variant="outline">{getTypeLabel(doc.type)}</Badge>
                  <Badge variant="secondary">v{doc.version}</Badge>
                </div>
                {(doc.is_expired || doc.needs_review) && (
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    {doc.is_expired && (
                      <span className="flex items-center text-red-500">
                        <AlertTriangle className="h-3 w-3 ml-1" />
                        {strings.policiesPage.statusExpired}
                      </span>
                    )}
                    {doc.needs_review && !doc.is_expired && (
                      <span className="flex items-center text-yellow-500">
                        <Clock className="h-3 w-3 ml-1" />
                        {strings.policiesPage.statusNeedsReview}
                      </span>
                    )}
                  </div>
                )}
                {doc.department && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {doc.department}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDoc
                ? strings.policiesPage.dialogEditTitle
                : strings.policiesPage.dialogCreateTitle}
            </DialogTitle>
            <DialogDescription>
              {editingDoc
                ? strings.policiesPage.dialogEditDesc
                : strings.policiesPage.dialogCreateDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{strings.policiesPage.fieldTitle} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={strings.policiesPage.placeholderTitle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_en">
                  {strings.policiesPage.fieldTitleEn}
                </Label>
                <Input
                  id="title_en"
                  value={formData.title_en || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title_en: e.target.value,
                    }))
                  }
                  placeholder={strings.policiesPage.placeholderTitleEn}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{strings.policiesPage.fieldType}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: v as PolicyDocumentType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_ORDER.map((value) => (
                      <SelectItem key={value} value={value}>
                        {TYPE_META[value]?.icon} {getTypeLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{strings.policiesPage.fieldStatus}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: v as PolicyDocumentStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((value) => (
                      <SelectItem key={value} value={value}>
                        {getStatusLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">{strings.policiesPage.fieldVersion}</Label>
                <Input
                  id="version"
                  value={formData.version || "1.0"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      version: e.target.value,
                    }))
                  }
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {strings.policiesPage.fieldDescription}
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={strings.policiesPage.placeholderDescription}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">
                  {strings.policiesPage.fieldDepartment}
                </Label>
                <Input
                  id="department"
                  value={formData.department || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  placeholder={strings.policiesPage.placeholderDepartment}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">
                  {strings.policiesPage.fieldCategory}
                </Label>
                <Input
                  id="category"
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder={strings.policiesPage.placeholderCategory}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">
                  {strings.policiesPage.fieldIssueDate}
                </Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      issue_date: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_date">
                  {strings.policiesPage.fieldEffectiveDate}
                </Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      effective_date: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_date">
                  {strings.policiesPage.fieldReviewDate}
                </Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      review_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">
                {strings.policiesPage.fieldKeywords}
              </Label>
              <Input
                id="keywords"
                value={formData.keywords || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, keywords: e.target.value }))
                }
                placeholder={strings.policiesPage.placeholderKeywords}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{strings.policiesPage.fieldNotes}</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder={strings.policiesPage.placeholderNotes}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {strings.policiesPage.buttonCancel}
            </Button>
            <Button onClick={handleSave}>
              {editingDoc
                ? strings.policiesPage.buttonSaveChanges
                : strings.policiesPage.buttonSaveCreate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {TYPE_META[viewDoc.type]?.icon}
                  </span>
                  <Badge variant="outline">
                    {viewDoc.document_code || `DOC-${viewDoc.id}`}
                  </Badge>
                  <Badge
                    className={cn("text-white", getStatusColor(viewDoc.status))}
                  >
                    {getStatusLabel(viewDoc.status)}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{viewDoc.title}</DialogTitle>
                {viewDoc.title_en && (
                  <p className="text-muted-foreground">{viewDoc.title_en}</p>
                )}
              </DialogHeader>

              <div className="space-y-4">
                {viewDoc.description && (
                  <div>
                    <Label className="text-muted-foreground">
                      {strings.policiesPage.fieldDescription}
                    </Label>
                    <p className="mt-1">{viewDoc.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      {strings.policiesPage.fieldType}
                    </Label>
                    <p className="mt-1">{getTypeLabel(viewDoc.type)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {strings.policiesPage.fieldVersion}
                    </Label>
                    <p className="mt-1">v{viewDoc.version}</p>
                  </div>
                  {viewDoc.department && (
                    <div>
                      <Label className="text-muted-foreground">
                        {strings.policiesPage.fieldDepartment}
                      </Label>
                      <p className="mt-1">{viewDoc.department}</p>
                    </div>
                  )}
                  {viewDoc.owner_name && (
                    <div>
                      <Label className="text-muted-foreground">
                        {strings.policiesPage.viewOwner}
                      </Label>
                      <p className="mt-1">{viewDoc.owner_name}</p>
                    </div>
                  )}
                  {viewDoc.issue_date && (
                    <div>
                      <Label className="text-muted-foreground">
                        {strings.policiesPage.fieldIssueDate}
                      </Label>
                      <p className="mt-1">{viewDoc.issue_date}</p>
                    </div>
                  )}
                  {viewDoc.effective_date && (
                    <div>
                      <Label className="text-muted-foreground">
                        {strings.policiesPage.fieldEffectiveDate}
                      </Label>
                      <p className="mt-1">{viewDoc.effective_date}</p>
                    </div>
                  )}
                  {viewDoc.review_date && (
                    <div>
                      <Label className="text-muted-foreground">
                        {strings.policiesPage.fieldReviewDate}
                      </Label>
                      <p className="mt-1">{viewDoc.review_date}</p>
                    </div>
                  )}
                  {viewDoc.expiry_date && (
                    <div>
                      <Label className="text-muted-foreground">
                        {strings.policiesPage.viewExpiryDate}
                      </Label>
                      <p className="mt-1">{viewDoc.expiry_date}</p>
                    </div>
                  )}
                </div>

                {viewDoc.keywords && (
                  <div>
                    <Label className="text-muted-foreground">
                      {strings.policiesPage.fieldKeywords}
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewDoc.keywords.split(",").map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {kw.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {viewDoc.notes && (
                  <div>
                    <Label className="text-muted-foreground">
                      {strings.policiesPage.fieldNotes}
                    </Label>
                    <p className="mt-1 text-sm">{viewDoc.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDoc(null)}>
                  {strings.policiesPage.viewClose}
                </Button>
                {canEdit && (
                  <Button
                    onClick={() => {
                      setViewDoc(null);
                      openEditDialog(viewDoc);
                    }}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    {strings.policiesPage.viewEdit}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.policiesPage.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.policiesPage.deleteDescription.replace(
                "{title}",
                deleteDoc?.title || ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {strings.policiesPage.buttonCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {strings.policiesPage.actionDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PolicyDocumentsPage;
