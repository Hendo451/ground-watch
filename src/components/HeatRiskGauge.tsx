import { cn } from '@/lib/utils';
import { Thermometer, Droplets } from 'lucide-react';

type HeatStatus = 'low' | 'moderate' | 'high' | 'extreme';

interface HeatRiskGaugeProps {
  status: HeatStatus;
  tempC?: number | null;
  humidity?: number | null;
}

const segments: { key: HeatStatus; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: 'bg-safe' },
  { key: 'moderate', label: 'Moderate', color: 'bg-warning' },
  { key: 'high', label: 'High', color: 'bg-orange-500' },
  { key: 'extreme', label: 'Extreme', color: 'bg-danger' },
];

const statusIndex: Record<HeatStatus, number> = { low: 0, moderate: 1, high: 2, extreme: 3 };

export const HeatRiskGauge = ({ status, tempC, humidity }: HeatRiskGaugeProps) => {
  const idx = statusIndex[status];
  // pointer position: center of the active segment (each segment = 25%)
  const pointerPercent = idx * 25 + 12.5;

  return (
    <div className="space-y-2">
      {/* Gauge bar */}
      <div className="relative pt-5 pb-1">
        {/* Pointer triangle */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10"
          style={{ left: `${pointerPercent}%` }}
        >
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground" />
        </div>

        {/* Bar segments */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {segments.map((seg, i) => (
            <div
              key={seg.key}
              className={cn(
                'flex-1 transition-opacity',
                seg.color,
                i === idx ? 'opacity-100 ring-1 ring-foreground/30' : 'opacity-40'
              )}
            />
          ))}
        </div>

        {/* Labels */}
        <div className="flex mt-1.5">
          {segments.map((seg, i) => (
            <span
              key={seg.key}
              className={cn(
                'flex-1 text-center text-[10px] font-medium',
                i === idx ? 'text-foreground' : 'text-muted-foreground/60'
              )}
            >
              {seg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Current conditions */}
      {(tempC != null || humidity != null) && (
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          {tempC != null && (
            <span className="flex items-center gap-1">
              <Thermometer className="h-3.5 w-3.5" />
              {tempC}°C
            </span>
          )}
          {humidity != null && (
            <span className="flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              {humidity}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};
