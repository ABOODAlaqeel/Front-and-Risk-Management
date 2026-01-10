import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageLoader } from "@/components/common/Loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/authContext";
import { userApi } from "@/api";
import {
  clearRiskMsStorage,
  exportRiskMsStorage,
  importRiskMsStorage,
} from "@/utils/storageTools";
import { Download, Loader2, Save, Trash2, Upload } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import type { BackendRiskCategory } from "@/types/backend";
import { riskApi } from "@/api";

type Settings = {
  riskMatrixThresholds: { low: number; medium: number; high: number };
  notifications: boolean;
  autoAssessmentReminder: number;
};

const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const { can } = useAuth();
  const { strings, isRTL } = useI18n();

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [categories, setCategories] = useState<BackendRiskCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<BackendRiskCategory | null>(null);
  const [categoryDraft, setCategoryDraft] = useState({
    name: "",
    code: "",
    description: "",
    color: "",
    icon: "",
    sort_order: 0,
  });
  const [categoryDelete, setCategoryDelete] =
    useState<BackendRiskCategory | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const canEdit = can("canViewSettings");

  const downloadJson = (filename: string, data: unknown) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportData = () => {
    if (!canEdit) {
      toast({
        title: strings.common.notAllowed,
        description: strings.system.noAccessDesc,
        variant: "destructive",
      });
      return;
    }

    const payload = exportRiskMsStorage();
    const safeDate = new Date().toISOString().replace(/[:.]/g, "-");
    downloadJson(`riskms-demo-export-${safeDate}.json`, payload);
    toast({
      title: strings.system.exportedTitle,
      description: strings.system.exportedDesc,
    });
  };

  const requestImport = () => {
    if (!canEdit) {
      toast({
        title: strings.common.notAllowed,
        description: strings.system.noAccessDesc,
        variant: "destructive",
      });
      return;
    }
    importInputRef.current?.click();
  };

  const onImportFileSelected: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!canEdit) {
      toast({
        title: strings.common.notAllowed,
        description: strings.system.noAccessDesc,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const payload = JSON.parse(text) as unknown;
        importRiskMsStorage(payload);
        toast({
          title: strings.system.importedTitle,
          description: strings.system.importedDesc,
        });
        window.setTimeout(() => window.location.reload(), 400);
      } catch (err) {
        toast({
          title: strings.system.importFailedTitle,
          description:
            err instanceof Error ? err.message : strings.system.invalidFile,
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: strings.system.importFailedTitle,
        description: strings.system.couldNotRead,
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    if (!canEdit) {
      toast({
        title: strings.common.notAllowed,
        description: strings.system.noAccessDesc,
        variant: "destructive",
      });
      return;
    }
    clearRiskMsStorage();
    toast({
      title: strings.system.clearedTitle,
      description: strings.system.clearedDesc,
    });
    window.setTimeout(() => window.location.reload(), 400);
  };

  const refresh = async () => {
    const data = await userApi.getSystemSettings();
    setSettings(data);
  };

  const refreshCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await riskApi.getCategories();
      setCategories(data);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await refresh();
        await refreshCategories();
      } catch {
        toast({
          title: strings.system.failedToLoadTitle,
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

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryDraft({
      name: "",
      code: "",
      description: "",
      color: "",
      icon: "",
      sort_order: 0,
    });
  };

  const openEditCategory = (c: BackendRiskCategory) => {
    setEditingCategory(c);
    setCategoryDraft({
      name: c.name || "",
      code: c.code || "",
      description: c.description || "",
      color: c.color || "",
      icon: c.icon || "",
      sort_order: c.sort_order || 0,
    });
  };

  const submitCategory = async () => {
    if (!canEdit) {
      toast({
        title: strings.common.notAllowed,
        description: strings.system.noAccessDesc,
        variant: "destructive",
      });
      return;
    }

    const name = categoryDraft.name.trim();
    const code = categoryDraft.code.trim();
    if (!name || !code) {
      toast({
        title: strings.common.error,
        description: strings.system.categoryNameCodeRequired,
        variant: "destructive",
      });
      return;
    }

    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        await riskApi.updateCategory(editingCategory.id, {
          name,
          code,
          description: categoryDraft.description?.trim() || undefined,
          color: categoryDraft.color?.trim() || undefined,
          icon: categoryDraft.icon?.trim() || undefined,
          sort_order: Number(categoryDraft.sort_order) || 0,
        });
        toast({ title: strings.system.categoryUpdated });
      } else {
        await riskApi.createCategory({
          name,
          code,
          description: categoryDraft.description?.trim() || undefined,
          color: categoryDraft.color?.trim() || undefined,
          icon: categoryDraft.icon?.trim() || undefined,
          sort_order: Number(categoryDraft.sort_order) || 0,
        });
        toast({ title: strings.system.categoryCreated });
      }
      setEditingCategory(null);
      await refreshCategories();
    } catch (err) {
      toast({
        title: strings.system.categorySaveFailed,
        description:
          err instanceof Error ? err.message : strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setCategorySubmitting(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryDelete) return;
    if (!canEdit) {
      toast({
        title: strings.common.notAllowed,
        description: strings.system.noAccessDesc,
        variant: "destructive",
      });
      return;
    }

    setCategorySubmitting(true);
    try {
      await riskApi.deleteCategory(categoryDelete.id);
      toast({ title: strings.system.categoryDeleted });
      setCategoryDelete(null);
      await refreshCategories();
    } catch (err) {
      toast({
        title: strings.system.categoryDeleteFailed,
        description:
          err instanceof Error ? err.message : strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setCategorySubmitting(false);
    }
  };

  const setThreshold = (key: "low" | "medium" | "high", value: number) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            riskMatrixThresholds: {
              ...prev.riskMatrixThresholds,
              [key]: value,
            },
          }
        : prev
    );
  };

  const save = async () => {
    if (!settings) return;
    if (!canEdit) {
      toast({
        title: strings.common.notAllowed,
        description: strings.system.noAccessDesc,
        variant: "destructive",
      });
      return;
    }

    const { low, medium, high } = settings.riskMatrixThresholds;
    const values = [low, medium, high];
    if (!values.every((v) => Number.isFinite(v) && v > 0)) {
      toast({
        title: strings.system.invalidThresholdsTitle,
        description: strings.system.invalidThresholdsDesc,
        variant: "destructive",
      });
      return;
    }
    if (!(low < medium && medium < high)) {
      toast({
        title: strings.system.invalidOrderTitle,
        description: strings.system.invalidOrderDesc,
        variant: "destructive",
      });
      return;
    }
    if (
      !Number.isFinite(settings.autoAssessmentReminder) ||
      settings.autoAssessmentReminder < 0
    ) {
      toast({
        title: strings.system.invalidReminderTitle,
        description: strings.system.invalidReminderDesc,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await userApi.updateSystemSettings(settings);
      toast({ title: strings.system.saved });
      await refresh();
    } catch {
      toast({
        title: strings.system.saveFailedTitle,
        description: strings.common.pleaseTryAgain,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!settings) {
    return (
      <div className="space-y-6 animate-in">
        <h1
          className={cn(
            "text-2xl font-bold",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {strings.system.title}
        </h1>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {strings.system.noSettings}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.system.title}</h1>
          <p className="text-muted-foreground">{strings.system.subtitle}</p>
        </div>
        {canEdit && (
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Save className="h-4 w-4 me-2" />
            )}
            {strings.actions.save}
          </Button>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.system.thresholdsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {strings.system.thresholdsHelp}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="low">{strings.system.lowMax}</Label>
              <Input
                id="low"
                type="number"
                value={settings.riskMatrixThresholds.low}
                onChange={(e) => setThreshold("low", Number(e.target.value))}
                disabled={!canEdit}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medium">{strings.system.mediumMax}</Label>
              <Input
                id="medium"
                type="number"
                value={settings.riskMatrixThresholds.medium}
                onChange={(e) => setThreshold("medium", Number(e.target.value))}
                disabled={!canEdit}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="high">{strings.system.highMax}</Label>
              <Input
                id="high"
                type="number"
                value={settings.riskMatrixThresholds.high}
                onChange={(e) => setThreshold("high", Number(e.target.value))}
                disabled={!canEdit}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.system.notificationsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div
            className={cn(
              "flex items-center justify-between gap-4",
              isRTL ? "flex-row-reverse" : ""
            )}
          >
            <div className={cn(isRTL ? "text-right" : "text-left")}>
              <p className="font-medium">
                {strings.system.enableNotifications}
              </p>
              <p className="text-sm text-muted-foreground">
                {strings.system.notificationsHelp}
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) =>
                setSettings((prev) =>
                  prev ? { ...prev, notifications: checked } : prev
                )
              }
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder">{strings.system.reminderDays}</Label>
            <Input
              id="reminder"
              type="number"
              value={settings.autoAssessmentReminder}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        autoAssessmentReminder: Number(e.target.value),
                      }
                    : prev
                )
              }
              disabled={!canEdit}
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.system.demoDataTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {strings.system.demoDataHelp}
          </p>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="Import demo data JSON"
            title="Import demo data JSON"
            onChange={onImportFileSelected}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={exportData} disabled={!canEdit}>
              <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {strings.system.exportJson}
            </Button>
            <Button
              variant="outline"
              onClick={requestImport}
              disabled={!canEdit}
            >
              <Upload className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {strings.system.importJson}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!canEdit}>
                  <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {strings.system.clearAllData}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {strings.system.clearDialogTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {strings.system.clearDialogDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {strings.actions.cancel}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={clearData}>
                    {strings.actions.clear}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{strings.system.categoriesTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "flex items-center justify-between gap-3",
              isRTL ? "flex-row-reverse" : ""
            )}
          >
            <p className="text-sm text-muted-foreground">
              {strings.system.categoriesSubtitle}
            </p>
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" onClick={openCreateCategory}>
                    {strings.system.categoryAdd}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {strings.system.categoryAddTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {strings.system.categoryAddDesc}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="grid gap-3 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="cat-name">
                        {strings.system.categoryName}
                      </Label>
                      <Input
                        id="cat-name"
                        value={categoryDraft.name}
                        onChange={(e) =>
                          setCategoryDraft((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-code">
                        {strings.system.categoryCode}
                      </Label>
                      <Input
                        id="cat-code"
                        value={categoryDraft.code}
                        onChange={(e) =>
                          setCategoryDraft((p) => ({
                            ...p,
                            code: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-desc">
                        {strings.system.categoryDescription}
                      </Label>
                      <Input
                        id="cat-desc"
                        value={categoryDraft.description}
                        onChange={(e) =>
                          setCategoryDraft((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="cat-color">
                          {strings.system.categoryColor}
                        </Label>
                        <Input
                          id="cat-color"
                          value={categoryDraft.color}
                          onChange={(e) =>
                            setCategoryDraft((p) => ({
                              ...p,
                              color: e.target.value,
                            }))
                          }
                          placeholder="#3B82F6"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cat-icon">
                          {strings.system.categoryIcon}
                        </Label>
                        <Input
                          id="cat-icon"
                          value={categoryDraft.icon}
                          onChange={(e) =>
                            setCategoryDraft((p) => ({
                              ...p,
                              icon: e.target.value,
                            }))
                          }
                          placeholder="shield"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cat-order">
                          {strings.system.categoryOrder}
                        </Label>
                        <Input
                          id="cat-order"
                          type="number"
                          value={categoryDraft.sort_order}
                          onChange={(e) =>
                            setCategoryDraft((p) => ({
                              ...p,
                              sort_order: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {strings.actions.cancel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={submitCategory}
                      disabled={categorySubmitting}
                    >
                      {strings.system.categorySave}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {categoriesLoading ? (
            <p className="text-sm text-muted-foreground">
              {strings.system.categoriesLoading}
            </p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {strings.system.categoriesEmpty}
            </p>
          ) : (
            <div className="grid gap-2">
              {categories
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border p-3",
                      isRTL ? "flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "flex-1",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <p className="font-medium">
                        {c.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({c.code})
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {c.description || "—"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex gap-2",
                        isRTL ? "flex-row-reverse" : ""
                      )}
                    >
                      {canEdit && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => openEditCategory(c)}
                            >
                              {strings.actions.edit}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {strings.system.categoryEditTitle}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {strings.system.categoryEditDesc}
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="grid gap-3 py-2">
                              <div className="space-y-2">
                                <Label htmlFor="cat-name-edit">
                                  {strings.system.categoryName}
                                </Label>
                                <Input
                                  id="cat-name-edit"
                                  value={categoryDraft.name}
                                  onChange={(e) =>
                                    setCategoryDraft((p) => ({
                                      ...p,
                                      name: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cat-code-edit">
                                  {strings.system.categoryCode}
                                </Label>
                                <Input
                                  id="cat-code-edit"
                                  value={categoryDraft.code}
                                  onChange={(e) =>
                                    setCategoryDraft((p) => ({
                                      ...p,
                                      code: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cat-desc-edit">
                                  {strings.system.categoryDescription}
                                </Label>
                                <Input
                                  id="cat-desc-edit"
                                  value={categoryDraft.description}
                                  onChange={(e) =>
                                    setCategoryDraft((p) => ({
                                      ...p,
                                      description: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor="cat-color-edit">
                                    {strings.system.categoryColor}
                                  </Label>
                                  <Input
                                    id="cat-color-edit"
                                    value={categoryDraft.color}
                                    onChange={(e) =>
                                      setCategoryDraft((p) => ({
                                        ...p,
                                        color: e.target.value,
                                      }))
                                    }
                                    placeholder="#3B82F6"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cat-icon-edit">
                                    {strings.system.categoryIcon}
                                  </Label>
                                  <Input
                                    id="cat-icon-edit"
                                    value={categoryDraft.icon}
                                    onChange={(e) =>
                                      setCategoryDraft((p) => ({
                                        ...p,
                                        icon: e.target.value,
                                      }))
                                    }
                                    placeholder="shield"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cat-order-edit">
                                    {strings.system.categoryOrder}
                                  </Label>
                                  <Input
                                    id="cat-order-edit"
                                    type="number"
                                    value={categoryDraft.sort_order}
                                    onChange={(e) =>
                                      setCategoryDraft((p) => ({
                                        ...p,
                                        sort_order: Number(e.target.value),
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setEditingCategory(null)}
                              >
                                {strings.actions.cancel}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={submitCategory}
                                disabled={categorySubmitting}
                              >
                                {strings.system.categorySave}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {canEdit && (
                        <AlertDialog
                          open={categoryDelete?.id === c.id}
                          onOpenChange={(open) =>
                            setCategoryDelete(open ? c : null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              onClick={() => setCategoryDelete(c)}
                            >
                              {strings.actions.delete}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {strings.system.categoryDeleteTitle}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {strings.system.categoryDeleteDesc.replace(
                                  "{name}",
                                  c.name
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {strings.actions.cancel}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={confirmDeleteCategory}
                                disabled={categorySubmitting}
                              >
                                {strings.actions.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
