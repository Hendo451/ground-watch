import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TimePickerProps {
  value: string; // HH:mm format (24hr)
  onChange: (value: string) => void;
  label?: string;
}

export const TimePicker = ({ value, onChange }: TimePickerProps) => {
  // Parse the 24hr time value
  const parse24HrTime = (time: string) => {
    if (!time) return { hour: '', minute: '', period: 'AM' as const };
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hour: hour12.toString(), minute: m.toString().padStart(2, '0'), period };
  };

  // Convert back to 24hr format
  const to24Hr = (hour: string, minute: string, period: string) => {
    if (!hour || !minute) return '';
    let h = parseInt(hour);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minute}`;
  };

  const { hour, minute, period } = parse24HrTime(value);

  const handleHourChange = (h: string) => {
    onChange(to24Hr(h, minute || '00', period));
  };

  const handleMinuteChange = (m: string) => {
    onChange(to24Hr(hour || '12', m, period));
  };

  const handlePeriodChange = (p: string) => {
    if (p) onChange(to24Hr(hour || '12', minute || '00', p));
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="flex items-center gap-2">
      <Select value={hour} onValueChange={handleHourChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Hr" />
        </SelectTrigger>
        <SelectContent>
          {hours.map(h => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToggleGroup 
        type="single" 
        value={period} 
        onValueChange={handlePeriodChange}
        className="bg-muted rounded-md p-0.5"
      >
        <ToggleGroupItem 
          value="AM" 
          className="px-3 py-1.5 text-xs font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          AM
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="PM" 
          className="px-3 py-1.5 text-xs font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          PM
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
