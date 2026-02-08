import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
] as const;

type Country = typeof COUNTRIES[number];

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export const PhoneInput = ({ value, onChange, placeholder = "400 111 222", required, id }: PhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState<string>('AU');
  const [nationalNumber, setNationalNumber] = useState('');

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];

  const handleCountrySelect = (country: Country) => {
    setCountryCode(country.code);
    setOpen(false);
    updateE164(nationalNumber, country);
  };

  const handleNumberChange = (input: string) => {
    setNationalNumber(input);
    updateE164(input, selectedCountry);
  };

  const updateE164 = (national: string, country: Country) => {
    let digits = national.replace(/[^\d]/g, '');
    // Strip leading 0 for countries that use it locally (AU, GB, NZ, etc.)
    if (['AU', 'NZ', 'GB', 'IE', 'ZA'].includes(country.code) && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    onChange(`${country.dial}${digits}`);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[110px] justify-between px-3 font-normal"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.dial}</span>
            </span>
            <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dial}`}
                    onSelect={() => handleCountrySelect(country)}
                    className="cursor-pointer"
                  >
                    <span className="flex items-center gap-3 flex-1">
                      <span className="text-lg">{country.flag}</span>
                      <span className="flex-1">{country.name}</span>
                      <span className="text-muted-foreground">{country.dial}</span>
                    </span>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        countryCode === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        value={nationalNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        inputMode="tel"
        required={required}
        className="flex-1"
      />
    </div>
  );
};

export { COUNTRIES };
