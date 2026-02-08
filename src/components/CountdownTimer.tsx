import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface CountdownTimerProps {
  targetTime: string; // ISO string
  venueName: string;
}

export const CountdownTimer = ({ targetTime, venueName }: CountdownTimerProps) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isComplete = remaining <= 0;

  return (
    <Card className="border-border bg-card p-6 text-center space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{venueName}</h3>
      {isComplete ? (
        <div className="space-y-2">
          <div className="text-5xl font-bold text-safe">ALL CLEAR</div>
          <p className="text-sm text-muted-foreground">No lightning detected in the last 30 minutes</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-6xl font-mono font-bold text-danger tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-sm text-danger/80">Game stopped — waiting for all clear</p>
        </div>
      )}
    </Card>
  );
};
