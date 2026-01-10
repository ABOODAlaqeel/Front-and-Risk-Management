import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/Loader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { riskApi, assessmentApi } from '@/api';
import type { Risk, Assessment } from '@/types';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { ArrowRight, BarChart3, Grid3X3, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

type LevelKey = 'Low' | 'Medium' | 'High' | 'Critical' | 'Other';

const levelOrder: LevelKey[] = ['Critical', 'High', 'Medium', 'Low', 'Other'];
const isKnownLevel = (value: string): value is Exclude<LevelKey, 'Other'> =>
  value === 'Low' || value === 'Medium' || value === 'High' || value === 'Critical';

const levelToColorClass = (level: string): string => {
  if (level === 'Critical') return 'text-status-critical';
  if (level === 'High') return 'text-status-high';
  if (level === 'Medium') return 'text-status-medium';
  if (level === 'Low') return 'text-status-low';
  return 'text-muted-foreground';
};

const levelToBarColor = (level: LevelKey) => {
  if (level === 'Critical') return 'hsl(var(--status-critical))';
  if (level === 'High') return 'hsl(var(--status-high))';
  if (level === 'Medium') return 'hsl(var(--status-medium))';
  if (level === 'Low') return 'hsl(var(--status-low))';
  return 'hsl(var(--muted-foreground))';
};

const AnalysisDashboard: React.FC = () => {
  const { strings, isRTL } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [risks, setRisks] = React.useState<Risk[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [r, a] = await Promise.all([riskApi.getAll(), assessmentApi.getAll()]);
        setRisks(r);
        setAssessments(a);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <PageLoader text={strings.common.loading} />;

  const levelLabels = (strings.risks.levels as Record<string, string> | undefined) ?? {};
  const categoryLabels = (strings.risks.categories as Record<string, string> | undefined) ?? {};
  const getLevelLabel = (levelLabel: string) =>
    levelLabels[levelLabel] ?? (levelLabel === 'Other' ? strings.analysis.otherLevel : levelLabel);
  const getCategoryLabel = (category: string) => categoryLabels[category] ?? category;

  const byLevel = risks.reduce<Record<LevelKey, number>>(
    (acc, r) => {
      const key: LevelKey = isKnownLevel(r.level) ? r.level : 'Other';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0, Other: 0 }
  );

  const levelChartData = levelOrder
    .filter(k => byLevel[k] > 0)
    .map(level => ({ level, label: getLevelLabel(level), count: byLevel[level] }));

  const categoryChartData = (() => {
    const map = new Map<string, number>();
    for (const r of risks) map.set(r.category, (map.get(r.category) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, label: getCategoryLabel(category), count }))
      .sort((a, b) => b.count - a.count);
  })();

  const critical = risks
    .filter(r => r.level === 'Critical' || r.level === 'High')
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const assessmentCountByRisk = (() => {
    const map = new Map<string, number>();
    for (const a of assessments) map.set(a.riskId, (map.get(a.riskId) ?? 0) + 1);
    return map;
  })();

  const leastAssessed = [...risks]
    .sort((a, b) => (assessmentCountByRisk.get(a.id) ?? 0) - (assessmentCountByRisk.get(b.id) ?? 0))
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{strings.analysis.dashboardTitle}</h1>
          <p className="text-muted-foreground">{strings.analysis.dashboardSubtitle}</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/analysis/matrix">
            <Grid3X3 className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
            {strings.analysis.openMatrix}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.analysis.totalRisks}</p>
                <p className="text-3xl font-bold mt-1">{risks.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Badge variant="secondary">{strings.analysis.updatedFromRegister}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.analysis.highPriority}</p>
                <p className="text-3xl font-bold mt-1 text-status-critical">{critical.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-status-critical/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-status-critical" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-status-critical">
              <span>{strings.analysis.needsFollowUp}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{strings.analysis.totalAssessments}</p>
                <p className="text-3xl font-bold mt-1">{assessments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">{strings.analysis.assessmentsStoredLocally}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">{strings.analysis.avgScore}</p>
              <p className="text-3xl font-bold mt-1">
                {risks.length > 0 ? (risks.reduce((acc, r) => acc + r.score, 0) / risks.length).toFixed(1) : '0.0'}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['Critical', 'High', 'Medium', 'Low'] as const)
                .filter(l => byLevel[l] > 0)
                .map(l => (
                  <Badge key={l} variant="outline" className={levelToColorClass(l)}>
                    {getLevelLabel(l)}: {byLevel[l]}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">{strings.analysis.risksByLevel}</CardTitle>
            <CardDescription>{strings.analysis.risksByLevelDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {levelChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{strings.analysis.noRisks}</p>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" name={strings.table.count} radius={[6, 6, 0, 0]}>
                      {levelChartData.map(d => (
                        <Cell key={d.level} fill={levelToBarColor(d.level as LevelKey)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">{strings.analysis.risksByCategory}</CardTitle>
            <CardDescription>{strings.analysis.risksByCategoryDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{strings.analysis.noRisks}</p>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={isRTL ? 140 : 120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" name={strings.table.count} fill={'hsl(var(--chart-1))'} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">{strings.analysis.topCriticalRisks}</CardTitle>
            <CardDescription>{strings.analysis.topCriticalRisksDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {critical.length === 0 ? (
              <p className="text-sm text-muted-foreground">{strings.analysis.noCriticalRisks}</p>
            ) : (
              critical.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.id} • {r.category} • {r.owner}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.level}>{getLevelLabel(r.level)}</StatusBadge>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/risks/${r.id}`}>
                        {strings.actions.viewAll}
                        <ArrowRight className={cn('h-4 w-4', isRTL ? 'mr-2 rotate-180' : 'ml-2')} />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">{strings.analysis.leastAssessed}</CardTitle>
            <CardDescription>{strings.analysis.leastAssessedDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {leastAssessed.length === 0 ? (
              <p className="text-sm text-muted-foreground">{strings.analysis.noRisks}</p>
            ) : (
              leastAssessed.map(r => {
                const count = assessmentCountByRisk.get(r.id) ?? 0;
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.id} • {strings.analysis.assessmentsCountLabel}: {count}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/assessments/new?riskId=${encodeURIComponent(r.id)}`}>{strings.analysis.addAssessment}</Link>
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
