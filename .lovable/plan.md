## Settings Page — Cog Icon in Header

### What This Adds

A new Settings page accessible via a cog icon in the top-right header, providing admin-level customisation for the monitoring experience.

### Settings Sections

**1. Default Warm-up Period**

- Slider or number input (0-120 mins) for the default warm-up time applied to new games
- Currently hardcoded to 45 minutes in multiple places — this will be stored in a new `settings` table and read globally

**2. Notification Preferences**

- Toggle SMS alerts on/off globally
- This complements the per-official `alerts_enabled` flag

**3. Venue & Officials Management**

- Quick links to manage venues and officials (currently only accessible via Add dialogs)

### Bug Fix: Warm-up Activating Games

The dashboard filter for active games will be updated to account for `warmup_minutes`:

```text
Current:  now >= start_time && now <= end_time
Fixed:    now >= (start_time - warmup_minutes) && now <= end_time
```

This makes the warm-up period functionally shift games from "Upcoming" to "Active" earlier.

---

### Technical Details

**1. New `settings` table (database migration)**

- Single-row table storing org-wide preferences
- Columns: `id` (uuid, PK), `default_warmup_minutes` (integer, default 45), `upcoming_days_window` (integer, default 7), `countdown_duration_minutes` (integer, default 30), `sms_alerts_enabled` (boolean, default true), `updated_at` (timestamptz)
- RLS: anyone can read, admins can update
- Seeded with one default row

**2. New Settings page** (`src/pages/Settings.tsx`)

- Clean form layout with sections matching the list above
- Uses existing UI components (Input, Slider, Switch, Card)
- Only editable by admins; viewers see current values as read-only

**3. New hooks** (`src/hooks/useData.ts`)

- `useSettings()` — fetches the single settings row
- `useUpdateSettings()` — mutation to update settings

**4. Dashboard header update** (`src/pages/Dashboard.tsx`)

- Add a `Settings` (cog) icon button in the top-right header between "Live Status" and "Sign Out"
- Links to `/settings`

**5. Route registration** (`src/App.tsx`)

- Add `<Route path="/settings" element={<Settings />} />`

**75 Edge function updates** (future consideration)

- Once settings are stored, the `lightning-monitor` and `heat-monitor` functions can read `countdown_duration_minutes` from the settings table instead of using hardcoded values
- This can be done as a follow-up to keep this change focused