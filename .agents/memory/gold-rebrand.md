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

## Footer logo
`/brand-logo.png` not yet uploaded. Footer `<img>` has onError fallback to Syne text wordmark. In light mode: mix-blend-mode multiply (ivory bg disappears). In dark mode: invert(0.95) + mix-blend-mode screen.

**Why:** User brand logo is black script on ivory — blend modes let it adapt without needing two separate image files.

## Dark mode backgrounds
Warm near-black `#0F0F0E` (not blue-tinted). Old value `#0A0F1E` was removed — was hardcoded in home.tsx and caused dark/light mode inconsistency on hero section.
