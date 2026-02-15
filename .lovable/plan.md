

## Show All Lightning Strikes on Map + Editable Warm-up Period

### What This Changes

Currently the map only shows a single "last strike" dot. This plan will display **every strike** detected during a game's active window (including warm-up) and make the warm-up period editable from the Edit Game dialog.

### Overview

1. **Record strikes in the database** -- The `lightning-monitor` backend function will be updated to insert each detected strike into the existing `lightning_strikes` table (currently empty).

2. **Fetch strike history for the map** -- A new data hook (`useLightningStrikes`) will query all strikes for the selected game and pass them to the map component.

3. **Render multiple strikes on the map** -- The `WeatherMap` component will be updated to plot all historical strikes as individual dots (colour-coded by recency) instead of just one.

4. **Make warm-up period editable** -- The Edit Game dialog will gain a "Warm-up (mins)" field so you can adjust `warmup_minutes` after a game is created, which shifts the monitoring window accordingly.

---

### Technical Details

**1. Update `lightning-monitor` edge function** (`supabase/functions/lightning-monitor/index.ts`)
- After detecting strikes from Xweather, insert each flash into `lightning_strikes` with `game_id`, `venue_id`, `latitude`, `longitude`, `distance_km`, `detected_at`, `strike_type`, and `peak_amperage`.
- Continue updating `last_strike_*` fields on the `games` table as before (for dashboard display).

**2. New hook: `useLightningStrikes`** (`src/hooks/useData.ts`)
- Query `lightning_strikes` table filtered by `game_id`, ordered by `detected_at` descending.
- Subscribe to Supabase Realtime on this table so new strikes appear on the map immediately (realtime is already enabled on this table).

**3. Update `MapView.tsx`**
- Import and call `useLightningStrikes(gameId)`.
- Pass the full array of strikes to `WeatherMap` as a new `strikes` prop.

**4. Update `WeatherMap.tsx`**
- Replace the single `strike-point` source with a `FeatureCollection` containing all strikes.
- Colour-code strikes: recent strikes (under 10 minutes) in bright orange, older strikes in a faded tone.
- Each strike dot shows a tooltip on click with distance and time.
- Update the legend to reflect "All strikes" count instead of just "Last strike".

**5. Update `EditGameDialog.tsx`**
- Add a `warmup_minutes` input field (number, 0-120, default from game data).
- Include `warmup_minutes` in the `onSave` payload.

**6. Update `useUpdateGame` hook** (`src/hooks/useData.ts`)
- Allow `warmup_minutes` in the update mutation type so edits are persisted.

