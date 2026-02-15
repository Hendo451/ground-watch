export type SportIntensity = 'category_1' | 'category_2' | 'category_3';

export interface SportMapping {
  sport: string;
  category: SportIntensity;
}

export const SPORT_CATEGORIES: SportMapping[] = [
  // Category 1 - Extreme exertion
  { sport: 'AFL', category: 'category_1' },
  { sport: 'Soccer', category: 'category_1' },
  { sport: 'Rugby League', category: 'category_1' },
  { sport: 'Rugby Union', category: 'category_1' },
  { sport: 'Long-distance running', category: 'category_1' },
  { sport: 'Touch Football', category: 'category_1' },
  // Category 2 - High exertion
  { sport: 'Basketball', category: 'category_2' },
  { sport: 'Netball', category: 'category_2' },
  { sport: 'Tennis', category: 'category_2' },
  { sport: 'Cricket (batting)', category: 'category_2' },
  { sport: 'Hockey', category: 'category_2' },
  { sport: 'Volleyball', category: 'category_2' },
  // Category 3 - Moderate exertion
  { sport: 'Cricket (fielding)', category: 'category_3' },
  { sport: 'Baseball', category: 'category_3' },
  { sport: 'Golf', category: 'category_3' },
  { sport: 'Lawn Bowls', category: 'category_3' },
  { sport: 'Sailing', category: 'category_3' },
  { sport: 'Archery', category: 'category_3' },
];

export const CATEGORY_LABELS: Record<SportIntensity, string> = {
  category_1: 'Category 1 — Extreme exertion',
  category_2: 'Category 2 — High exertion',
  category_3: 'Category 3 — Moderate exertion',
};

export function getCategoryForSport(sport: string): SportIntensity {
  const mapping = SPORT_CATEGORIES.find(s => s.sport === sport);
  return mapping?.category ?? 'category_1';
}

export function getSportsForCategory(category: SportIntensity): string[] {
  return SPORT_CATEGORIES.filter(s => s.category === category).map(s => s.sport);
}

export function getSportNameForIntensity(intensity: SportIntensity): string | null {
  const mapping = SPORT_CATEGORIES.find(s => s.category === intensity);
  return mapping?.sport ?? null;
}

/** Category offset applied to base thresholds (Cat 1 = 0, Cat 2 = +1.5, Cat 3 = +3) */
export function getCategoryOffset(intensity: SportIntensity): number {
  if (intensity === 'category_3') return 3;
  if (intensity === 'category_2') return 1.5;
  return 0;
}

export interface HeatThreshold {
  level: 'moderate' | 'high' | 'extreme';
  label: string;
  conditions: string[];
}

export function getThresholdsForCategory(intensity: SportIntensity): HeatThreshold[] {
  const o = getCategoryOffset(intensity);
  return [
    {
      level: 'moderate',
      label: 'Moderate',
      conditions: [
        `>${(26 + o).toFixed(1)}°C at ≥60% RH`,
        `>${(30 + o).toFixed(1)}°C at ≥30% RH`,
      ],
    },
    {
      level: 'high',
      label: 'High',
      conditions: [
        `>${(30 + o).toFixed(1)}°C at ≥50% RH`,
        `>${(35 + o).toFixed(1)}°C at ≥20% RH`,
      ],
    },
    {
      level: 'extreme',
      label: 'Extreme',
      conditions: [
        `>${(35 + o).toFixed(1)}°C at ≥40% RH`,
        `>${(38 + o).toFixed(1)}°C at any RH`,
      ],
    },
  ];
}
