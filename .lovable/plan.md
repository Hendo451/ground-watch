

## Game Details Dialog

### Overview

Replace the "Map" link on active game cards with a unified **"Details"** button on both active and upcoming game cards. Tapping it opens a dialog showing:

1. A venue location map
2. A visual **Heat Risk Gauge** (slider/meter showing where current conditions fall on the Low-Moderate-High-Extreme scale)
3. SMA heat threshold breakdown for the game's sport category
4. For upcoming games only: a lightning surveillance start notice

---

### What the User Sees

**Details Dialog contents (top to bottom):**

```text
+---------------------------------------------+
|  [Venue Map - MapLibre with venue pin]       |
|  (Active games: includes safety radius +     |
|   strike history. Upcoming: pin only)        |
+---------------------------------------------+
|                                              |
|  HEAT RISK GAUGE                             |
|  [====|===========|====*=====|=========]     |
|   Low    Moderate    High      Extreme       |
|                      ^ 32C / 55% RH          |
|                                              |
|  Sport: AFL (Category 1 - Extreme exertion)  |
|                                              |
|  SMA 2024 Thresholds for Category 1:         |
|  - Moderate: >26C @60%+ RH or >30C @30%+ RH |
|  - High:     >30C @50%+ RH or >35C @20%+ RH |
|  - Extreme:  >35C @40%+ RH or >38C any RH   |
|                                              |
|  Recommended Actions:                        |
|  - Mandatory 10-min rest breaks every 30 min |
|  - Use ice towels and active cooling         |
|  - ...                                       |
+---------------------------------------------+
|  (Upcoming only)                             |
|  Lightning surveillance begins at            |
|  3:15 PM on Sat, Feb 15                      |
+---------------------------------------------+
```

---

### Technical Details

**1. New component: `GameDetailsDialog.tsx`**

- Accepts `game`, `venue`, `isActive` (boolean), and optional `strikes` array as props
- Renders a Sheet/Dialog with:
  - **Map section**: A simplified MapLibre map (no MapsGL SDK needed) centered on venue coordinates with a marker. For active games, includes the safety radius circle and strike dots (reusing the `createCircleGeoJSON` helper). For upcoming games, just the venue pin.
  - **Heat Risk Gauge**: A custom visual component using a gradient bar (green to red) with a pointer/marker showing where current conditions fall. Built with standard divs and Tailwind — the bar is segmented into four colored zones (Low/Moderate/High/Extreme) with a triangle or dot indicator at the current risk position.
  - **Sport and category label**: Shows the game's sport (from `sport_intensity` mapped back via `sportCategories.ts`) and the SMA category.
  - **Threshold table**: Displays the adjusted temperature/humidity thresholds for the game's specific sport category, calculated using the same offset logic as the heat-monitor function (Cat 3: +3C offset, Cat 2: +1.5C offset, Cat 1: no offset).
  - **Mitigation guidance**: Reuses the guidance text from `HeatRiskMeter.tsx`.
  - **Lightning notice** (upcoming only): An info banner: "Lightning surveillance will begin at [time] on [date]" where time = `start_time - warmup_minutes`.

**2. New component: `HeatRiskGauge.tsx`**

A visual gauge/slider component showing:
- A horizontal gradient bar divided into 4 colored segments (green, yellow, orange, red)
- Labels underneath: Low | Moderate | High | Extreme
- A pointer/indicator positioned based on either the raw risk level or interpolated from temp/humidity
- Current temperature and humidity displayed near the pointer
- Pure CSS/Tailwind — no external charting library needed

**3. Update `ActiveGameCard.tsx`**

- Remove the "Map" link (lines ~192-199)
- Add a "Details" button in the bottom-right corner that shows on both active and upcoming cards
- Add state to control dialog open/close
- Render `GameDetailsDialog` inline

**4. Update `Dashboard.tsx`**

- For active games, fetch lightning strikes data and pass to `ActiveGameCard` so the details dialog can show strikes on the map
- Minor: may need to pass strikes through or let the dialog fetch its own via `useLightningStrikes`

**5. Helper additions to `sportCategories.ts`**

- Add a `getSportForIntensity(intensity)` reverse-lookup function to display the sport name from a game's `sport_intensity` value
- Add a `getThresholdsForCategory(intensity)` function that returns the adjusted temperature/humidity thresholds for display in the dialog

**6. Files created/modified:**
- `src/components/GameDetailsDialog.tsx` (new)
- `src/components/HeatRiskGauge.tsx` (new)
- `src/components/ActiveGameCard.tsx` (modified — replace Map link with Details button)
- `src/lib/sportCategories.ts` (modified — add threshold display helpers)

