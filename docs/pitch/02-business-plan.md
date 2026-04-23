# AgroMind — Business Plan

**Version:** 1.0 | **Target:** Adria Future Hackathon 2026 / AFS Pitch Stage
**Markets:** Montenegro, Bosnia and Herzegovina, Serbia (Adria region)

---

## 1. Executive Summary

**One-liner:** *AgroMind is the first smallholder-first agricultural AI assistant built for
the Adria region, turning EU-grade climate and satellite data into "do this today" advice
in the farmer's own language.*

**Mission:** Protect 1 million smallholder farmers in the Western Balkans from climate loss
by 2030, using the same EU-standard science (Copernicus, FAO-56, TOMCAST, ML) that global
giants sell to commercial agribusiness — at a price a family farm can afford.

**Problem.** 2024 and 2025 produced two back-to-back catastrophic frost + drought seasons
in the Adria region. Serbia alone lost **200,000+ tons of fruit** in 2024; Montenegro and
BiH similar orders on per-hectare basis. Existing tools are: (a) enterprise SaaS priced at
€1,000+/yr targeting 500-ha row-crop farms; (b) passive information portals; or (c) admin
e-government systems that *describe* subsidies but don't *help* anyone farm. **No product on
the market gives a 5-ha apricot grower in Bijelo Polje, Tuzla or Šumadija a Bosnian-language
push alert saying "Frost risk 94% at 03:00 — start sprinkler defence now."**

**Solution.** A single-screen mobile app that pins the farmer's land on the map and, for
each crop, delivers daily:
1. **Smart Irrigation** — FAO-56 ET₀ water balance + LLM advisory → mm to apply.
2. **Frost Prediction AI** — gradient-boost ML (AUC 0.994) trained on 20-year ECMWF archive,
   14-day per-crop risk + optimal planting date.
3. **Disease & Pest Risk** — peer-reviewed epidemiology models (Smith Periods for late
   blight, TOMCAST DSV for early blight, Septoria / Fusarium / rust rules) → per-disease
   traffic light with spray windows.
4. **Satellite NDVI** — Copernicus Sentinel-2 at 10 m → field vigour trend.
5. **ROI Tracker** — "This season AgroMind saved you €X, Y m³ of water, Z frost events."
6. **Subsidy Match (IPARD)** — surfaces the exact open calls matching this farm's crop,
   size, age and location.

**Traction to date.**
- 2 FastAPI backends in production on Railway (agromind2, agro-predict), 99.5%+ uptime.
- 8 merged feature PRs, full TypeScript type-safety across client and server.
- ML frost model: AUC **0.994** on held-out test set.
- Zero paid marketing; product-led roadmap.

**Ask.** €250,000 seed over 18 months to reach 10,000 active farmers and €200k ARR.

---

## 2. Market (see 01-market-research.md for full sourcing)

| Band | Farms       | ARPU blended | Ceiling   |
|------|-------------|--------------|-----------|
| TAM  | 935,000     | €60 / yr     | €56 M     |
| SAM  | 210,000     | €60 / yr     | €12.6 M   |
| SOM5 | 17,000      | €72 / yr     | **€1.2 M ARR** |

**Beachhead:** Montenegro (26,711 holdings, €128 M IPARD III pipeline, Government strategic
partner for Summit). Prove the playbook here in 6 months → expand RS/BiH.

---

## 3. Product

### 3.1 Feature → Unit of Value

| Feature              | What it produces           | Why the farmer pays                                   |
|----------------------|----------------------------|--------------------------------------------------------|
| Smart Irrigation     | mm/day rec + explanation   | 15–30% water savings (FAO efficiency benchmarks)       |
| Frost Prediction     | 14-d frost %, optimal date | Prevents €3–6 k/ha loss in stone-fruit frost years     |
| Disease & Pest Risk  | Spray window per disease   | Cuts preventive spraying 20–40%, avoids yield loss     |
| Satellite NDVI       | Field vigour trend         | Detects stress weeks before visible damage             |
| Climate History      | 20-yr localised trends     | Evidence base for IPARD business plans & insurance     |
| ROI Tracker          | "Saved €X this season"     | **Retention driver** — makes value explicit             |
| Subsidy Match        | IPARD open-call matching   | Direct € to farmer; **primary acquisition channel**    |

### 3.2 Technical architecture (why it is defensible)

```
┌────────────────┐  ┌─────────────┐  ┌────────────────────┐  ┌────────────────┐
│ React Native   │  │ FastAPI      │  │ FastAPI (ML)       │  │ 3rd-party data │
│ Expo (iOS+And) │──│ agromind2    │──│ agro-predict       │──│ Copernicus     │
│ i18n EN / BS   │  │  /irrigation │  │  /predict          │  │ Sentinel-2     │
│ AsyncStorage   │  │  /disease    │  │  /crops            │  │ Open-Meteo     │
│                │  │  /ndvi       │  │                    │  │ ECMWF Archive  │
│                │  │              │  │                    │  │ OpenAI         │
└────────────────┘  └─────────────┘  └────────────────────┘  └────────────────┘
```

**Defensibility layers:**
1. **Proprietary ML** trained per-country on 20-yr local data — AUC 0.994. Competitors
   train globally; we outperform locally.
2. **Regional disease corpus** — Smith period thresholds calibrated for Western Balkan
   apricot/cherry/plum phenology; not off-the-shelf.
3. **Localised UX** — only consumer agri-app shipping with Bosnian first-class. Network
   effect: farmer shares with neighbour *in his own language*.
4. **EU compliance** — Copernicus + GDPR + IPARD-aligned data trail. Commercial competitors
   from US (Bayer, Climate) don't have this story.

---

## 4. Business Model

### 4.1 Pricing

| Tier      | Price       | Who                         | Features                                           |
|-----------|-------------|-----------------------------|---------------------------------------------------|
| **Free**  | €0          | All users, indefinitely     | Live weather, 1 field, 1 crop, basic forecasts     |
| **Pro**   | €4.99 / mo  | Active smallholders         | 5 fields, all AI modules, push alerts, ROI tracker |
|           | €39.99 / yr | (2 months free on annual)   |                                                   |
| **Farm**  | €14.99 / mo | Commercial farms (10–100 ha)| 25 fields, multi-user, PDF reports, priority support |
|           | €129.99 / yr|                             |                                                   |
| **Enterprise** | from €499 / mo | Coops, extension services | Unlimited, white-label, custom ML, API access      |

**Government / institutional pricing:** Per-country bulk licences with Ministries of
Agriculture at €1–2 / farmer / yr for full IPARD-advisory capability; goal is to have one
of CG/BiH/RS signed within 12 months as an anchor.

### 4.2 Unit economics (Year 2 steady state)

Per Pro-tier paying farmer:

| Line                                     | Monthly        |
|------------------------------------------|----------------|
| **ARPU (Pro annual paid)**               | **€3.33**      |
| OpenAI (1 daily advisory / crop, ~15k tokens/mo) | −€0.05   |
| Sentinel Hub (CDSE free tier)            | −€0.00         |
| Open-Meteo (free)                        | −€0.00         |
| Infra (Railway, per active user share)   | −€0.08         |
| Payment processing (Stripe 1.9 %)        | −€0.06         |
| Customer support (outsourced)            | −€0.10         |
| **Gross margin / farmer / month**        | **€3.04 (91%)** |
| **Gross margin / farmer / year**         | **€36.48**     |

**CAC target:** €6 per paying user (community-led + gov-ministry co-marketing).
**Payback:** ~2 months. **LTV / CAC:** ~12× on 3-year retention assumption.

### 4.3 Revenue streams

1. **Consumer SaaS subscriptions** (core, 60% of Y3 revenue).
2. **Government extension contracts** — Ministry of Agriculture per-farmer licences (25%).
3. **Insurance partnerships** — premium discount for AgroMind users, revenue share (10%).
4. **Agri-input partnerships** — contextual, opt-in recommendations with disclosure (5%).

We do **NOT** monetize farmer data. Data never leaves on-device storage or is sold.

---

## 5. Go-to-market

### Phase 1 — Montenegro (months 0–6)
- **Government anchor:** Sign MoU with Montenegro Ministry of Agriculture leveraging
  existing Summit/IPARD III relationship. Gov co-announces AgroMind at next IPARD call.
- **Physical activation:** Cooperatives and agri-advisory centres (*savjetodavna
  služba za poljoprivredu*). 3 of them = coverage of 80% active farmers.
- **Content:** Short-form video in BS/ME on TikTok / Facebook Reels — real farmers, real
  fields, real saves. Farmer Facebook groups (10k+ members each in CG).
- **Goal month 6:** 3,000 downloads, 600 active, 180 paying (€720 MRR).

### Phase 2 — Serbia (months 6–12)
- Pivot language to Serbian (Latin + Cyrillic both required).
- Partnership with NALED / eAgrar as the farmer-facing layer on top of the government admin
  system. eAgrar fulfils admin obligations; AgroMind tells farmers *what to do*.
- Google Ads on "mraz jabuka", "navodnjavanje kukuruza" long-tail.
- **Goal month 12:** 25,000 downloads, 5,000 active, 1,500 paying (€6k MRR, €72k ARR).

### Phase 3 — BiH + expansion (months 12–18)
- Launch in both entities simultaneously — BS already shipping, minor SR-Cyrillic work.
- Co-op partnerships with Federation and RS Ministries of Agriculture.
- **Goal month 18:** 60,000 downloads, 12,000 active, 4,500 paying (€18k MRR, €216k ARR).

### Year 3 — profitability and Adria expansion
- Albania (AL language), North Macedonia (MK).
- First enterprise B2B deal closes (Delta Agrar, MK Group, Carmeuse-style processor).
- **Goal year 3:** 100,000 downloads, 25,000 active, 10,000 paying (€420k ARR); cash-flow
  positive.

---

## 6. Three-year financials (base case)

All figures in €. Conservative; farmer counts drawn from Phase goals above; assumes free-tier
funnel of **4× paying user count** (observed in comparable Balkan consumer-app benchmarks).

| Line (€)                          | Year 1    | Year 2    | Year 3    |
|----------------------------------|-----------|-----------|-----------|
| Paying farmers (year-end)         | 1,500     | 4,500     | 10,000    |
| Avg paying farmers in year        | 600       | 3,000     | 7,200     |
| Consumer subscription revenue     | 26,000    | 130,000   | 310,000   |
| Government contract revenue       | 0         | 60,000    | 110,000   |
| Insurance / B2B revenue           | 0         | 0         | 25,000    |
| **Total revenue**                 | **26,000**| **190,000**| **445,000** |
| — Cost of serving users           | −12,000   | −32,000   | −68,000   |
| — R&D / engineering (3 FTE)       | −80,000   | −150,000  | −180,000  |
| — Sales & marketing               | −40,000   | −80,000   | −120,000  |
| — G&A                             | −20,000   | −30,000   | −45,000   |
| **EBITDA**                        | **−126,000** | **−102,000** | **+32,000** |
| Cumulative cash burn              | −126,000  | −228,000  | −196,000  |

**Break-even month:** ~ month 32 (Q3 Y3). Seed of €250k covers burn with €20k buffer.

---

## 7. Team

| Member        | Role                       | Why this person                              |
|---------------|----------------------------|----------------------------------------------|
| Norda Jakupović | Co-founder / CEO, Product  | Full-stack engineer, product-led; owns roadmap |
| [Team-mate 2]  | Co-founder / CTO, ML       | ML engineering + agri-data; owns models     |
| [Team-mate 3]  | Co-founder / COO, GTM      | Agronomy / regional agribusiness network    |
| *Advisor TBC*  | Agronomy advisory          | Univ. of Montenegro Biotech Faculty         |

(Team members 2 and 3 are placeholders — fill in before pitch with actual co-founders.
Replace bracketed text with real names, one-line bios, and LinkedIn URLs.)

---

## 8. Ask

**€250,000 seed** (€200k SAFE + €50k grant / non-dilutive where available)
for **18 months of runway** to:
- **€120k** — 3 FTE engineering + 1 part-time agronomist.
- **€70k** — Growth: content production, physical activation in CG + RS, Ministry MoU
  execution costs.
- **€30k** — Infrastructure, data licences, ML retraining compute, OpenAI budget.
- **€20k** — Legal, GDPR compliance, insurance, buffer.

**Return expectation:** at end of month 18, seed investor sees **€216k ARR, 12,000 MAU,
4,500 paying farmers, signed Ministry-of-Agriculture MoU in at least one country** — a
valuation inflection typical of seed → Series A of 4–6×.

**Why now, why us:** This is a 10-year market opportunity opening up right now as the
Western Balkans digitalises agriculture under IPARD III pressure. Global players will
not come here first; local players aren't building AI. The first team to win hearts
in BS/ME/SR owns this market. We already have a product farmers can download today.

---

## 9. Appendix — Milestones

| Month | Milestone                                                          |
|-------|--------------------------------------------------------------------|
| M+1   | Win Adria Future Hackathon 2026 (target)                           |
| M+2   | Sign Montenegro Ministry of Agriculture MoU                         |
| M+3   | Launch public v1.0 on App Store + Play Store, 1,000 downloads      |
| M+6   | 3,000 downloads CG, first 180 paying; activate RS language beta    |
| M+9   | 10,000 downloads across CG+RS; 800 paying                           |
| M+12  | €72k ARR, 1,500 paying; BiH launch; €250k seed closed              |
| M+18  | €216k ARR, 4,500 paying; seed-extension or Series A process begins |
