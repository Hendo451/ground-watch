import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Training, TrainingException, Venue, Grade, useDeleteTraining } from '@/hooks/useData';
import { Dumbbell, Trash2, MapPin } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TrainingManagerProps {
  trainings: Training[];
  exceptions: TrainingException[];
  venues: Venue[];
  grades: Grade[];
  isAdmin: boolean;
}

export const TrainingManager = ({ trainings, exceptions, venues, grades, isAdmin }: TrainingManagerProps) => {
  const deleteTraining = useDeleteTraining();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete recurring training "${name}"? This cannot be undone.`)) {
      deleteTraining.mutate(id);
    }
  };

  const getExceptionCount = (trainingId: string) => {
    return exceptions.filter(e => e.training_id === trainingId).length;
  };

  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Recurring Trainings</h3>
      </div>

      {trainings.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No recurring trainings set up yet.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {trainings.map(training => {
            const venue = training.venue_id ? venues.find(v => v.id === training.venue_id) : null;
            const grade = training.grade_id ? grades.find(g => g.id === training.grade_id) : null;
            const exceptionCount = getExceptionCount(training.id);
            
            return (
              <div key={training.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{training.name}</span>
                      {grade && (
                        <Badge variant="outline" className="text-xs">{grade.name}</Badge>
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
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(training.id, training.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
