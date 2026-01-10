import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoader } from '@/components/common/Loader';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/authContext';
import { bcpApi } from '@/api';
import type { BCPService } from '@/types';
import { Plus, Pencil, Trash2, Loader2, Clock, User, Boxes } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

type ServiceDraft = Omit<BCPService, 'id'>;

const emptyDraft = (): ServiceDraft => ({
  name: '',
  criticality: 'Medium',
  rto: '',
  rpo: '',
  dependencies: [],
  owner: '',
});

const BCPServices: React.FC = () => {
  const { toast } = useToast();
  const { can } = useAuth();
  const { strings, isRTL } = useI18n();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<BCPService[]>([]);
  const [search, setSearch] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [editing, setEditing] = useState<BCPService | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft());
  const [depsText, setDepsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [toDelete, setToDelete] = useState<BCPService | null>(null);

  const refresh = async () => {
    const data = await bcpApi.getServices();
    setServices(data);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await refresh();
      } catch {
        toast({
          title: strings.bcp.failedToLoadServices,
          description: strings.common.pleaseTryAgain,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      s.criticality.toLowerCase().includes(q),
    );
  }, [services, search]);

  const openAdd = () => {
    setDialogMode('add');
    setEditing(null);
    setDraft(emptyDraft());
    setDepsText('');
    setIsDialogOpen(true);
  };

  const openEdit = (svc: BCPService) => {
    setDialogMode('edit');
    setEditing(svc);
    setDraft({
      name: svc.name,
      criticality: svc.criticality,
      rto: svc.rto,
      rpo: svc.rpo,
      dependencies: svc.dependencies,
      owner: svc.owner,
    });
    setDepsText(svc.dependencies.join(', '));
    setIsDialogOpen(true);
  };

  const openView = (svc: BCPService) => {
    setDialogMode('view');
    setEditing(svc);
    setDraft({
      name: svc.name,
      criticality: svc.criticality,
      rto: svc.rto,
      rpo: svc.rpo,
      dependencies: svc.dependencies,
      owner: svc.owner,
    });
    setDepsText(svc.dependencies.join(', '));
    setIsDialogOpen(true);
  };

  const parseDependencies = (text: string) =>
    text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const save = async () => {
    if (dialogMode === 'view') {
      setIsDialogOpen(false);
      return;
    }
    if (!draft.name.trim() || !draft.owner.trim() || !draft.rto.trim() || !draft.rpo.trim()) {
      toast({
        title: strings.bcp.missingFieldsTitle,
        description: strings.bcp.missingFieldsDesc,
        variant: 'destructive',
      });
      return;
    }

    if (editing) {
      if (!can('canEdit')) {
        toast({ title: strings.common.notAllowed, description: strings.bcp.noPermissionEdit, variant: 'destructive' });
        return;
      }
    } else {
      if (!can('canCreate')) {
        toast({ title: strings.common.notAllowed, description: strings.bcp.noPermissionCreate, variant: 'destructive' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const deps = parseDependencies(depsText);
      if (editing) {
        await bcpApi.updateService(editing.id, { ...draft, dependencies: deps });
        toast({ title: strings.bcp.serviceUpdated });
      } else {
        await bcpApi.createService({ ...draft, dependencies: deps });
        toast({ title: strings.bcp.serviceCreated });
      }
      setIsDialogOpen(false);
      await refresh();
    } catch {
      toast({ title: strings.bcp.saveFailedTitle, description: strings.common.pleaseTryAgain, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    if (!can('canDelete')) {
      toast({ title: strings.common.notAllowed, description: strings.bcp.noPermissionDelete, variant: 'destructive' });
      return;
    }
    try {
      await bcpApi.deleteService(toDelete.id);
      toast({ title: strings.bcp.serviceDeleted });
      setToDelete(null);
      await refresh();
    } catch {
      toast({ title: strings.bcp.deleteFailedTitle, description: strings.common.pleaseTryAgain, variant: 'destructive' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.bcp.servicesTitle}</h1>
          <p className="text-sm text-muted-foreground">{strings.bcp.servicesSubtitle}</p>
        </div>

        <div className={cn('flex gap-2', isRTL ? 'sm:flex-row-reverse' : '')}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={strings.bcp.searchPlaceholder}
            className="sm:w-[260px]"
          />
          {can('canCreate') && (
            <Button onClick={openAdd}>
              <Plus className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{strings.actions.add}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{strings.bcp.noServicesFound}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(svc => (
            <Card key={svc.id} className="glass-card">
              <CardContent className="p-6">
                <div className="relative">
                  <div className={cn('absolute top-0', isRTL ? 'right-0' : 'left-0')}>
                    <StatusBadge status={svc.criticality}>
                      {svc.criticality === 'Critical'
                        ? strings.bcp.criticalityCritical
                        : svc.criticality === 'High'
                          ? strings.bcp.criticalityHigh
                          : svc.criticality === 'Medium'
                            ? strings.bcp.criticalityMedium
                            : strings.bcp.criticalityLow}
                    </StatusBadge>
                  </div>

                  {(can('canEdit') || can('canDelete')) && (
                    <div className={cn('absolute top-0 flex items-center gap-1', isRTL ? 'left-0' : 'right-0')}>
                      {can('canEdit') && (
                        <Button size="icon" variant="ghost" onClick={() => openEdit(svc)} aria-label={strings.actions.edit}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {can('canDelete') && (
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(svc)} aria-label={strings.actions.delete}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-center px-12">
                    <p className="text-base font-semibold leading-snug">{svc.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{strings.bcp.serviceCardHint}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">RPO</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{svc.rpo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">RTO</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{svc.rto}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className={cn('flex items-center justify-between gap-3', isRTL ? 'flex-row-reverse' : '')}>
                    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', isRTL ? 'flex-row-reverse' : '')}>
                      <User className="h-4 w-4" />
                      <span>{strings.bcp.ownerPrefix}</span>
                    </div>
                    <span className={cn('text-sm font-medium truncate', isRTL ? 'text-left' : 'text-right')}>{svc.owner}</span>
                  </div>

                  <div className={cn('flex items-center justify-between gap-3', isRTL ? 'flex-row-reverse' : '')}>
                    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', isRTL ? 'flex-row-reverse' : '')}>
                      <Boxes className="h-4 w-4" />
                      <span>{strings.bcp.depsPrefix}</span>
                    </div>
                    <span className={cn('text-sm font-medium', isRTL ? 'text-left' : 'text-right')}>
                      {strings.bcp.depsCount.replace('{count}', String(svc.dependencies.length))}
                    </span>
                  </div>
                </div>

                <Button variant="secondary" className="w-full mt-6" onClick={() => openView(svc)}>
                  {strings.bcp.viewDetails}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view'
                ? strings.bcp.serviceDetailsTitle
                : editing
                  ? strings.bcp.editService
                  : strings.bcp.addService}
            </DialogTitle>
            <DialogDescription>{strings.bcp.dialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{strings.bcp.serviceName}</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                placeholder={strings.bcp.enterServiceName}
                disabled={dialogMode === 'view' || isSaving}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{strings.bcp.criticality}</Label>
                <Select
                  value={draft.criticality}
                  onValueChange={v => setDraft(prev => ({ ...prev, criticality: v as ServiceDraft['criticality'] }))}
                  disabled={dialogMode === 'view' || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">{strings.bcp.criticalityCritical}</SelectItem>
                    <SelectItem value="High">{strings.bcp.criticalityHigh}</SelectItem>
                    <SelectItem value="Medium">{strings.bcp.criticalityMedium}</SelectItem>
                    <SelectItem value="Low">{strings.bcp.criticalityLow}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">{strings.bcp.owner}</Label>
                <Input
                  id="owner"
                  value={draft.owner}
                  onChange={e => setDraft(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder={strings.bcp.enterOwner}
                  disabled={dialogMode === 'view' || isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rto">RTO</Label>
                <Input
                  id="rto"
                  value={draft.rto}
                  onChange={e => setDraft(prev => ({ ...prev, rto: e.target.value }))}
                  placeholder={strings.bcp.rtoPlaceholder}
                  disabled={dialogMode === 'view' || isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpo">RPO</Label>
                <Input
                  id="rpo"
                  value={draft.rpo}
                  onChange={e => setDraft(prev => ({ ...prev, rpo: e.target.value }))}
                  placeholder={strings.bcp.rpoPlaceholder}
                  disabled={dialogMode === 'view' || isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deps">{strings.bcp.dependenciesLabel}</Label>
              <Input
                id="deps"
                value={depsText}
                onChange={e => setDepsText(e.target.value)}
                placeholder={strings.bcp.dependenciesPlaceholder}
                disabled={dialogMode === 'view' || isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              {dialogMode === 'view' ? strings.actions.back : strings.actions.cancel}
            </Button>
            {dialogMode !== 'view' && (
              <Button onClick={save} disabled={isSaving}>
                {isSaving ? <Loader2 className={isRTL ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} /> : null}
                {strings.actions.save}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => (!open ? setToDelete(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{strings.bcp.deleteServiceTitle}</AlertDialogTitle>
            <AlertDialogDescription>{strings.bcp.deleteServiceDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>{strings.actions.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BCPServices;
