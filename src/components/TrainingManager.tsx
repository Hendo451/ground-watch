import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Training, TrainingException, Venue, Grade, useDeleteTraining, useUpdateTraining, useTrainingLightningStrikes } from '@/hooks/useData';
import { Dumbbell, Trash2, MapPin, Pencil, Info, Zap, Thermometer } from 'lucide-react';
import { EditTrainingDialog } from './EditTrainingDialog';
import { TrainingDetailsDialog } from './TrainingDetailsDialog';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LIGHTNING_COLORS: Record<string, string> = {
  green: 'text-emerald-500',
  orange: 'text-orange-400',
  red: 'text-red-500',
};

const HEAT_COLORS: Record<string, string> = {
  low: 'text-emerald-500',
  moderate: 'text-yellow-500',
  high: 'text-orange-400',
  extreme: 'text-red-500',
};

function isTrainingActive(training: Training): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  if (training.day_of_week !== dayOfWeek) return false;

  const todayStr = now.toISOString().split('T')[0];
  if (training.start_date > todayStr) return false;
  if (training.end_date && training.end_date < todayStr) return false;

  const [sh, sm] = training.start_time.split(':').map(Number);
  const [eh, em] = training.end_time.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em;
}

interface TrainingManagerProps {
  trainings: Training[];
  exceptions: TrainingException[];
  venues: Venue[];
  grades: Grade[];
  isAdmin: boolean;
}

// Sub-component so each row can subscribe to its own strikes (only when details open)
const TrainingRow = ({
  training,
  venue,
  grade,
  exceptionCount,
  isAdmin,
  onDetails,
  onEdit,
  onDelete,
}: {
  training: Training;
  venue: Venue | null | undefined;
  grade: { name: string } | null | undefined;
  exceptionCount: number;
  isAdmin: boolean;
  onDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const active = isTrainingActive(training);
  const lightningStatus = training.status ?? 'green';
  const heatStatus = training.heat_status ?? 'low';
  const hasMonitoring = lightningStatus !== 'green' || heatStatus !== 'low';

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{training.name}</span>
            {grade && (
              <Badge variant="outline" className="text-xs">{grade.name}</Badge>
            )}
            {/* Live status badges when active or has alerts */}
            {(active || hasMonitoring) && (
              <>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${LIGHTNING_COLORS[lightningStatus] || LIGHTNING_COLORS.green}`}>
                  <Zap className="h-3 w-3" />
                  {lightningStatus.charAt(0).toUpperCase() + lightningStatus.slice(1)}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${HEAT_COLORS[heatStatus] || HEAT_COLORS.low}`}>
                  <Thermometer className="h-3 w-3" />
                  {heatStatus.charAt(0).toUpperCase() + heatStatus.slice(1)}
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Every {DAYS[training.day_of_week]} • {training.start_time.slice(0, 5)} – {training.end_time.slice(0, 5)}
          </div>
          {venue && (
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {venue.name}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            From {new Date(training.start_date).toLocaleDateString()}
            {training.end_date && ` to ${new Date(training.end_date).toLocaleDateString()}`}
            {exceptionCount > 0 && (
              <span className="ml-2 text-warning">• {exceptionCount} cancelled session{exceptionCount > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {venue && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDetails}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper that loads strikes only when details dialog is open
const TrainingDetailsWithStrikes = ({
  training,
  venue,
  open,
  onOpenChange,
}: {
  training: Training;
  venue: Venue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { data: strikes = [] } = useTrainingLightningStrikes(open ? training.id : null);
  const active = isTrainingActive(training);

  return (
    <TrainingDetailsDialog
      training={training}
      venue={venue}
      open={open}
      onOpenChange={onOpenChange}
      isActive={active}
      strikes={strikes}
    />
  );
};

export const TrainingManager = ({ trainings, exceptions, venues, grades, isAdmin }: TrainingManagerProps) => {
  const deleteTraining = useDeleteTraining();
  const updateTraining = useUpdateTraining();
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [detailsTraining, setDetailsTraining] = useState<Training | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete training "${name}"? This cannot be undone.`)) {
      deleteTraining.mutate(id);
    }
  };

  const getExceptionCount = (trainingId: string) => {
    return exceptions.filter(e => e.training_id === trainingId).length;
  };

  const detailsVenue = detailsTraining?.venue_id
    ? venues.find(v => v.id === detailsTraining.venue_id)
    : null;

  return (
    <>
    <Card className="border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Trainings</h3>
      </div>

      {trainings.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No trainings set up yet.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {trainings.map(training => {
            const venue = training.venue_id ? venues.find(v => v.id === training.venue_id) : null;
            const grade = training.grade_id ? grades.find(g => g.id === training.grade_id) : null;
            const exceptionCount = getExceptionCount(training.id);

            return (
              <TrainingRow
                key={training.id}
                training={training}
                venue={venue}
                grade={grade}
                exceptionCount={exceptionCount}
                isAdmin={isAdmin}
                onDetails={() => setDetailsTraining(training)}
                onEdit={() => setEditingTraining(training)}
                onDelete={() => handleDelete(training.id, training.name)}
              />
            );
          })}
        </div>
      )}
    </Card>

    <EditTrainingDialog
      training={editingTraining}
      venues={venues}
      grades={grades}
      open={!!editingTraining}
      onOpenChange={(open) => { if (!open) setEditingTraining(null); }}
      onSave={(data) => {
        updateTraining.mutate(data, { onSuccess: () => setEditingTraining(null) });
      }}
      isPending={updateTraining.isPending}
    />

    {detailsTraining && detailsVenue && (
      <TrainingDetailsWithStrikes
        training={detailsTraining}
        venue={detailsVenue}
        open={!!detailsTraining}
        onOpenChange={(open) => { if (!open) setDetailsTraining(null); }}
      />
    )}
    </>
  );
};
