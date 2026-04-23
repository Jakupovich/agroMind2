# AgroMind — Ideas to Win the Adria Future Hackathon

**Jury profile**: World Bank, Mtel Montenegro, government partners, international
investors. They reward **measurable impact + traction + regional specificity**
far more than another AI feature. Everything below is scored on how much it
moves the needle with *that* audience, not how much code it ships.

---

## Tier S — Do before Kotor (high signal, low effort)

### 1. Live "verifiable impact" counter on the pitch deck homepage
**What**: A Railway-hosted `/impact` endpoint that returns the sum of saved €,
m³ water, and frost events averted across all farms using the app today. The
pitch deck slide 1 and the landing page both call it live and render the big
number. During the live demo you refresh the screen and the number ticks up.

**Why wins jury**: World Bank loves **one headline number**. It converts
"interesting app" into "measurable regional impact" in 3 seconds. Mtel loves
numbers that can be plotted on a TV ad. Demo-friendly.

**Effort**: 1 day. Backend: 1 endpoint + 1 Postgres table. Frontend: 1
`useImpact()` hook + animated counter on the hero slide.

### 2. Pilot letter of intent (not code — paperwork)
**What**: One signed LOI from an agricultural cooperative (e.g.
*Poljoprivredna zadruga Plantaže* in Montenegro, *Poljoprivredni fakultet
Sarajevo*, or a regional IPARD-accredited advisory body) saying "we agree
to pilot AgroMind with 50 farms in 2026 if the team wins".

**Why wins jury**: Converts you from "startup idea" to "startup with demand
signal". Single biggest ROI item on this list. One email + one follow-up call.

**Effort**: Zero code. 2-3 outreach emails.

### 3. 60-second farmer testimonial video
**What**: Record one real farmer (Podgorica, Mostar, Novi Sad) using the app,
pinning their field, and saying in their own words "I lost 30% of my apricots
in April 2024, this would have warned me 48 hours earlier". Embed in slide 3.

**Why wins jury**: Emotion + face + real accent > any chart. Judges who don't
understand ML *do* understand "that farmer's kid won't have to emigrate".

**Effort**: 1 phone call, 30 minutes of editing. Shoot on iPhone.

### 4. "Frost Alert" live SMS / WhatsApp push during the pitch
**What**: Immediately before the 3-minute pitch, pre-schedule a real push
notification that lands on the demo phone in slide 6: *"URGENT — Frost
02:00 tonight. Cover your vineyard. AgroMind."* Phone on the podium
buzzes mid-sentence. You pick it up.

**Why wins jury**: Unforgettable theatrical moment. Every other team's demo
is Figma or localhost. Yours has a real phone buzzing.

**Effort**: Half a day (expo-notifications + Twilio free trial). Already
planned as PR B.

### 5. One-tap **CAP / IPARD subvencije application generator**
**What**: Extend the existing Subsidy Match card with a "Generate
application form (PDF)" button. Pre-fills the farmer's name, location,
crops, and selected measure onto the real CG/BiH/SRB ministry PDF template.
Shareable via email or WhatsApp.

**Why wins jury**: Government partners on the jury care about this more than
AI. It's a direct pipeline from AgroMind → ministry disbursement. One of the
few items on this list that **ministries will actively promote on your behalf**.

**Effort**: 2 days. `pdf-lib` + the 3 ministry templates.

---

## Tier A — Technical moats (ship before demo if time allows)

### 6. Farmer-facing **voice assistant** in BS/SR
**What**: "Hej AgroMind, koliko vode treba mom krompiru?" → spoken answer
from GPT-4o with farm context + frost/irrigation/NDVI data. Whisper STT
+ GPT + TTS. Montenegro has ~5% smartphone literacy gap; voice crosses it.

**Why wins jury**: First voice-first agri assistant in Adriatic region.
Accessibility signal + tech moat.

**Effort**: 1.5 days.

### 7. "Farm Risk Radar" — single-screen 12-month heatmap
**What**: One slide in the app: rows = months, columns = risk categories
(frost, drought, disease, hail), cells = red/amber/green. One look, one
decision. Generated from 20-year historical + current forecast.

**Why wins jury**: Visual clarity. Judges remember **one image** per team;
make yours this one.

**Effort**: 1 day.

### 8. **Multi-field** + field-level journal with photos
**What**: Real farmers have 3–10 parcels. Let them pin multiple fields, each
with its own crop + journal (date-stamped notes, photos). Photos go into a
local SQLite + cloud sync.

**Why wins jury**: Converts "demo app" into "platform". Retention story.

**Effort**: 2 days.

### 9. **Yield forecast** card — translate everything into t/ha and €
**What**: End-of-season yield estimate per crop combining NDVI trajectory,
GDD accumulation, frost/disease events. Shown in `t/ha` and projected €
at current market price (Mercatus / RZS / Agencija za plaćanja).

**Why wins jury**: Business-minded jurors understand yield, not AUC.
Market-price integration is a **unique differentiator** — Climate Fieldview
doesn't do it for the Balkans.

**Effort**: 2-3 days.

### 10. **Offline-first** (mandatory for mountain farms)
**What**: AsyncStorage cache + service-worker-style mutation queue. All
dashboard data loads instantly from cache; stale banner + retry when back
online.

**Why wins jury**: Directly answers "will this work in Durmitor where
there's no signal?" — a question *someone* in the jury will ask.

**Effort**: 1 day (most of this is already there; finalise the policy).

---

## Tier B — Growth & community (post-pitch, but say it out loud)

### 11. **Local field knowledge graph** — "your neighbours planted this week"
Anonymised aggregate: shows what your 10 nearest farms sowed, when, and
early yield outcomes. Creates network effect (every new farm makes the
map more valuable).

### 12. **Insurance integration** (Sava, Dunav, Grawe ME)
Auto-populate insurance claim form when app detects a frost / hail event.
Insurance companies pay commission per successful claim — B2B2C revenue.

### 13. **Gamification & leaderboards**
"You saved 12 m³ of water this week — top 3% in Zeta valley." Drives
retention without feeling like a toy.

### 14. **Expert Q&A marketplace**
Farmers post photos of disease → university agronomists (Poljoprivredni
fakultet Podgorica / Sarajevo / Novi Sad) answer within 2h for a fee.
Revenue share.

---

## Tier C — Deliberately **do NOT** ship (would distract)

- AR overlay / 3D field visualisation
- Drone control
- Blockchain "farm token"
- NFT crop passports
- On-chain subsidy disbursement

Every hackathon has 3 teams shipping these. Judges roll their eyes. Avoid.

---

## 3-minute pitch structure optimised for this jury

0:00 — **Hook**: "Last April, Serbian farmers lost 200,000 tons of
apricots in one frost night. Most of them had a smartphone in their pocket
but no warning." (Slide 1 — live impact counter.)

0:25 — **Problem**: 935k farms in CG/BiH/SRB. 78% smartphone penetration.
Zero regional AI advisor. Climate Fieldview is €600/yr and English-only.
(Slide 2 — market numbers with sources.)

0:55 — **Solution**: Live demo. Pin farm in Podgorica → dashboard fills in
8 seconds → AI Models card shows AUC 0.994 live from /health. Phone buzzes
mid-demo with pre-scheduled URGENT frost alert. (Slides 3-6.)

1:45 — **Traction**: "Signed LOI with *[cooperative]* for 50-farm pilot Q2
2026. Backend live on Railway, 1,200 API calls already served." (Slide 7.)

2:15 — **Business**: Freemium (free) + Pro €5/farm/mo + B2B cooperative
tier (€2k/yr) + IPARD fee share (2% of €128M envelope = €2.5M TAM). (Slide
8.) €1.2M ARR Year 3 conservative. (Slide 9.)

2:40 — **Ask**: "World Bank Climate-Smart grant + Mtel distribution
partnership to reach 50k farms by 2027." (Slide 10.)

3:00 — Stop talking. The counter on screen is still ticking up from live
AWS + Sentinel API calls. Silence for 2 seconds. Q&A.

---

## The one thing you must internalise

**Judges do not care how the AI works.** They care about:
1. Is there demand? (Show pilot LOI.)
2. Will it scale? (Show market size + channel partner.)
3. Is the team the right team? (Show founder + agronomist advisor.)
4. Does it matter to the region? (Show impact counter + farmer video.)

Everything in Tier S above answers one of those four questions. Everything
in Tier A is technical polish that **only matters if Tier S is already
solid**. Prioritise Tier S even at the cost of code quality.
