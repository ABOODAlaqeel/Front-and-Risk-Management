import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/common/Loader';
import { riskApi } from '@/api';
import type { Risk } from '@/types';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { getRiskLevel } from '@/utils/constants';
import { userApi } from '@/api';

const cellClassForScore = (score: number, thresholds: { low: number; medium: number; high: number }) => {
  let level = 'Low';
  if (score > thresholds.high) level = 'Critical';
  else if (score > thresholds.medium) level = 'High';
  else if (score > thresholds.low) level = 'Medium';
  // else remains Low
  if (level === 'Critical') return 'bg-status-critical/15 border-status-critical/40 hover:bg-status-critical/25';
  if (level === 'High') return 'bg-status-high/15 border-status-high/40 hover:bg-status-high/25';
  if (level === 'Medium') return 'bg-status-medium/15 border-status-medium/40 hover:bg-status-medium/25';
  return 'bg-status-low/15 border-status-low/40 hover:bg-status-low/25';
};

const RiskMatrixPage: React.FC = () => {
  const navigate = useNavigate();
  const { strings, isRTL } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [risks, setRisks] = React.useState<Risk[]>([]);
  const [thresholds, setThresholds] = React.useState<{ low: number; medium: number; high: number }>({ low: 5, medium: 12, high: 20 });

  // Group risks by likelihood-impact
  const matrixData = React.useMemo(() => {
    const map: Record<string, Risk[]> = {};
    for (const r of risks) {
      const key = `${r.likelihood}-${r.impact}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [risks]);

  React.useEffect(() => {
    const load = async () => {
      try {
        setRisks(await riskApi.getAll());
        const settings = await userApi.getSystemSettings();
        if (settings && settings.riskMatrixThresholds) {
          setThresholds(settings.riskMatrixThresholds as { low: number; medium: number; high: number });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <PageLoader text={strings.common.loading} />;

  const hasAnyRisks = risks.length > 0;

  const onCellClick = (likelihood: number, impact: number) => {
    const key = `${likelihood}-${impact}`;
    const items = matrixData[key] ?? [];
    if (items.length === 0) return;
    // Keep interaction minimal: open the highest-score risk in that cell.
    const top = [...items].sort((a, b) => b.score - a.score)[0];
    navigate(`/risks/${top.id}`);
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">{strings.analysis.matrixTitle}</h1>
        <p className="text-muted-foreground">{strings.analysis.matrixSubtitle}</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">{strings.analysis.matrixCardTitle}</CardTitle>
          <CardDescription>{strings.analysis.matrixCardDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAnyRisks && <p className="text-sm text-muted-foreground mb-4">{strings.analysis.noRisks}</p>}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Y label */}
              <div className={cn('flex items-center gap-4 mb-4', isRTL ? 'flex-row-reverse' : '')}>
                <div className="w-20 text-sm font-semibold text-muted-foreground text-center">{strings.analysis.likelihoodAxis}</div>
                <div className="flex-1">
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 5 }, (_, i) => 5 - i).map(likelihood => (
                      <div key={likelihood} className="contents">
                        {Array.from({ length: 5 }, (_, j) => j + 1).map(impact => {
                          const key = `${likelihood}-${impact}`;
                          const cellRisks = matrixData[key] ?? [];
                          const score = likelihood * impact;
                          const riskCountLabel = cellRisks.length === 1 ? strings.analysis.riskLabel : strings.analysis.risksLabel;
                          const ariaLabel = `${strings.analysis.likelihoodAxis}: ${likelihood}. ${strings.analysis.impactAxis}: ${impact}. ${cellRisks.length} ${riskCountLabel}.`;
                          return (
                            <button
                              key={key}
                              className={cn(
                                'relative aspect-square min-w-[64px] border-2 rounded-lg p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                cellRisks.length > 0 ? 'cursor-pointer' : 'opacity-70 cursor-default',
                                cellClassForScore(score, thresholds)
                              )}
                              onClick={() => onCellClick(likelihood, impact)}
                              disabled={cellRisks.length === 0}
                              type="button"
                              aria-label={ariaLabel}
                            >
                              {cellRisks.length > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold">{cellRisks.length}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {cellRisks.length === 1 ? strings.analysis.riskLabel : strings.analysis.risksLabel}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {cellRisks.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-xs text-muted-foreground">0</div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* X label */}
              <div className="flex items-center gap-4">
                <div className="w-20" />
                <div className="flex-1 text-center">
                  <div className="text-sm font-semibold text-muted-foreground">{strings.analysis.impactAxis}</div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-status-critical/20 border-2 border-status-critical" />
                  <span className="text-sm">{strings.analysis.legendCritical} (&gt;{thresholds.high})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-status-high/20 border-2 border-status-high" />
                  <span className="text-sm">{strings.analysis.legendHigh} ({thresholds.medium + 1}-{thresholds.high})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-status-medium/20 border-2 border-status-medium" />
                  <span className="text-sm">{strings.analysis.legendMedium} ({thresholds.low + 1}-{thresholds.medium})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-status-low/20 border-2 border-status-low" />
                  <span className="text-sm">{strings.analysis.legendLow} (≤{thresholds.low})</span>
                </div>
              </div>

              <div className={cn('mt-4 text-xs text-muted-foreground', isRTL ? 'text-right' : 'text-left')}>
                {strings.analysis.matrixHint}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMatrixPage;
