import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/Loader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/auth/authContext';
import { riskApi, assessmentApi, userApi } from '@/api';
import type { Risk, Assessment } from '@/types';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, Plus, ArrowRight, ClipboardCheck } from 'lucide-react';

const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

const RisksDashboard: React.FC = () => {
  const { can } = useAuth();
  const { strings, isRTL } = useI18n();

  const [loading, setLoading] = React.useState(true);
  const [risks, setRisks] = React.useState<Risk[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [reminderDays, setReminderDays] = React.useState<number>(90);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [r, a, settings] = await Promise.all([
          riskApi.getAll(),
          assessmentApi.getAll(),
          userApi.getSystemSettings(),
        ]);
        setRisks(r);
        setAssessments(a);
        setReminderDays(settings.autoAssessmentReminder ?? 90);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <PageLoader text={strings.common.loading} />;

  const criticalHigh = risks.filter(r => r.level === 'Critical' || r.level === 'High');
  const inProgress = risks.filter(r => r.status === 'Open' || r.status === 'Monitoring');
  const closed = risks.filter(r => r.status === 'Closed');

  const lastAssessmentByRisk = (() => {
    const map = new Map<string, string>();
    for (const a of assessments) {
      const prev = map.get(a.riskId);
      if (!prev || new Date(a.date) > new Date(prev)) map.set(a.riskId, a.date);
    }
    return map;
  })();

  const now = new Date();

  const followUpRows = risks.map(r => {
    const last = lastAssessmentByRisk.get(r.id) ?? r.updatedAt ?? r.createdAt;
    const lastDate = new Date(last);
    const dueDate = new Date(lastDate);
    dueDate.setDate(dueDate.getDate() + reminderDays);
    return {
      risk: r,
      dueDate,
      isOverdue: dueDate.getTime() <= now.getTime(),
      dueInDays: daysBetween(now, dueDate),
    };
  });

  const overdueCount = followUpRows.filter(x => x.isOverdue).length;
  const dueSoonCount = followUpRows.filter(x => !x.isOverdue && x.dueInDays <= 14).length;

  const topPriority = [...criticalHigh]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.risksDashboard.title}</h1>
          <p className="text-muted-foreground">{strings.risksDashboard.subtitle}</p>
        </div>
        <div className={cn('flex items-center gap-2', isRTL ? 'sm:flex-row-reverse' : '')}>
          {can('canCreate') && (
            <Button asChild>
              <Link to="/risks/new">
                <Plus className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
                {strings.actions.newRisk}
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/analysis/matrix">{strings.analysis.openMatrix}</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.risksDashboard.criticalHigh}</p>
                <p className="text-3xl font-bold mt-1 text-status-critical">{criticalHigh.length}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-status-critical" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.risksDashboard.inProgress}</p>
                <p className="text-3xl font-bold mt-1">{inProgress.length}</p>
              </div>
              <Clock className="h-6 w-6 text-status-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.risksDashboard.closed}</p>
                <p className="text-3xl font-bold mt-1">{closed.length}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-status-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.risksDashboard.overdue}</p>
                <p className={cn('text-3xl font-bold mt-1', overdueCount > 0 ? 'text-status-critical' : '')}>
                  {overdueCount}
                </p>
              </div>
              <ClipboardCheck className={cn('h-6 w-6', overdueCount > 0 ? 'text-status-critical' : 'text-muted-foreground')} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.risksDashboard.dueSoon}</p>
                <p className="text-3xl font-bold mt-1">{dueSoonCount}</p>
              </div>
              <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {overdueCount > 0 && (
        <Card className="glass-card border-status-warning/30 bg-status-warning/5">
          <CardHeader>
            <CardTitle className="text-base">{strings.risksDashboard.overdueCardTitle}</CardTitle>
            <CardDescription>
              {strings.risksDashboard.overdueCardDesc
                .replace('{count}', String(overdueCount))
                .replace('{days}', String(reminderDays))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/risks/followup">{strings.risksDashboard.viewFollowUp}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">{strings.risksDashboard.topRisksTitle}</CardTitle>
          <CardDescription>{strings.risksDashboard.topRisksDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {topPriority.length === 0 ? (
            <p className="text-sm text-muted-foreground">{strings.risksDashboard.noTopRisks}</p>
          ) : (
            <div className="space-y-3">
              {topPriority.map(r => (
                <div key={r.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{r.title}</p>
                        <StatusBadge status={r.level}>
                          {strings.risks.levels?.[r.level as keyof typeof strings.risks.levels] ?? r.level}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span>
                          {strings.table.id}: <span className="text-foreground">{r.id}</span>
                        </span>
                        <span>
                          {strings.table.owner}: <span className="text-foreground">{r.owner}</span>
                        </span>
                        <span>
                          {strings.table.score}: <span className="text-foreground font-semibold">{r.score}</span>
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="shrink-0">
                      <Link to={`/risks/${r.id}`}>
                        {strings.actions.viewAll}
                        <ArrowRight className={cn('h-4 w-4', isRTL ? 'mr-2' : 'ml-2')} />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={cn('mt-4 flex flex-wrap gap-2', isRTL ? 'justify-end' : 'justify-start')}>
            <Button asChild variant="ghost" size="sm">
              <Link to="/risks">{strings.risksDashboard.openRegister}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/risks/followup">{strings.risksDashboard.viewFollowUp}</Link>
            </Button>
            <Badge variant="secondary">{strings.risksDashboard.total}: {risks.length}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RisksDashboard;
