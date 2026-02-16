

## Move Venue and Official Management to Settings

Remove the "All Venues" table from the Dashboard and build a full management experience in Settings where you can view, edit, and delete venues and officials.

### What changes

**Dashboard (cleanup)**
- Remove the "All Venues" table section entirely (lines 429-469)
- Remove unused imports (`useVenues`, `useOfficials`, `MapPin`) if no longer needed elsewhere on the dashboard

**Settings page (expand Venues and Officials section)**
- Replace the current summary cards (just showing counts) with two expandable/clickable lists:
  - **Venues list**: Each venue shows name, safe zone radius, default sport, and assigned official. Click to expand/edit inline or via a dialog. Delete button with confirmation.
  - **Officials list**: Each official shows name, mobile number, assigned venue, and alert toggle. Click to expand/edit inline or via a dialog. Delete button with confirmation.
- Keep the Add Venue / Add Official buttons at the top of each list

**New hooks in useData.ts**
- `useUpdateVenue` -- mutation to update a venue's name, coordinates, radius, sport
- `useDeleteVenue` -- mutation to delete a venue (with cascade considerations)
- `useUpdateOfficial` -- mutation to update an official's name, mobile, venue assignment, alerts toggle
- `useDeleteOfficial` -- mutation to delete an official

**New components**
- `EditVenueDialog` -- dialog form pre-filled with venue data for editing (reuses LocationSearch and sport selector from AddVenueDialog)
- `EditOfficialDialog` -- dialog form pre-filled with official data for editing

### Technical details

- **Database**: No schema changes needed. RLS policies already allow admin update/delete on both `venues` and `officials` tables.
- **useData.ts**: Add four new mutation hooks using the existing Supabase client pattern (`.update().eq('id', id)` and `.delete().eq('id', id)`), invalidating `['venues']` or `['officials']` query keys on success.
- **Settings.tsx**: The Venues and Officials section will use an accordion or simple expandable list. Each item row will have Edit (pencil icon) and Delete (trash icon) buttons visible to admins. Non-admins see the list read-only.
- **Dashboard.tsx**: Remove the venues table section and clean up any imports that are no longer used. The dashboard will still fetch venues/officials data since it needs them for game display (venue names on game cards, etc.).
- **EditVenueDialog**: Similar structure to AddVenueDialog but pre-populated with existing data and calling `useUpdateVenue` on submit.
- **EditOfficialDialog**: Similar structure to AddOfficialDialog but pre-populated with existing data and calling `useUpdateOfficial` on submit.
- Delete actions will use an AlertDialog for confirmation before proceeding.

