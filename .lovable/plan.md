## Declutter the Active Game Card

The card currently has up to 7 distinct visual sections stacked vertically, which creates a busy feel. Here's a streamlined approach:

### Changes

**1. Merge date and time into a single line**
Currently the date and time sit in a 2-column grid taking up a full row. Combine them into one compact line:

- Before: `Sat, Feb 15` | `07:00 PM - 08:00 PM`
- After: `Sat 15 Feb, 7:00 - 8:00 PM`

This saves an entire row of vertical space

**2. Move the official info inline with the time**  
Instead of a separate bordered section for the official, append their name subtly next to the venue name or time row, e.g. `Venue Name -- J. Smith`. Remove the phone number from the card (it's one tap away in contacts). This removes another visual separator and row.

**3. Make the Lightning Map button more subtle**  
Replace the full-width outlined button with a small icon-only or text link aligned to the bottom-right of the card. Less visual weight, still accessible.

**4. Tighten spacing**  
Reduce the card's `space-y-3` to `space-y-2` and padding from `p-4` to `p-3` for a more compact feel.

### Technical Details

All changes are in `src/components/ActiveGameCard.tsx`:

- Merge the date/time grid into a single flex row with combined formatting
- Inline the official name next to the time row, remove the bordered section (lines 192-197)
- Replace the full-width `Button` with a compact text link or icon button
- Update card className spacing from `space-y-3 p-4` to `space-y-2 p-3`