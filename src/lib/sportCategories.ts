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
