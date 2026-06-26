# Accessibility Status

Last tested: 2026-02-06 with axe-core via Playwright

## Test Results: All Passing

```
11 passed, 3 skipped (mobile map-dependent tests)
```

## Previously Reported Issues - All Fixed

### 1. Meta Viewport (was Critical) - FIXED
- `user-scalable=no` removed from viewport meta tag
- Users can now zoom freely

### 2. Missing ARIA Labels on Dialogs (was Serious) - FIXED
- Report form dialog has `aria-labelledby` pointing to dialog title
- All dialogs have proper ARIA attributes

### 3. Invalid ARIA Attribute Values (was Critical) - FIXED
- All ARIA attributes validated

### 4. Missing Main Landmark (was Moderate) - FIXED
- `<main id="main-content" role="main" aria-label="...">` present in layout

### 5. Missing H1 Heading (was Moderate) - FIXED
- `<h1 class="sr-only">` present for screen readers

### 6. Duplicate Navigation Landmarks (was Moderate) - FIXED
- All `<nav>` elements have unique `aria-label` (Skip Navigation, Main Navigation, Pages)

### 7. Non-focusable Scrollable Regions (was Moderate) - FIXED
- Scrollable regions have proper keyboard accessibility

## Issues Fixed in This Audit (2026-02-06)

### 8. Tab Label Contrast (Serious) - FIXED
- **Component:** `MainNavigation.vue` UTabs inactive trigger text
- **Was:** `--ui-text-muted` (#64748b) on `--ui-bg-elevated` (#f1f5f9) = 4.34:1
- **Fix:** Override inactive trigger text to `--ui-text` (#334155) via `data-[state=inactive]:text-[var(--ui-text)]` in UTabs ui prop
- **Result:** 9.45:1 contrast ratio

### 9. Mobile Map Placeholder Contrast (Serious) - FIXED
- **Component:** `MapSection.vue` "Tap to show map" text
- **Was:** `text-[var(--ui-text-muted)]` on elevated bg = 4.34:1
- **Fix:** Changed to `text-[var(--ui-text)]` for 9.45:1 contrast
- **Bonus:** Changed clickable `<div>` to `<button>` for keyboard accessibility

### 10. Disabled Submit Button Contrast (Serious) - FIXED
- **Component:** Report form submit button (ClassicReportForm, PhotoReportForm)
- **Was:** Nuxt UI `disabled:opacity-75` blends to ~2.71:1 contrast
- **Fix:** CSS override in `main.css` - disabled submit buttons use explicit colors instead of opacity
- **Result:** Meets 4.5:1 AA minimum

### 11. Select Placeholder Contrast (Serious) - FIXED
- **Component:** Category select placeholder "Select a category"
- **Was:** `text-dimmed` (#94a3b8) on slate-50 (#f8fafc) = 2.45:1
- **Fix:** CSS override - `[data-slot="placeholder"]` uses `--ui-text-muted` (#64748b) = 4.55:1

### 12. Map Focus Indicator (Serious) - FIXED
- **Component:** `Map.vue` WebGL canvas keyboard focus
- **Was:** No visible focus indicator when map receives keyboard focus via "Skip to map" or Tab
- **Root Cause:** CSS `border`, `box-shadow`, `outline`, and `::after` pseudo-elements do not render on top of WebGL canvases because they don't get promoted to their own GPU compositor layer
- **Fix:** Real DOM element (`.map-focus-ring`) with `background` edge glow gradients using `color-mix()` for theme-aware colors. Only CSS `background` with full surface coverage triggers GPU layer promotion above WebGL.
- **Result:** Blue edge glow visible on all four map edges when focused, works in both light and dark mode

## Existing Accessibility Features

- **Skip Navigation:** Composable with keyboard shortcuts
- **Keyboard Navigation:** Full keyboard support for map tooltip, forms, dialogs
- **Form Accessibility:** A11yFormWrapper composable with proper ARIA
- **Screen Reader Support:** sr-only headings, ARIA labels, role attributes
- **Focus Management:** Custom focus ring system with proper visibility, including WebGL map focus glow
- **Dark Mode:** Proper contrast maintained in dark mode via CSS variables

## Testing

```bash
# Run axe tests (from node-dev container)
FRONTEND_URL=http://localhost:3000 npx playwright test tests/accessibility.spec.ts

# Install Playwright browsers first if needed
npx playwright install chromium
npx playwright install-deps chromium
```

## Notes

- Map-dependent tests (dialog, keyboard nav, form fields) are skipped on mobile because the map uses lazy loading with a "Tap to show map" placeholder
- Map-dependent tests skip gracefully if WebGL is not available in headless environments
- Dialog tests wait for animation completion to avoid false positive contrast violations during fade-in
