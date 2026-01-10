import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Can } from "@/components/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { riskApi } from "@/api";
import { RISK_CATEGORIES, RISK_STATUSES } from "@/utils/constants";
import type { Risk } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  X,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { mapBackendCategoryToFrontend } from "@/api/adapters";

type SortField = "title" | "score" | "updatedAt" | "category";
type SortOrder = "asc" | "desc";

const RiskList: React.FC = () => {
  const navigate = useNavigate();
  const { can, canCreate, canEdit, canDelete } = usePermissions();
  const { toast } = useToast();
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

  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([...RISK_CATEGORIES]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteRisk, setDeleteRisk] = useState<Risk | null>(null);

  useEffect(() => {
    loadRisks();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await riskApi.getCategories();
      const mapped = data
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((c) => mapBackendCategoryToFrontend(c.code || c.name || ""))
        .filter(
          (v): v is string => typeof v === "string" && v.trim().length > 0
        );
      const unique = Array.from(new Set(mapped));
      if (unique.length > 0) setCategories(unique);
    } catch {
      // Keep fallback categories
    }
  };

  const loadRisks = async () => {
    setLoading(true);
    try {
      const data = await riskApi.getAll();
      setRisks(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRisk) return;
    try {
      await riskApi.delete(deleteRisk.id);
      setRisks((prev) => prev.filter((r) => r.id !== deleteRisk.id));
      toast({
        title: strings.risks.toastRiskDeletedTitle,
        description: `${deleteRisk.title} ${strings.risks.toastRiskDeletedDescSuffix}`,
      });
    } catch (error) {
      toast({
        title: strings.risks.toastErrorTitle,
        description: strings.risks.toastDeleteFailed,
        variant: "destructive",
      });
    } finally {
      setDeleteRisk(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredRisks = risks
    .filter((risk) => {
      const matchesSearch =
        !searchQuery ||
        risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        risk.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || risk.category === categoryFilter;
      const matchesLevel = levelFilter === "all" || risk.level === levelFilter;
      const matchesStatus =
        statusFilter === "all" || risk.status === statusFilter;
      return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "score":
          comparison = a.score - b.score;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "updatedAt":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setLevelFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter !== "all" ||
    levelFilter !== "all" ||
    statusFilter !== "all";

  if (loading) return <PageLoader text={strings.risks.loading} />;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.risks.riskRegister}</h1>
          <p className="text-muted-foreground">
            {risks.length} {strings.risks.risksTracked}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/risks/new">
              <Plus className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
              {strings.actions.newRisk}
            </Link>
          </Button>
        )}
      </div>

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
                placeholder={strings.risks.searchPlaceholder}
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
                <Filter className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {strings.risks.filters}
                {hasActiveFilters && (
                  <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  {strings.risks.clear}
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {strings.risks.category}
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={strings.risks.allCategories} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {strings.risks.allCategories}
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {strings.risks.riskLevel}
                </label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={strings.risks.allLevels} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {strings.risks.allLevels}
                    </SelectItem>
                    <SelectItem value="Critical">
                      {getLevelLabel("Critical")}
                    </SelectItem>
                    <SelectItem value="High">
                      {getLevelLabel("High")}
                    </SelectItem>
                    <SelectItem value="Medium">
                      {getLevelLabel("Medium")}
                    </SelectItem>
                    <SelectItem value="Low">{getLevelLabel("Low")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {strings.risks.status}
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={strings.risks.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {strings.risks.allStatuses}
                    </SelectItem>
                    {RISK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Table */}
      {filteredRisks.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={strings.risks.noRisksFound}
          description={
            hasActiveFilters
              ? strings.risks.noRisksMatchFilters
              : strings.risks.getStartedCreate
          }
          action={
            canCreate
              ? {
                  label: strings.risks.createRisk,
                  onClick: () => navigate("/risks/new"),
                }
              : undefined
          }
        />
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th
                    className={cn(
                      isRTL ? "text-right" : "text-left",
                      "py-3 px-4 text-sm font-medium text-muted-foreground"
                    )}
                  >
                    {strings.table.id}
                  </th>
                  <th
                    className={cn(
                      isRTL ? "text-right" : "text-left",
                      "py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    )}
                    onClick={() => toggleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      {strings.table.title} <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    className={cn(
                      isRTL ? "text-right" : "text-left",
                      "py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    )}
                    onClick={() => toggleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      {strings.table.category} <SortIcon field="category" />
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.likelihoodShort}
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.impactShort}
                  </th>
                  <th
                    className="text-center py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("score")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {strings.table.score} <SortIcon field="score" />
                    </div>
                  </th>
                  <th
                    className={cn(
                      isRTL ? "text-right" : "text-left",
                      "py-3 px-4 text-sm font-medium text-muted-foreground"
                    )}
                  >
                    {strings.table.level}
                  </th>
                  <th
                    className={cn(
                      isRTL ? "text-right" : "text-left",
                      "py-3 px-4 text-sm font-medium text-muted-foreground"
                    )}
                  >
                    {strings.table.owner}
                  </th>
                  <th
                    className={cn(
                      isRTL ? "text-right" : "text-left",
                      "py-3 px-4 text-sm font-medium text-muted-foreground"
                    )}
                  >
                    {strings.table.status}
                  </th>
                  <th
                    className={cn(
                      isRTL ? "text-right" : "text-left",
                      "py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    )}
                    onClick={() => toggleSort("updatedAt")}
                  >
                    <div className="flex items-center gap-1">
                      {strings.table.updated} <SortIcon field="updatedAt" />
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    {strings.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/risks/${risk.id}`)}
                  >
                    <td
                      className={cn(
                        isRTL ? "text-right" : "text-left",
                        "py-3 px-4 text-sm font-mono text-primary"
                      )}
                    >
                      {risk.id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium line-clamp-1">
                        {risk.title}
                      </p>
                    </td>
                    <td
                      className={cn(
                        isRTL ? "text-right" : "text-left",
                        "py-3 px-4 text-sm text-muted-foreground"
                      )}
                    >
                      {getCategoryLabel(risk.category)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {risk.likelihood}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {risk.impact}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-bold">{risk.score}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={risk.level}>
                        {getLevelLabel(risk.level)}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-[120px]">
                      {risk.owner}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={risk.status}>
                        {getStatusLabel(risk.status)}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(risk.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/risks/${risk.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/risks/${risk.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteRisk(risk)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRisk} onOpenChange={() => setDeleteRisk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.risks.deleteDialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.risks.deleteDialogDescriptionPrefix} "{deleteRisk?.title}
              "? {strings.risks.deleteDialogDescriptionSuffix}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {strings.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RiskList;
