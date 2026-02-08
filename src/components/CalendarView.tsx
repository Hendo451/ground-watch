import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { Game, Training, TrainingException, Venue, Grade } from '@/hooks/useData';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';

interface CalendarViewProps {
  games: Game[];
  trainings: Training[];
  trainingExceptions: TrainingException[];
  venues: Venue[];
  grades: Grade[];
  isAdmin: boolean;
  onCancelTraining?: (trainingId: string, date: string, reason: string) => void;
}

interface CalendarEvent {
  id: string;
  type: 'game' | 'training';
  name: string;
  startTime: string;
  endTime: string;
  venue?: Venue;
  grade?: Grade;
  status?: 'green' | 'orange' | 'red';
  isCancelled?: boolean;
  cancelReason?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView = ({ 
  games, 
  trainings, 
  trainingExceptions, 
  venues, 
  grades, 
  isAdmin,
  onCancelTraining 
}: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ trainingId: string; date: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Generate training instances for the month
  const getTrainingInstancesForMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const instances: { date: Date; training: Training; exception?: TrainingException }[] = [];
    
    trainings.forEach(training => {
      const trainingStart = new Date(training.start_date);
      const trainingEnd = training.end_date ? new Date(training.end_date) : null;
      
      days.forEach(day => {
        if (getDay(day) !== training.day_of_week) return;
        if (day < trainingStart) return;
        if (trainingEnd && day > trainingEnd) return;
        
        const dateStr = format(day, 'yyyy-MM-dd');
        const exception = trainingExceptions.find(
          e => e.training_id === training.id && e.exception_date === dateStr
        );
        
        instances.push({ date: day, training, exception });
      });
    });
    
    return instances;
  }, [currentMonth, trainings, trainingExceptions]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Add games
    games.forEach(game => {
      const gameDate = format(new Date(game.start_time), 'yyyy-MM-dd');
      if (gameDate === dateStr) {
        const venue = venues.find(v => v.id === game.venue_id);
        const grade = game.grade_id ? grades.find(g => g.id === game.grade_id) : undefined;
        events.push({
          id: game.id,
          type: 'game',
          name: game.name || 'Game',
          startTime: format(new Date(game.start_time), 'HH:mm'),
          endTime: format(new Date(game.end_time), 'HH:mm'),
          venue,
          grade,
          status: game.status,
        });
      }
    });
    
    // Add trainings
    getTrainingInstancesForMonth.forEach(({ date: instanceDate, training, exception }) => {
      if (!isSameDay(instanceDate, date)) return;
      
      const venue = training.venue_id ? venues.find(v => v.id === training.venue_id) : undefined;
      const grade = training.grade_id ? grades.find(g => g.id === training.grade_id) : undefined;
      
      events.push({
        id: `${training.id}-${dateStr}`,
        type: 'training',
        name: training.name,
        startTime: exception?.override_start_time || training.start_time.slice(0, 5),
        endTime: exception?.override_end_time || training.end_time.slice(0, 5),
        venue: exception?.override_venue_id ? venues.find(v => v.id === exception.override_venue_id) : venue,
        grade,
        isCancelled: exception?.is_cancelled,
        cancelReason: exception?.reason || undefined,
      });
    });
    
    return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Pad the beginning with empty slots
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const paddedDays = [...Array(firstDayOfMonth).fill(null), ...days];

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const handleCancelTraining = () => {
    if (cancelTarget && onCancelTraining) {
      onCancelTraining(cancelTarget.trainingId, cancelTarget.date, cancelReason);
      setCancelDialogOpen(false);
      setCancelTarget(null);
      setCancelReason('');
    }
  };

  return (
    <Card className="border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground bg-muted/30">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {paddedDays.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border/50 bg-muted/10" />;
          }
          
          const events = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[80px] border-b border-r border-border/50 p-1 cursor-pointer hover:bg-accent/50 transition-colors ${
                !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {events.slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    className={`text-[10px] px-1 py-0.5 rounded truncate ${
                      event.isCancelled 
                        ? 'bg-muted text-muted-foreground line-through'
                        : event.type === 'game' 
                          ? event.status === 'red' 
                            ? 'bg-danger/20 text-danger'
                            : event.status === 'orange'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-primary/20 text-primary'
                          : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {event.name}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span>Game</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-secondary" />
          <span>Training</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Cancelled</span>
        </div>
      </div>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No events scheduled</p>
            ) : (
              selectedEvents.map(event => (
                <div 
                  key={event.id} 
                  className={`p-3 rounded-lg border ${
                    event.isCancelled 
                      ? 'bg-muted/50 border-muted'
                      : event.type === 'game'
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-secondary/50 border-secondary'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${event.isCancelled ? 'line-through text-muted-foreground' : ''}`}>
                          {event.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {event.type === 'game' ? 'Game' : 'Training'}
                        </Badge>
                        {event.isCancelled && (
                          <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {event.startTime} – {event.endTime}
                      </div>
                      {event.venue && (
                        <div className="text-sm text-muted-foreground">
                          📍 {event.venue.name}
                        </div>
                      )}
                      {event.grade && (
                        <div className="text-sm text-muted-foreground">
                          🏷️ {event.grade.name}
                        </div>
                      )}
                      {event.cancelReason && (
                        <div className="text-sm text-muted-foreground mt-1 italic">
                          Reason: {event.cancelReason}
                        </div>
                      )}
                    </div>
                    {isAdmin && event.type === 'training' && !event.isCancelled && onCancelTraining && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          const trainingId = event.id.split('-')[0];
                          setCancelTarget({ 
                            trainingId, 
                            date: format(selectedDate!, 'yyyy-MM-dd') 
                          });
                          setCancelDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel training dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Training Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will cancel just this session, not the entire recurring schedule.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="e.g. Public holiday, wet weather"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCancelDialogOpen(false)}>
                Keep Session
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleCancelTraining}>
                Cancel Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
