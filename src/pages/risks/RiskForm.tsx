import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PageLoader } from '@/components/common/Loader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { assessmentApi, riskApi, userApi } from '@/api';
import { RISK_CATEGORIES, RISK_STATUSES, getRiskLevel } from '@/utils/constants';
import type { RiskCategory, RiskStatus } from '@/utils/constants';
import type { Risk, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { mapBackendCategoryToFrontend } from '@/api/adapters';
import { useAuth } from '@/auth/authContext';

const RiskForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { strings, isRTL } = useI18n();
  const { user, can } = useAuth();
  const isEdit = !!id;

  const getCategoryLabel = (category: string) =>
    (strings.risks.categories as Record<string, string> | undefined)?.[category] ?? category;
  const getStatusLabel = (status: string) =>
    (strings.risks.statuses as Record<string, string> | undefined)?.[status] ?? status;
  const getLevelLabel = (levelLabel: string) =>
    (strings.risks.levels as Record<string, string> | undefined)?.[levelLabel] ?? levelLabel;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([...RISK_CATEGORIES]);
  const [availableOwners, setAvailableOwners] = useState<User[]>([]);
  const [ownerId, setOwnerId] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as string,
    owner: '',
    status: 'Open' as RiskStatus,
    likelihood: 3,
    impact: 3,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
    if (isEdit && id) {
      loadRisk(id);
      return;
    }

    // Default owner to current user for new risks.
    if (user?.id) {
      const numericId = parseInt(String(user.id).replace(/\D/g, ''), 10);
      if (!Number.isNaN(numericId)) setOwnerId(numericId);
      setFormData(prev => ({ ...prev, owner: user.name || prev.owner }));
    }
  }, [id, isEdit, user]);

  useEffect(() => {
    const loadOwners = async () => {
      if (!can('canManageUsers')) return;
      try {
        const users = await userApi.getUsers({ perPage: 100 });
        setAvailableOwners(users);
      } catch {
        // Ignore; fallback to current user only.
      }
    };

    void loadOwners();
  }, [can]);

  const loadCategories = async () => {
    try {
      const data = await riskApi.getCategories();
      const mapped = data
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((c) => mapBackendCategoryToFrontend(c.code || c.name || ''))
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

      const unique = Array.from(new Set(mapped));
      if (unique.length > 0) setCategories(unique);
    } catch {
      // Keep fallback categories
    }
  };

  const loadRisk = async (riskId: string) => {
    try {
      const risk = await riskApi.getById(riskId);
      if (risk) {
        if (risk._ownerId) setOwnerId(risk._ownerId);
        setFormData({
          title: risk.title,
          description: risk.description,
          category: risk.category,
          owner: risk.owner,
          status: risk.status,
          likelihood: risk.likelihood,
          impact: risk.impact,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = strings.risks.form.requiredTitle;
    if (!formData.description.trim()) newErrors.description = strings.risks.form.requiredDescription;
    if (!formData.category) newErrors.category = strings.risks.form.requiredCategory;
    if (!ownerId && !formData.owner.trim()) newErrors.owner = strings.risks.form.requiredOwner;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEdit && id) {
        await riskApi.update(id, formData as Partial<Risk>);
        toast({ title: strings.risks.form.toastUpdatedTitle, description: strings.risks.form.toastUpdatedDesc });
      } else {
        const newRisk = await riskApi.create({
          ...formData,
          ownerId,
          category: formData.category as RiskCategory,
          status: formData.status,
        });

        // Create an initial inherent assessment so risk score/level is correct.
        try {
          await assessmentApi.create({
            riskId: newRisk.id,
            likelihood: formData.likelihood,
            impact: formData.impact,
            notes: strings.risks.form.stageCreatedNote,
            type: 'inherent',
          });
        } catch {
          // Risk created successfully; assessment can be added later.
        }
        toast({
          title: strings.risks.form.toastCreatedTitle,
          description: `${newRisk.id} ${strings.risks.form.toastCreatedDescSuffix}`,
        });
      }
      navigate('/risks');
    } catch (error) {
      toast({ title: strings.risks.toastErrorTitle, description: strings.risks.form.toastSaveFailed, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const score = formData.likelihood * formData.impact;
  const level = getRiskLevel(score);

  if (loading) return <PageLoader text={strings.risks.form.loadingRisk} />;

  const levelDisplay = getLevelLabel(level.label);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      <Button variant="ghost" className="w-fit" onClick={() => navigate('/risks')}>
        <ArrowLeft className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
        {strings.risks.form.backToRiskRegister}
      </Button>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{isEdit ? strings.risks.form.editRiskTitle : strings.risks.form.createRiskTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {strings.table.title} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={strings.risks.form.placeholderTitle}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {strings.table.description} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={strings.risks.form.placeholderDescription}
                rows={4}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Category & Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  {strings.table.category} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                    <SelectValue placeholder={strings.risks.form.placeholderCategory} />
                  </SelectTrigger>
                  <SelectContent>
                      {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">
                  {strings.table.owner} <span className="text-destructive">*</span>
                </Label>
                {can('canManageUsers') ? (
                  <Select
                    value={ownerId ? String(ownerId) : ''}
                    onValueChange={val => {
                      const numericId = parseInt(val, 10);
                      setOwnerId(Number.isNaN(numericId) ? undefined : numericId);
                      const match = availableOwners.find(u => u._backendId === numericId);
                      if (match) setFormData(prev => ({ ...prev, owner: match.name }));
                    }}
                  >
                    <SelectTrigger className={errors.owner ? 'border-destructive' : ''}>
                      <SelectValue placeholder={strings.risks.form.placeholderOwner} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOwners.map(u => (
                        <SelectItem key={u.id} value={String(u._backendId ?? u.id)}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="owner"
                    value={formData.owner}
                    disabled
                    placeholder={strings.risks.form.placeholderOwner}
                    className={errors.owner ? 'border-destructive' : ''}
                  />
                )}
                {errors.owner && <p className="text-xs text-destructive">{errors.owner}</p>}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">{strings.table.status}</Label>
              <Select
                value={formData.status}
                onValueChange={val => setFormData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Risk Assessment */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <h3 className="font-medium">{strings.risks.form.assessmentTitle}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{strings.risks.form.likelihood}</Label>
                    <span className="text-2xl font-bold text-primary">{formData.likelihood}</span>
                  </div>
                  <Slider
                    value={[formData.likelihood]}
                    onValueChange={([val]) => setFormData(prev => ({ ...prev, likelihood: val }))}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div className={isRTL ? 'flex justify-between text-xs text-muted-foreground flex-row-reverse' : 'flex justify-between text-xs text-muted-foreground'}>
                    <span>{strings.risks.form.rare}</span>
                    <span>{strings.risks.form.almostCertain}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{strings.risks.form.impact}</Label>
                    <span className="text-2xl font-bold text-primary">{formData.impact}</span>
                  </div>
                  <Slider
                    value={[formData.impact]}
                    onValueChange={([val]) => setFormData(prev => ({ ...prev, impact: val }))}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div className={isRTL ? 'flex justify-between text-xs text-muted-foreground flex-row-reverse' : 'flex justify-between text-xs text-muted-foreground'}>
                    <span>{strings.risks.form.insignificant}</span>
                    <span>{strings.risks.form.catastrophic}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{strings.risks.form.scoreTitle}</p>
                  <p className="text-3xl font-bold">{score}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{strings.risks.form.levelTitle}</p>
                  <StatusBadge status={level.label} className="text-sm">
                    {levelDisplay}
                  </StatusBadge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/risks')}>
                {strings.actions.cancel}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className={isRTL ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
                    {strings.risks.form.saving}
                  </>
                ) : (
                  <>
                    <Save className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {isEdit ? strings.risks.form.updateRisk : strings.risks.form.createRisk}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskForm;
