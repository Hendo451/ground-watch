

## Badge Cleanup and Import Pruning

Two small polish changes to `src/components/ActiveGameCard.tsx`:

### 1. Remove redundant emojis from status badges

The lightning and heat badges currently show both a Lucide icon AND an emoji (⚡ and 🌡). Removing the emojis keeps the badges clean and consistent, relying on the existing Lucide icons (`Zap`, `ShieldCheck`, `Thermometer`, etc.).

- Before: `[Zap icon] ⚡ Clear` / `[Thermometer icon] 🌡 Low`
- After: `[Zap icon] Clear` / `[Thermometer icon] Low`

### 2. Remove unused imports

The previous refactor left behind imports that are no longer used: `User`, `Calendar`, and `Button`. These will be pruned.

### Technical Details

File: `src/components/ActiveGameCard.tsx`

- Remove `User`, `Calendar` from the lucide-react import line
- Remove `Button` from the UI imports
- Remove the `⚡ ` prefix from the lightning badge label (around line 113)
- Remove the `🌡 ` prefix from the heat badge label (around line 131)
