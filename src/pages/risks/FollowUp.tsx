import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/Loader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { riskApi, assessmentApi, userApi } from '@/api';
import type { Risk, Assessment } from '@/types';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { CalendarClock, ArrowRight } from 'lucide-react';

const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

const FollowUp: React.FC = () => {
  const { strings, isRTL } = useI18n();

  const getLevelLabel = (levelLabel: string) =>
    (strings.risks.levels as Record<string, string> | undefined)?.[levelLabel] ?? levelLabel;

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
    load();
  }, []);

  if (loading) return <PageLoader text={strings.common.loading} />;

  const lastAssessmentByRisk = (() => {
    const map = new Map<string, string>();
    for (const a of assessments) {
      const prev = map.get(a.riskId);
      if (!prev || new Date(a.date) > new Date(prev)) map.set(a.riskId, a.date);
    }
    return map;
  })();

  const now = new Date();

  const rows = risks
    .map(r => {
      const last = lastAssessmentByRisk.get(r.id) ?? r.updatedAt ?? r.createdAt;
      const lastDate = new Date(last);
      const due = new Date(lastDate);
      due.setDate(due.getDate() + reminderDays);
      const overdueDays = daysBetween(due, now);
      return {
        risk: r,
        lastDate,
        dueDate: due,
        overdueDays,
        isOverdue: due.getTime() <= now.getTime(),
      };
    })
    .sort((a, b) => {
      // Overdue first, then by most overdue, then by score
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.overdueDays !== b.overdueDays) return b.overdueDays - a.overdueDays;
      return b.risk.score - a.risk.score;
    });

  const overdue = rows.filter(r => r.isOverdue);
  const dueSoon = rows.filter(r => !r.isOverdue && daysBetween(now, r.dueDate) <= 14);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">{strings.followup.title}</h1>
        <p className="text-muted-foreground">{strings.followup.subtitle.replace('{days}', String(reminderDays))}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{strings.followup.overdue}</p>
            <p className="text-3xl font-bold mt-1 text-status-critical">{overdue.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{strings.followup.dueSoon}</p>
            <p className="text-3xl font-bold mt-1">{dueSoon.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{strings.followup.totalTracked}</p>
            <p className="text-3xl font-bold mt-1">{rows.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">{strings.followup.listTitle}</CardTitle>
          <CardDescription>{strings.followup.listDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{strings.followup.noRisks}</p>
          ) : (
            rows.map(({ risk, lastDate, dueDate, overdueDays, isOverdue }) => (
              <div
                key={risk.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border',
                  isOverdue ? 'border-status-critical/30 bg-status-critical/5' : 'border-border bg-muted/10'
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn('mt-0.5', isOverdue ? 'text-status-critical' : 'text-muted-foreground')}>
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{risk.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {risk.id} • {risk.owner} • {strings.followup.lastAssessment}:{' '}
                      {lastDate.toLocaleDateString()} • {strings.followup.due}:{' '}
                      {dueDate.toLocaleDateString()}
                    </p>
                    <div className={cn('mt-1 text-xs', isOverdue ? 'text-status-critical' : 'text-muted-foreground')}>
                      {isOverdue
                        ? strings.followup.overdueBy.replace('{days}', String(Math.max(0, overdueDays)))
                        : strings.followup.dueIn.replace('{days}', String(Math.max(0, daysBetween(now, dueDate)) ))}
                    </div>
                  </div>
                </div>

                <div className={cn('flex items-center gap-2', isRTL ? 'sm:flex-row-reverse' : '')}>
                  <StatusBadge status={risk.level}>{getLevelLabel(risk.level)}</StatusBadge>
                  <Badge variant="secondary">{strings.followup.score}: {risk.score}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/assessments/new?riskId=${encodeURIComponent(risk.id)}`}>{strings.followup.assessNow}</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/risks/${risk.id}`}>
                      {strings.followup.viewRisk}
                      <ArrowRight className={cn('h-4 w-4', isRTL ? 'mr-2' : 'ml-2')} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUp;
