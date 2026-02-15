

## Sport Selection for Venues and Games

### What Changes

Instead of users selecting abstract "Category 1/2/3" when adding a venue, they pick the **actual sport** (e.g. AFL, Cricket, Soccer). The app maps that sport to the correct SMA heat category behind the scenes.

When scheduling a game, the sport defaults to whatever the venue was set up with, but can be changed — and that override determines the heat risk thresholds for that specific game.

### User Flow

```text
Add Venue:
  User picks "AFL" from a sport dropdown
  --> App stores "AFL" as default_sport
  --> App maps AFL to Category 1 and stores sport_intensity = category_1

Schedule Game at that venue:
  Sport auto-fills to "AFL" (from the venue)
  User can change to "Cricket (fielding)" if needed
  --> App maps the selected sport to Category 3
  --> Game record stores sport_intensity = category_3
```

### Sport-to-Category Mapping (SMA 2024)

| Category 1 (Extreme) | Category 2 (High) | Category 3 (Moderate) |
|---|---|---|
| AFL | Basketball | Cricket (fielding) |
| Soccer | Netball | Baseball |
| Rugby League | Tennis | Golf |
| Rugby Union | Cricket (batting) | Lawn Bowls |
| Long-distance running | Hockey | Sailing |
| Touch Football | Volleyball | Archery |

---

### Technical Details

**1. Database migration**

- Add `default_sport` (text, nullable) column to `venues` table — stores the display sport name (e.g. "AFL")
- Add `sport_intensity` (sport_intensity enum, default category_1) column to `games` table — per-game override
- Backfill: set `games.sport_intensity` from the joined venue's `sport_intensity` for all existing games

**2. Shared sport mapping constant** (`src/lib/sportCategories.ts`)

- A single source-of-truth array mapping sport names to categories:
  ```
  { sport: "AFL", category: "category_1" }
  { sport: "Cricket (fielding)", category: "category_3" }
  ...
  ```
- Helper functions: `getCategoryForSport(sport)` and `getSportsForCategory(category)`

**3. AddVenueDialog changes**

- Replace the "Sport Intensity Category" dropdown with a "Default Sport" dropdown listing all sports
- When a sport is selected, auto-set `sport_intensity` from the mapping
- Show the derived category as a small label (e.g. "Category 1 - Extreme exertion")

**4. AddGameDialog changes**

- Add a "Sport" dropdown that defaults to the selected venue's `default_sport`
- When venue changes, auto-update the sport to the venue's default
- User can override the sport, which recalculates the category
- Pass `sport_intensity` into the game creation payload

**5. Game data hooks** (`useData.ts`)

- Update `useAddGame` mutation to include `sport_intensity`
- Update `Game` interface to include `sport_intensity`

**6. Heat monitor edge function update** (`heat-monitor/index.ts`)

- Read `sport_intensity` from the **game** record instead of the venue
- Fall back to venue's `sport_intensity` if the game field is null (backward compatibility)

**7. Weather forecast edge function update** (`weather-forecast/index.ts`)

- Same change: use game-level `sport_intensity` with venue fallback
