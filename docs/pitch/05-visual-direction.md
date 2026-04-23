# AgroMind — Visual Direction (Deck + App)

> Build in Figma / Keynote from these specs. Keep deck and app visually aligned so the
> slide-to-live-demo handoff feels seamless to the judges.

---

## 1. Brand essence

- **Positioning line:** *"EU-grade farming intelligence in your own language."*
- **Brand feeling:** Calm, trustworthy, modern — closer to Linear / Revolut than to a
  typical agri-tech brand. Not earthy. Not cartoonish. Not "tractor stock photo."
- **Tone of voice:** Direct, short, farmer-respecting. No jargon. No emoji in official
  materials. Active verbs: *"Water now."* *"Spray tomorrow."* *"Frost at 03:00."*

## 2. Palette

Keep this palette consistent across deck, app, landing page, social.

| Role              | Token           | Hex        | Use                                       |
|-------------------|-----------------|------------|-------------------------------------------|
| Ink (primary)     | `--ink`         | `#0F1E1A`  | Headings, body text on light              |
| Background        | `--bg`          | `#0B1612`  | Dark canvas (deck + app)                  |
| Surface           | `--surface`     | `#132420`  | Cards on dark canvas                      |
| Surface elevated  | `--surface-hi`  | `#1B332C`  | Modals, highlighted cards                 |
| Green (brand)     | `--green`       | `#2FB682`  | Primary actions, brand accents            |
| Green deep        | `--green-deep`  | `#1E7A58`  | Hover, pressed                            |
| Amber (moderate)  | `--amber`       | `#F2B94B`  | Moderate risk, caution                    |
| Red (urgent)      | `--red`         | `#E5483A`  | Urgent alerts, frost warnings             |
| Sky (data)        | `--sky`         | `#6FB8F2`  | NDVI, satellite, weather                  |
| Muted             | `--muted`       | `#93A7A0`  | Secondary text, labels                    |
| Hairline          | `--hairline`    | `#203830`  | Card borders, dividers                    |

**Rule:** exactly one amber or red element visible at a time. Keep green as the default
emotional tone. Alerts earn their colour by being rare.

## 3. Typography

- Headings & UI: **Inter** (variable). Weights 400 / 500 / 600 / 700.
- Numerals on cards: **Inter** with `font-variant-numeric: tabular-nums`.
- Deck display headlines: **Inter Display** 700 at 72–96 pt.
- Slide body: Inter 400/500 at 28–36 pt.
- App body: Inter 400 at 15 px; labels 12 px uppercase letter-spaced 0.08em.

Never use two font families. Never use a serif. Never italicise brand/product name.

## 4. Spacing & corner radius

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80 (px in app, pt in deck).
- Corner radius:
  - small UI chips / buttons: **12**
  - cards: **20**
  - modals / bottom-sheets: **28**
- Shadow: no drop-shadow on dark surfaces. On light surfaces, single soft shadow
  `0 8px 24px rgba(15, 30, 26, 0.06)`.

## 5. Iconography

- **Lucide** (open source, tree-shakable in RN).
- Always 1.5 px stroke. Never filled icons. One size per context (18 / 20 / 24).
- Crop glyphs: stylised outline drawings (wheat, corn, potato, apple, grape, tomato,
  sunflower). Commission a single illustrator pass; export as SVG sprite.

## 6. Motion

- Card reveal: 220 ms, ease-out. Subtle Y-translate 8 px → 0.
- Skeleton shimmer: 1.4 s cycle, 20% opacity sweep.
- Push alert animation on demo: 320 ms scale 0.96 → 1.00 + soft haptic feedback.
- Never bounce. Never use default iOS spring unless the gesture is direct-touch.

## 7. Slide direction (12 slides)

### General
- 16:9 aspect. Safe margin 80 pt each side.
- Dark theme only (`--bg` canvas). One slide = one idea.
- Page number bottom-right in `--muted` 14 pt, format `07 / 12`.
- Bottom-left footer every slide: the AgroMind wordmark + a 12 pt `agromind.app`.
- Transitions: **cut** only. Never dissolve, never push, never flip.

### Per-slide visual notes
1. **Title** — full-bleed field photo (desaturated, `--bg` overlay at 65%), wordmark
   centered, tagline below in `--muted` 28 pt. Speakers' names bottom-right 16 pt.
2. **Problem** — one hero stat at 180 pt `--red`, photo of Vesna's apricot tree as a
   muted right-side column (licence before pitch). Keep 3 supporting bullets only.
3. **Tailwinds** — three equal columns; each with a single icon, a 64 pt number, and a
   one-line caption. Never more than one number per column.
4. **Solution** — phone mockup dead-centre at 40% width; four labelled callouts in
   corners (NW Irrigation, NE Frost, SW Disease, SE NDVI). Thin `--green` connector lines.
5. **Demo** — the slide that is **almost empty**: just the word `LIVE` in `--green` 220 pt,
   and a subtle "Point phone at screen" prompt. Lean into theatre.
6. **Science stack** — a 2-column list: left "Feature", right "Paper / Standard". Monospace
   font for the paper names. No decoration.
7. **Market** — three concentric circles (TAM / SAM / SOM) with hard numbers inside. No
   clipart. To the right: 4-row competitive table.
8. **Business model** — four vertical pricing cards (Free / Pro / Farm / Enterprise).
   Bold the Pro card in `--green` outline (2 px).
9. **GTM timeline** — horizontal timeline M+0 → M+18, five milestone flags. `--green` bar.
10. **Traction** — six check-rows on the left, a terminal-looking code snippet on the
    right showing a real `/ndvi` call returning 200 with a base64 PNG head.
11. **Team** — three cropped square portraits (300 px), one-line bio each, LinkedIn logo.
    Centre the row vertically. No company logos behind the row.
12. **Ask** — the single biggest number on the deck: `€250,000` at 240 pt `--green`. Four
    supporting lines below. Final line in `--red`: `Thank you.`

### Export
- Render each slide to PNG at 1920×1080 **and** bake a PDF from the Figma deck.
- Keep the source `.fig` file in `docs/pitch/assets/`.

## 8. App direction

- Dashboard: **12–16 px card spacing** between sections. Use the brand palette above —
  today's app uses `#7BB661` green which should be updated to `#2FB682`.
- Every card: title in 18 pt semibold, value in 36 pt bold (tabular-nums), single-line
  caption in 13 pt `--muted` below.
- **Urgent states** flip the card accent bar (top 4 px) to `--red`. Never the whole card.
- Loading state: skeleton shimmer (see §6). Never a spinner. Never "Loading…" text.
- Empty state: crop-family illustration at 96 px centred, one-line explanation + one
  primary CTA button. No sub-copy.
- Buttons: height 48, radius 12, label 15 pt semibold. Primary is `--green`; destructive
  `--red`; tertiary transparent with `--green` text.
- Map pin: a single green dot with a soft white halo and a thin ink outline. No
  animation after the pin is set.

## 9. Assets checklist (ship before pitch)

- [ ] Logo mark + wordmark SVG (white + ink variants)
- [ ] App icon 1024×1024 + all platform derivatives
- [ ] Splash screen 2048×2732 (iOS) + adaptive icon for Android
- [ ] 12-slide Figma deck (source + PDF + keynote export)
- [ ] 6 hero screenshots of the app (16:9 device frames)
- [ ] 60-second demo MP4 (vertical 9:16 for socials + horizontal 16:9 for pitch backup)
- [ ] Landing page (single-page, 6 sections, 120 KB)
- [ ] Social avatar / cover (LinkedIn / X / IG)
- [ ] Press kit folder (logos, 2 paragraphs of boilerplate, photos, founders bios)

## 10. Accessibility

- Always meet **WCAG AA 4.5:1** contrast on body text.
- Minimum font size in app: 13 pt. Minimum touch target: 44 × 44.
- Motion-reduce: respect `prefers-reduced-motion` and the OS-level setting in RN via
  `AccessibilityInfo.isReduceMotionEnabled()`.
- Localisation: design at 1.0x, verify at 1.25x — Bosnian can be ~15% longer than English.
