import { Thermometer, Droplets, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type HeatStatus = 'low' | 'moderate' | 'high' | 'extreme';

interface HeatRiskMeterProps {
  status: HeatStatus;
  tempC?: number | null;
  humidity?: number | null;
  lastCheckAt?: string | null;
  venueName?: string;
  compact?: boolean;
}

const statusConfig: Record<HeatStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: typeof Thermometer;
  progress: number;
}> = {
  low: {
    label: 'Low Risk',
    color: 'text-safe',
    bgColor: 'bg-safe/10',
    borderColor: 'border-safe/20',
    icon: ShieldCheck,
    progress: 25,
  },
  moderate: {
    label: 'Moderate Risk',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    icon: Thermometer,
    progress: 50,
  },
  high: {
    label: 'High Risk',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    icon: AlertTriangle,
    progress: 75,
  },
  extreme: {
    label: 'Extreme Risk',
    color: 'text-danger',
    bgColor: 'bg-danger/10',
    borderColor: 'border-danger/20',
    icon: Flame,
    progress: 100,
  },
};

const mitigationGuidance: Record<HeatStatus, string[]> = {
  low: [
    'Normal activity permitted',
    'Ensure adequate hydration available',
  ],
  moderate: [
    'Ensure pre-exercise hydration',
    'Schedule rest breaks every 20-30 minutes',
    'Provide shaded rest areas',
    'Monitor players for heat stress signs',
  ],
  high: [
    'Mandatory 10-minute rest breaks every 30 minutes',
    'Use ice towels and active cooling',
    'Reduce exercise intensity',
    'Ensure cold water immersion available',
    'Consider postponing non-essential activities',
  ],
  extreme: [
    'SUSPEND PLAY IMMEDIATELY',
    'Move all participants to cooled environment',
    'Implement emergency cooling protocols',
    'Monitor for heat illness symptoms',
    'Do not resume until conditions improve',
  ],
};

export const HeatRiskMeter = ({ 
  status, 
  tempC, 
  humidity, 
  lastCheckAt,
  venueName,
  compact = false 
}: HeatRiskMeterProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const guidance = mitigationGuidance[status];

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium',
        config.bgColor,
        config.color
      )}>
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
        {tempC !== null && tempC !== undefined && (
          <span className="text-muted-foreground">({tempC}°C)</span>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-4 space-y-3', config.bgColor, config.borderColor)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-lg', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>
          <div>
            <p className={cn('font-semibold', config.color)}>{config.label}</p>
            {venueName && (
              <p className="text-xs text-muted-foreground">{venueName}</p>
            )}
          </div>
        </div>
        {(tempC !== null && tempC !== undefined) && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{tempC}°C</span>
            </div>
            {humidity !== null && humidity !== undefined && (
              <div className="flex items-center gap-1">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{humidity}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Risk Progress Bar */}
      <div className="space-y-1">
        <Progress 
          value={config.progress} 
          className={cn(
            'h-2',
            status === 'low' && '[&>div]:bg-safe',
            status === 'moderate' && '[&>div]:bg-warning',
            status === 'high' && '[&>div]:bg-orange-500',
            status === 'extreme' && '[&>div]:bg-danger'
          )}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
          <span>Extreme</span>
        </div>
      </div>

      {/* Mitigation Guidance */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Recommended Actions:</p>
        <ul className="space-y-1">
          {guidance.map((item, i) => (
            <li key={i} className={cn(
              'text-xs flex items-start gap-1.5',
              status === 'extreme' ? config.color : 'text-muted-foreground'
            )}>
              <span className="mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {lastCheckAt && (
        <p className="text-[10px] text-muted-foreground">
          Last checked: {new Date(lastCheckAt).toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
};

export const HeatStatusBadge = ({ status }: { status: HeatStatus }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
      config.bgColor,
      config.color
    )}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
};
