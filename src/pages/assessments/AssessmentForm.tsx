import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { assessmentApi, riskApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { getRiskLevel } from '@/utils/constants';
import { useAuth } from '@/auth/authContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Risk } from '@/types';
import type { Assessment } from '@/types';
import { useI18n } from '@/i18n';

const AssessmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const riskId = searchParams.get('riskId');

  const { toast } = useToast();
  const { user } = useAuth();
  const { strings, isRTL } = useI18n();

  const getLevelLabel = (levelLabel: string) =>
    (strings.risks.levels as Record<string, string> | undefined)?.[levelLabel] ?? levelLabel;
  const getCategoryLabel = (category: string) =>
    (strings.risks.categories as Record<string, string> | undefined)?.[category] ?? category;
  const getStatusLabel = (status: string) =>
    (strings.risks.statuses as Record<string, string> | undefined)?.[status] ?? status;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [likelihood, setLikelihood] = useState<number>(3);
  const [impact, setImpact] = useState<number>(3);
  const [assessor, setAssessor] = useState<string>(user?.name || user?.email || '');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);

  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isLoadingSelectedRisk, setIsLoadingSelectedRisk] = useState(false);

  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (riskId) return;
      setIsLoadingRisks(true);
      try {
        const data = await riskApi.getAll();
        const ordered = [...data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        setRisks(ordered);
      } catch {
        toast({
          title: strings.assessments.failedToLoadRisksTitle,
          description: strings.common.pleaseTryAgain,
          variant: 'destructive',
        });
      } finally {
        setIsLoadingRisks(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskId]);

  useEffect(() => {
    const loadSelected = async () => {
      if (!riskId) {
        setSelectedRisk(null);
        return;
      }

      setIsLoadingSelectedRisk(true);
      try {
        const r = await riskApi.getById(riskId);
        if (!r) {
          toast({
            title: strings.assessments.riskNotFoundTitle,
            description: strings.assessments.riskNotFoundDesc,
            variant: 'destructive',
          });
          setSearchParams({});
          return;
        }
        setSelectedRisk(r);
      } catch {
        toast({
          title: strings.assessments.failedToLoadRisksTitle,
          description: strings.common.pleaseTryAgain,
          variant: 'destructive',
        });
      } finally {
        setIsLoadingSelectedRisk(false);
      }
    };

    void loadSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskId]);

  useEffect(() => {
    const loadRecentAssessments = async () => {
      if (!riskId) {
        setRecentAssessments([]);
        return;
      }

      setIsLoadingAssessments(true);
      try {
        const all = await assessmentApi.getByRiskId(riskId);
        const ordered = [...all].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentAssessments(ordered.slice(0, 5));
      } catch {
        // Non-blocking: user can still submit an assessment
        setRecentAssessments([]);
      } finally {
        setIsLoadingAssessments(false);
      }
    };

    void loadRecentAssessments();
  }, [riskId]);

  const score = useMemo(() => likelihood * impact, [likelihood, impact]);
  const level = useMemo(() => getRiskLevel(score).label, [score]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!riskId) {
      toast({
        title: strings.assessments.missingRiskIdTitle,
        description: strings.assessments.missingRiskIdDesc,
        variant: 'destructive',
      });
      return;
    }

    if (!assessor.trim()) {
      toast({
        title: strings.assessments.assessorRequiredTitle,
        description: strings.assessments.assessorRequiredDesc,
        variant: 'destructive',
      });
      return;
    }

    if (date > today) {
      toast({
        title: strings.assessments.invalidDateTitle,
        description: strings.assessments.invalidDateDesc,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await assessmentApi.create({
        riskId,
        likelihood,
        impact,
        assessor: assessor.trim(),
        date,
        notes,
      });

      toast({
        title: strings.assessments.createdTitle,
        description: `${strings.table.score}: ${score} (${getLevelLabel(level)})`,
      });

      navigate(`/risks/${riskId}`);
    } catch (error) {
      toast({
        title: strings.assessments.failedToCreateTitle,
        description: strings.common.pleaseTryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> {strings.actions.back}
      </Button>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            {strings.assessments.newTitle} {riskId && `${strings.assessments.forPrefix} ${riskId}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!riskId ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {strings.assessments.selectRiskHint}
              </p>

              {isLoadingRisks ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {strings.assessments.loadingRisks}
                </div>
              ) : risks.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{strings.assessments.noRisksYet}</p>
                  <Button onClick={() => navigate('/risks/new')}>{strings.assessments.createRisk}</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{strings.assessments.riskLabel}</Label>
                  <Select
                    value={''}
                    onValueChange={val => setSearchParams({ riskId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={strings.assessments.selectRiskPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {risks.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.id} — {r.title} ({r.owner})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                {isLoadingSelectedRisk ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> {strings.common.loading}
                  </div>
                ) : selectedRisk ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{selectedRisk.title}</p>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={selectedRisk.level}>{getLevelLabel(selectedRisk.level)}</StatusBadge>
                        <StatusBadge status={selectedRisk.status}>{getStatusLabel(selectedRisk.status)}</StatusBadge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        {strings.table.id}: <span className="text-foreground font-mono">{selectedRisk.id}</span>
                      </div>
                      <div>
                        {strings.table.owner}: <span className="text-foreground">{selectedRisk.owner}</span>
                      </div>
                      <div>
                        {strings.table.category}:{' '}
                        <span className="text-foreground">{getCategoryLabel(selectedRisk.category)}</span>
                      </div>
                      <div>
                        {strings.table.score}: <span className="text-foreground font-semibold">{selectedRisk.score}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{strings.assessments.selectRiskHint}</p>
                )}
              </div>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{strings.assessments.recentTitle}</CardTitle>
                    {riskId && (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/risks/${riskId}`}>{strings.assessments.viewAll}</Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingAssessments ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> {strings.common.loading}
                    </div>
                  ) : recentAssessments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{strings.assessments.noRecent}</p>
                  ) : (
                    <div className="space-y-2">
                      {recentAssessments.map(a => (
                        <div key={a.id} className="p-3 rounded-lg border border-border bg-muted/20">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {new Date(a.date).toLocaleDateString()}
                                <span className="text-muted-foreground"> • {strings.risks.details.byPrefix} {a.assessor}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {strings.risks.details.likelihoodLabel} {a.likelihood} • {strings.risks.details.impactLabel} {a.impact} • {strings.risks.details.scoreLabel} {a.score}
                              </p>
                            </div>
                            <StatusBadge status={a.level}>{getLevelLabel(a.level)}</StatusBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assessor">{strings.assessments.assessor}</Label>
                  <Input
                    id="assessor"
                    value={assessor}
                    onChange={e => setAssessor(e.target.value)}
                    placeholder={strings.assessments.assessorPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">{strings.assessments.date}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    max={today}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{strings.assessments.likelihood}</Label>
                    <span className="text-2xl font-bold text-primary">{likelihood}</span>
                  </div>
                  <Slider
                    value={[likelihood]}
                    onValueChange={([val]) => setLikelihood(val)}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div
                    className={
                      isRTL
                        ? 'flex justify-between text-xs text-muted-foreground flex-row-reverse'
                        : 'flex justify-between text-xs text-muted-foreground'
                    }
                  >
                    <span>{strings.assessments.rare}</span>
                    <span>{strings.assessments.almostCertain}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{strings.assessments.impact}</Label>
                    <span className="text-2xl font-bold text-primary">{impact}</span>
                  </div>
                  <Slider
                    value={[impact]}
                    onValueChange={([val]) => setImpact(val)}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div
                    className={
                      isRTL
                        ? 'flex justify-between text-xs text-muted-foreground flex-row-reverse'
                        : 'flex justify-between text-xs text-muted-foreground'
                    }
                  >
                    <span>{strings.assessments.insignificant}</span>
                    <span>{strings.assessments.catastrophic}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{likelihood}</p>
                  <p className="text-xs text-muted-foreground">{strings.assessments.likelihood}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{impact}</p>
                  <p className="text-xs text-muted-foreground">{strings.assessments.impact}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{score}</p>
                  <div className="mt-1 flex justify-center">
                    <StatusBadge status={level}>{getLevelLabel(level)}</StatusBadge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{strings.assessments.notes}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={strings.assessments.notesPlaceholder}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSaving}>
                  {strings.actions.cancel}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className={isRTL ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
                  ) : (
                    <Save className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                  )}
                  {strings.assessments.saveAssessment}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentForm;
