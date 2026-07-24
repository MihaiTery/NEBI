---
name: NEBI
description: Pixel-art brand site for modular solid-wood cat towers, where 30% of profit funds shelters.
colors:
  orange: "#E8862A"
  orange-text: "#8F4509"
  orange-text-hover: "#A8540F"
  ink: "#3D2B1F"
  surface: "#FFFFFF"
  surface-cream: "#FFF8F0"
  bg: "#FFF5EB"
  grid-line: "#F0E0D0"
  success: "#6BBF59"
typography:
  display:
    fontFamily: "'Jersey 10', cursive"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  headline:
    fontFamily: "'Jersey 10', cursive"
    fontSize: "50px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "normal"
  title:
    fontFamily: "'Jersey 10', cursive"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "'Jersey 10', cursive"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.5px"
  body:
    fontFamily: "'Nunito', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  aside:
    fontFamily: "'VT323', monospace"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  none: "0px"
  bubble: "4px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "60px"
components:
  button-primary:
    backgroundColor: "{colors.orange-text}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.orange-text-hover}"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "24px"
---

# Design System: NEBI

## 1. Overview

**Creative North Star: "The 8-Bit Workshop"**

NEBI reads like a hand-built game cartridge for a hand-built product: a warm-wood, pixel-drawn cat tower rendered with the same care as its physical joinery. The system pairs a chunky, all-caps pixel typeface for structure and voice with a soft, rounded body font for reading — the same split a good indie game uses between its HUD and its dialogue box. Every surface is flat and sharp-cornered (no radius except the one deliberate exception, the speech bubble); depth comes from hard-edged, zero-blur "step" shadows and a doubled echo-outline, never from blur or glass. This is a maker's aesthetic, not a startup's: warm, friendly, playful, with real empathy for animals — stated as NEBI's own brand guidelines — but never cute-cartoon and never boutique-sterile. It explicitly rejects sterile corporate e-commerce (cold, catalog-like, big-box-furniture-retailer polish) and the two traps adjacent to it: generic pastel pet-startup sameness (soft gradients, blob illustrations) and childish cartoon-mascot pet branding.

**Key Characteristics:**
- Two-voice typography: pixel display type for structure, Nunito for reading, VT323 for a quieter aside voice.
- Flat, sharp-cornered surfaces; depth via hard offset shadows, not blur.
- One saturated accent (NEBI Orange) carrying nav, headings, buttons, and borders — a Committed color strategy, not a full palette.
- Genuine pixel-art texture (grid background, pixelated image-rendering, retro cat sprite animation) rather than decorative flourish.

## 2. Colors

A single warm, saturated orange carries the brand across nav, headings, borders, and CTAs against a soft cream field — Committed, not Restrained: NEBI Orange is the one color the whole system organizes around.

### Primary
- **NEBI Orange** (#E8862A): the brand color, reserved for decorative use — card borders, dividers, the nav's dashed underline, drop-shadow glows. At ~2.5:1 against the site's light surfaces it does not clear text contrast, so it never carries text or sits behind text on its own.
- **Orange Text** (#8F4509): the accessible, darker sibling of NEBI Orange (~6.5:1 against the page background) used everywhere orange carries text or is the fill under light text — headings, button fills, table headers, status labels. Same hue (~27°), just dark enough to read.
- **Orange Text Hover** (#A8540F): the lighter of the two accessible shades (~5:1), used only as the hover/press state so buttons still "lift" toward light on interaction while staying compliant.

### Neutral
- **Dark Brown / Ink** (#3D2B1F): body text color and the dark half of every hard-shadow pairing (button borders, button hover shadow, pixel-ball outline).
- **White** (#FFFFFF): card and form-field fill; the "paper" pixel content sits on.
- **Cream** (#FFF8F0): the nav bar surface — one step warmer/lighter than the page background so the nav reads as a distinct shelf.
- **Background** (#FFF5EB): the page body color; a warm, muted field the pixel grid overlay sits on at 50% opacity.
- **Grid Line** (#F0E0D0): the pixel-grid background lines and dashed table/summary dividers — always quiet, never a focal color.

### Status
- **Success Green** (#6BBF59): reserved for "adopted" status only (campaign/adoption table). Not used decoratively.

### Named Rules
**The One Accent Rule.** NEBI Orange is the only saturated color in the system. Green appears exactly once, as an adoption-status signal, never as decoration. There is no secondary or tertiary brand color — resist adding one.

**The Text-Safe Orange Rule.** Bright NEBI Orange (#E8862A) is decorative only — borders, dividers, glows. Anything rendering as text, or filling a shape that light text sits on, uses Orange Text or Orange Text Hover instead. Never let the bright brand orange carry text again; it reads as brand personality but fails contrast at ~2.5:1.

## 3. Typography

**Display/Label Font:** 'Jersey 10', cursive (pixel bitmap face)
**Body Font:** 'Nunito', sans-serif
**Aside Font:** 'VT323', monospace

**Character:** Jersey 10 is the brand's voice — a bold, condensed 8-bit display face, used sparingly at any given size because it's dense and slow to read at length. Nunito is the reading voice: warm, rounded, humanist, doing all the paragraph-length work. VT323 is a third, quieter register: a tall thin monospace used for asides that want to feel murmured rather than announced (the hero subtext, a soft aside line under the order summary).

**Why Jersey 10, not Press Start 2P.** The site originally used 'Press Start 2P'. Its shipped webfont renders the Romanian letters Ș/ș (U+0218/U+0219) as a broken, tiny, misplaced glyph — verified in-browser, not just a glyph-coverage check. Worse, once Press Start 2P's stylesheet declares coverage of that Unicode range, browsers commit to its (broken) resource and never fall through to a fallback font, whether that fallback is listed later in `font-family` or added as a competing `@font-face` for the same family — both were tested and both failed to recover the glyph. The same failure was independently confirmed on 'Pixelify Sans' and 'VT323' when used as primaries, ruling out "just add a fallback" as a fix. 'Jersey 10' was the only pixel/8-bit face tested that renders the full Romanian set (ă â î ș ț and capitals) correctly and natively, so it replaced Press Start 2P everywhere rather than sitting behind it in a fallback chain.

### Hierarchy
- **Display** (400, 56px / 45px tablet / 33px mobile, line-height 1.6): the hero `<h1>`. The single largest use of the pixel face on the page.
- **Headline** (400, 50px / 39px / 33px, line-height 1.8): `.section-title` — one per section, always paired with a leading emoji rather than an uppercase eyebrow.
- **Title** (400, 28–45px, line-height 1.6–1.8): card titles, product/config panel headings — the pixel face at card scale.
- **Label** (400, 19–32px, letter-spacing ~0.5px): nav links, buttons, table headers, badges, form labels — the smallest, densest use of the pixel face; never used for anything longer than a few words.
- **Body** (400/600/700, 15–17px, line-height 1.4–1.6, opacity 0.85 on secondary copy, max ~700px measure): all paragraph content, card text, form inputs.
- **Aside** (400, 26–32px, line-height 1.3): hero subtext and other quiet, secondary lines — large in size but soft in weight and opacity so it never competes with the pixel display type.

### Named Rules
**The Density Ceiling Rule.** Jersey 10 is never set smaller than 19px or used for more than one short phrase at a time — it's a structural/label face, not a reading face. If a sentence needs the pixel font, it's too long; move it to Nunito or VT323. (Raised substantially from Press Start 2P's original 7px floor: at equal font-size, Jersey 10 renders roughly 2.7–2.8× narrower/lighter than Press Start 2P's blocky monospace glyphs — verified via a clean canvas glyph-width sweep confirming linear scaling across sizes, cross-checked against the live production site's actual rendered box widths — so every step of this ramp is scaled up by that same factor from the original Press Start 2P values, not just bumped by feel. An earlier, lower estimate of ~2.15–2.3× was caught and corrected after direct pixel-for-pixel comparison against nebi.ro showed it still undershot.)

## 4. Elevation

NEBI is flat at rest — no ambient shadows, no blur, no glass. Depth is entirely hard-edged and directional, styled after 8-bit game UI: shadows are solid-color offsets with zero blur radius, and cards carry a second, fainter outline offset behind them like a printed registration error. Nothing lifts or glows; things step.

### Shadow Vocabulary
- **Button press-shadow** (`box-shadow: 0 4px 0 var(--nebi-dark)`, on `.pixel-btn:hover`): a solid, zero-blur step under the button, removed entirely on `:active` so the button visually "presses" flush.
- **Card lift-shadow** (`box-shadow: 0 6px 0 rgba(232, 134, 42, 0.15)`, on `.pixel-card:hover`): the same hard-step language at lower opacity, paired with a small `translateY(-2px)`.
- **Echo outline** (`.pixel-card::after`: a full-size copy offset `bottom:-4px; right:-4px`, `2px solid rgba(232,134,42,0.2)`, `z-index:-1`): a static, always-on double-border rather than a shadow — the system's signature depth cue.

### Named Rules
**The Hard Shadow Rule.** Every shadow in the system is a flat, zero-blur offset (`0 Npx 0 color`), never `box-shadow: 0 Npx Mpx blur color`. Blur reads as glass or as a generic SaaS card; NEBI's depth is print-registration depth, not glow depth.

## 5. Components

### Buttons
- **Shape:** sharp corners (0 radius), 3px solid border, `min-height: 44px` (touch-target floor).
- **Primary:** Orange Text fill (#8F4509), white text, 3px Dark Brown border (#3D2B1F), `16px 24px` padding, Label typography.
- **Hover:** fill lightens to Orange Text Hover (#A8540F), button lifts `translateY(-2px)`, hard press-shadow appears (`0 4px 0` Dark Brown).
- **Active:** returns to `translateY(0)`, shadow removed — the "pressed" state.
- **Outline variant:** transparent fill, Orange Text fill/border; hover fills with `rgba(232,134,42,0.1)`.

### Cards
- **Corner Style:** sharp (0 radius) — never rounded.
- **Background:** White (#FFFFFF).
- **Border:** 3px solid NEBI Orange.
- **Shadow Strategy:** flat at rest; echo outline always present; hard lift-shadow on hover (see Elevation).
- **Internal Padding:** 24px standard (`{spacing.md}`), 30px for feature-emphasis cards (mission, form).
- **Never nest a pixel-card inside another pixel-card.**

### Inputs / Fields
- **Style:** White fill, 3px solid Orange border, sharp corners, Nunito body typography.
- **Focus:** border shifts to Dark Brown plus a soft `0 0 0 2px rgba(232,134,42,0.2)` ring — the one place a soft (non-hard) shadow is allowed, since it signals focus rather than surface depth.
- **Select:** custom Orange chevron via inline SVG, no native arrow.

### Navigation
- Fixed top bar, Cream surface (#FFF8F0), bottom border 3px Orange plus a repeating dashed-line pseudo-element beneath it for pixel texture. Links use Label typography; active/hover state gets an Orange border-box and a faint Orange background tint — never an underline. Below 768px, collapses to a hamburger toggle that expands a full-width dropdown in the same Cream surface.

### Pixel Table
- Header row: Orange fill, white Label-typography text, 2px Dark Brown borders. Body cells: white fill, 2px Orange borders, subtle Orange tint on row hover. Status cells use Label typography at 8px: green for adopted, orange for waiting — text only, no background chip.

### Tower Preview (signature component)
The configurator's stacked-image tower is NEBI's most distinctive pattern: individual pixel-art wood-level images (`tower-base`, `tower-par`, `tower-impar`, `tower-pat`) stack in a `column-reverse` flex with `-4px` overlap so seams disappear. Special pieces (sisal, rope) get a colored `drop-shadow` + brightness/saturation filter instead of a border or badge — sisal glows warm gold, rope reads brown/desaturated — so materiality is communicated through light, not iconography.

## 6. Do's and Don'ts

### Do:
- **Do** keep every surface sharp-cornered (0 radius); the one approved exception is the 4px-radius speech bubble.
- **Do** use zero-blur, solid-offset shadows only (`0 Npx 0 color`) — the Hard Shadow Rule.
- **Do** lead sections with an emoji + `.section-title`, never an uppercase tracked eyebrow line.
- **Do** keep Jersey 10 to short phrases (labels, titles, headings) and route anything paragraph-length to Nunito.
- **Do** let NEBI Orange stay the only saturated color; Success Green is reserved for adoption-status text only.
- **Do** communicate special/premium pieces (sisal, rope) through colored glow/filter, matching the Tower Preview pattern, not through badges or stripes.

### Don't:
- **Don't** make the site feel like sterile corporate e-commerce — no cold catalog grids, no big-box-furniture-retailer polish. This is PRODUCT.md's primary anti-reference.
- **Don't** drift toward generic pastel pet-startup sameness — no soft gradients, no blob illustrations, no Instagram-startup rounded-everything look.
- **Don't** tip into cutesy cartoon-mascot pet branding — NEBI's playfulness is pixel-art-deliberate, not childish; keep the sprite cat expressive but not saccharine.
- **Don't** use blurred/glow box-shadows or glassmorphism anywhere — depth is hard-edged only.
- **Don't** use gradient text or `background-clip: text` treatments — emphasis comes from the pixel face and color, not gradients.
- **Don't** simulate proof that doesn't exist yet (stock photography standing in for the real prototype, invented testimonials) — the product photo placeholders explicitly say "în curând" rather than fake it, and that honesty should hold everywhere else too.
- **Don't** add a second or third saturated accent color "for variety" — the One Accent Rule holds even under pressure to add visual interest.
