import React from 'react';
import { cn } from '@/lib/utils';
import { RISK_STAGES, type RiskStage } from '@/utils/constants';
import type { StageHistory } from '@/types';
import { Check, Clock, Circle } from 'lucide-react';
import { useI18n } from '@/i18n';

interface StageTimelineProps {
  stagesHistory: StageHistory[];
  className?: string;
}

export const StageTimeline: React.FC<StageTimelineProps> = ({ stagesHistory, className }) => {
  const { strings, isRTL } = useI18n();
  const completedStages = stagesHistory.map(s => s.stage);

  const getStageLabel = (stage: string) =>
    (strings.risks.stages as Record<string, string> | undefined)?.[stage] ?? stage;

  const getStageStatus = (stage: RiskStage): 'completed' | 'current' | 'pending' => {
    const stageIndex = RISK_STAGES.indexOf(stage);
    const lastCompletedIndex = RISK_STAGES.findIndex(
      s => !completedStages.includes(s)
    );

    if (completedStages.includes(stage)) return 'completed';
    if (lastCompletedIndex === stageIndex) return 'current';
    return 'pending';
  };

  const getStageData = (stage: RiskStage) => {
    return stagesHistory.find(s => s.stage === stage);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {RISK_STAGES.map((stage, index) => {
        const status = getStageStatus(stage);
        const data = getStageData(stage);

        return (
          <div key={stage} className={cn('flex gap-4', isRTL && 'flex-row-reverse')}>
            {/* Timeline Connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  status === 'completed' && 'bg-primary text-primary-foreground',
                  status === 'current' && 'bg-primary/20 text-primary border-2 border-primary',
                  status === 'pending' && 'bg-muted text-muted-foreground'
                )}
              >
                {status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : status === 'current' ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {index < RISK_STAGES.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[40px]',
                    status === 'completed' ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>

            {/* Stage Content */}
            <div className="flex-1 pb-4">
              <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                <h4
                  className={cn(
                    'font-medium',
                    status === 'pending' && 'text-muted-foreground'
                  )}
                >
                  {getStageLabel(stage)}
                </h4>
                {data && (
                  <span className="text-xs text-muted-foreground">{data.date}</span>
                )}
              </div>
              {data ? (
                <div className="mt-1">
                  <p className="text-sm text-muted-foreground">{data.notes}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {strings.risks.details.byPrefix} {data.updatedBy}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{strings.risks.details.pending}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StageTimeline;
