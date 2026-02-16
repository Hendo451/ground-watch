

## Default Sport Setting

Add a global "Default Sport" selector to the Settings page, and use it to pre-populate the sport dropdown when creating new venues.

### What will change

1. **Settings page** -- Add a new card with a sport dropdown (using the existing `SPORT_CATEGORIES` list). The selected sport saves to the `default_sport` column already added to the `settings` table. The UI will show the derived heat category label beneath the dropdown for context.

2. **Add Venue dialog** -- Instead of hardcoding `'AFL'` as the initial sport, read the global default sport from settings and use it as the pre-selected value. Users can still override it per venue.

### Technical details

- **No database changes needed** -- the `default_sport` column and types were already added in the previous migration.
- **Settings.tsx** -- Add a new `<Card>` section (between SMS Alerts and Venues/Officials) containing a `<Select>` dropdown populated from `SPORT_CATEGORIES`. Selecting a sport calls `setDefaultSport()` and `markDirty()`. The current `defaultSport` state and save logic are already wired up from the last edit.
- **AddVenueDialog.tsx** -- Accept an optional `defaultSport` prop (string). Use it as the initial value for the sport `useState` instead of `'AFL'`. Fall back to `'AFL'` if no default is set.
- **Parent of AddVenueDialog** -- Pass the settings `default_sport` value into the dialog. This requires reading `useSettings()` in the parent component (likely `Dashboard.tsx` or wherever venues are managed) and threading it through as a prop.

