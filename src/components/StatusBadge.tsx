import { LightningStatus } from '@/types/lightning';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: LightningStatus;
  size?: 'sm' | 'md' | 'lg';
}

const labels: Record<LightningStatus, string> = {
  green: 'SAFE',
  orange: 'WARNING',
  red: 'STOP GAME',
};

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider',
        size === 'sm' && 'px-2.5 py-0.5 text-[10px]',
        size === 'md' && 'px-3 py-1 text-xs',
        size === 'lg' && 'px-4 py-1.5 text-sm',
        status === 'green' && 'bg-safe/15 text-safe',
        status === 'orange' && 'bg-warning/15 text-warning',
        status === 'red' && 'bg-danger/15 text-danger',
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'green' && 'bg-safe',
          status === 'orange' && 'bg-warning status-pulse-amber',
          status === 'red' && 'bg-danger status-pulse-red',
        )}
      />
      {labels[status]}
    </span>
  );
};
