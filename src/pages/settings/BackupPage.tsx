import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Database,
  FileUp,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { backupApi } from "@/api/backupApi";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BackupPage = () => {
  const { strings, isRTL } = useI18n();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await backupApi.exportBackup();
      toast({
        title: strings.backupPage.exportSuccessTitle,
        description: strings.backupPage.exportSuccessDesc,
      });
    } catch (error) {
      toast({
        title: strings.backupPage.exportFailedTitle,
        description: strings.backupPage.exportFailedDesc,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".db")) {
        toast({
          title: strings.backupPage.invalidFileTitle,
          description: strings.backupPage.invalidFileDesc,
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setShowImportConfirm(true);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      await backupApi.importBackup(selectedFile);
      toast({
        title: strings.backupPage.restoreSuccessTitle,
        description: strings.backupPage.restoreSuccessDesc,
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: strings.backupPage.restoreFailedTitle,
        description: strings.backupPage.restoreFailedDesc,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setShowImportConfirm(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {strings.backupPage.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            {strings.backupPage.subtitle}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Section */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Database className="h-6 w-6" />
              </div>
              <CardTitle>{strings.backupPage.exportTitle}</CardTitle>
            </div>
            <CardDescription>{strings.backupPage.exportDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-start gap-4">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {strings.backupPage.safeTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {strings.backupPage.safeDesc}
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2
                    className={`h-4 w-4 animate-spin ${
                      isRTL ? "ml-2" : "mr-2"
                    }`}
                  />
                  {strings.backupPage.exporting}
                </>
              ) : (
                <>
                  <Download className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {strings.backupPage.exportButton}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card className="border-destructive/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <FileUp className="h-6 w-6" />
              </div>
              <CardTitle>{strings.backupPage.importTitle}</CardTitle>
            </div>
            <CardDescription>{strings.backupPage.importDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{strings.backupPage.warningTitle}</AlertTitle>
              <AlertDescription>{strings.backupPage.warningDesc}</AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <label htmlFor="backup-upload" className="sr-only">
                {strings.backupPage.selectFile}
              </label>
              <input
                type="file"
                accept=".db"
                className="hidden"
                id="backup-upload"
                onChange={handleFileSelect}
                disabled={isImporting}
                title={strings.backupPage.selectFile}
              />
              <Button
                variant="outline"
                className="w-full border-dashed border-2 hover:bg-muted"
                disabled={isImporting}
                onClick={() =>
                  document.getElementById("backup-upload")?.click()
                }
              >
                <Upload className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {strings.backupPage.selectFile}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {strings.backupPage.confirmTitle}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                {strings.backupPage.confirmIntro}
                <span className="font-semibold block mt-1 p-2 bg-muted rounded border">
                  {selectedFile?.name}
                </span>
              </p>
              <p className="font-medium text-destructive">
                {strings.backupPage.confirmDesc}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportConfirm(false);
                setSelectedFile(null);
              }}
              disabled={isImporting}
            >
              {strings.actions.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2
                    className={`h-4 w-4 animate-spin ${
                      isRTL ? "ml-2" : "mr-2"
                    }`}
                  />
                  {strings.backupPage.restoring}
                </>
              ) : (
                strings.backupPage.restoreButton
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupPage;
