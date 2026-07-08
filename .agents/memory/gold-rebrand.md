---
name: Gold rebrand tokens
description: Color system and font decisions after full visual rebrand from red to gold/ivory/black
---

## Rule
`--c-accent` is gold (#C9A227 light / #D4AF37 dark). Never reintroduce red (#C8102E or #A80D25).

## Font system
- Body: DM Sans (font-sans)
- Headings/display: Syne 600–800 (font-display, also aliased as font-serif)
- Tracked labels: `.label-track` utility — DM Sans, 11px, uppercase, letter-spacing 0.15em, --c-fg-45

## Signature element
`.gold-underline` — CSS ::after pseudo adds a 2px gold line 4px below baseline. Used on one hero word and section title highlights. NOT italic, NOT gold-colored text.

## Logo images
Both brand logos are live: footer/About uses `/brand-logo.png` (black script on ivory, adapted via blend modes: multiply in light, invert+screen in dark); nav uses `/nav-logo.png` (transparent signature, adapted via `dark:invert`). Both `<img>`s have onError fallback to text wordmark.

**Why:** User brand logo is single-color script — filters/blend modes let one image file adapt to both themes. Resize uploads to ~2x display size (ImageMagick, keep full alpha — PNG8 palette degrades edges).

## Dark mode backgrounds
Warm near-black `#0F0F0E` (not blue-tinted). Old value `#0A0F1E` was removed — was hardcoded in home.tsx and caused dark/light mode inconsistency on hero section.
