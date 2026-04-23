# AgroMind — Pitch Deck (12 slides, Adria Future Hackathon 2026)

> **Speaker mode:** 3-minute pitch. Each slide = one idea, one number, one line of narration.
> Slide bodies below include both the visible text and the speaker's line in italics.
> Build the real slides in Figma/Keynote using the visual direction in `05-visual-direction.md`.

---

## Slide 1 — Title

```
AgroMind
Protecting 1 million Western Balkan farmers from climate loss.

Adria Future Hackathon 2026 · Porto Montenegro
[Team: Norda Jakupović · <Co-founder 2> · <Co-founder 3>]
```

*"Last spring, Serbia's farmers lost 200,000 tonnes of fruit in a single frost night.
That didn't have to happen. I'm <Name>, and we built AgroMind so it doesn't happen again."*

---

## Slide 2 — The problem (hero stat + human face)

```
In 2024, Serbia lost 200,000 tonnes of fruit to spring frost.
In 2025, 80% of apricots and 70% of early cherries — gone.

2 back-to-back disaster years.
935,000 Western Balkan farms exposed.
Zero tools in their language telling them what to do.
```

*"Vesna farms 2 hectares of apricots outside Smederevo. Last April she lost 80% of her crop.
A €150 anti-frost sprinkler triggered 6 hours earlier would have saved everything.
She didn't get the alert — because there isn't a Serbian-language product that gives one."*

---

## Slide 3 — Why this is a 10-year opening

```
Three tailwinds converging — now.

1. Climate. Balkan's hottest summer on record (2024). Frost events now annual.
2. EU money. IPARD III: €128M Montenegro · €580M Serbia · IPARD-coming BiH.
3. Smartphones. 78% rural penetration. First time the market is reachable.

The tool that wins hearts in BS / ME / SR owns a €56M / yr TAM for a decade.
```

*"Climate change is turning once-a-decade disasters into annual ones. At the same time the
EU is pouring a billion euros into Western Balkan agriculture. And smartphones finally
reached the villages. First mover advantage starts this year."*

---

## Slide 4 — Solution (one screen, four intelligences)

```
AgroMind is one app, four AIs, one farmer.

• Smart Irrigation    →  FAO-56 ET₀ + GPT → "apply 18 mm tonight"
• Frost Prediction    →  ML model (AUC 0.994) → 14-day risk per crop
• Disease & Pest      →  Smith + TOMCAST → spray-window alerts
• Satellite NDVI      →  Copernicus Sentinel-2 → field vigour trend

All in Bosnian. All free tier included. €4.99/mo for Pro.
```

*"Pin your field on the map once. From then on, AgroMind reads Copernicus satellites,
Open-Meteo forecasts, and our trained ML models, and sends you three things:
how much to water, when to spray, and when frost is coming.
In your language. On your phone. For five euros a month."*

---

## Slide 5 — LIVE DEMO

```
LIVE
30-second demo — farm in Bijelo Polje, Montenegro

1. Pin location on map → onboarding
2. Dashboard auto-populates in Bosnian
3. Frost risk 94% tonight → push notification fires live
4. ROI card: "This month: saved €87, 12,000 L water, 2 frost events"

[See demo video backup if wifi fails]
```

*[Hand device / screenshare to judges. Read the notification aloud. Click ROI card.
Hand back. Return to slides.]*

---

## Slide 6 — Why us: real science, not a GPT wrapper

```
Every feature is grounded in peer-reviewed agronomic science.

Irrigation    →  FAO Irrigation & Drainage Paper 56 (ET₀ water balance)
Frost         →  Gradient-Boosting ML trained on 20 yrs ECMWF archive, AUC 0.994
Late blight   →  Smith Periods (UK DEFRA decision support)
Early blight  →  TOMCAST DSV (Cornell / Penn State model)
Wheat disease →  Septoria / Fusarium / rust thresholds (EIP-AGRI)
Satellite     →  Sentinel-2 L2A, NDVI at 10 m (Copernicus CDSE)

GPT-4o-mini only translates these decisions to Bosnian plain language.
```

*"We don't replace agronomists with chatbots. We run the same models they use —
the ones Bayer charges a thousand euros a year for — and we deliver the decisions
in Bosnian, on the cheapest phone, for five euros."*

---

## Slide 7 — Market & competition

```
TAM  · 935,000 holdings in CG + BiH + RS          €56 M / yr
SAM  · 210,000 smartphone-enabled smallholders    €12.6 M / yr
SOM5 · 17,000 paying farmers (Y5, 8% of SAM)      €1.2 M ARR

Competition we disrupt:
• xFarm (€100–350/module/yr, EN/IT) — too expensive, wrong language
• Climate FieldView (Bayer) — not localised, not smallholder
• AgroLIFE (RS, B2B) — big farms only, no prediction AI
• eAgrar (RS govt) — admin only, no advisory

White space we own: smallholder, Adria-localised, €4.99 consumer.
```

*"Nobody is building for the farmer with 5 hectares. Everyone's either selling enterprise
software to agribusiness or shipping passive government portals. We are the only consumer
product in this space, in this language, at this price."*

---

## Slide 8 — Business model

```
Freemium SaaS · 4 tiers

Free    — 1 field, 1 crop, live weather                 (acquisition)
Pro     — €4.99/mo — 5 fields, all AI, push alerts       (core revenue)
Farm    — €14.99/mo — 25 fields, PDF reports             (commercial)
Enterprise — from €499/mo — coops, ministries, API       (anchors)

Unit economics @ Pro: 91% gross margin · €0.05 LLM cost · ~2-month CAC payback
```

*"Our unit economics are ridiculous because AI inference now costs five cents per farmer
per month. A Pro subscription is 91% margin, Stripe payback under two months."*

---

## Slide 9 — Go to market

```
M+0  →  Win this hackathon (target)
M+2  →  Sign MoU with Montenegro Ministry of Agriculture (Summit relationship)
M+3  →  Public launch on App Store / Play Store
M+6  →  3,000 downloads CG, 180 paying (€720 MRR)
M+12 →  Add Serbia + BiH, 1,500 paying (€72k ARR), IPARD-advisory live
M+18 →  4,500 paying, €216k ARR, seed extension or Series A
Y3   →  10,000 paying, €445k revenue, cash-flow positive
```

*"Montenegro is our beachhead. 26,000 farms, €128M of IPARD III money flowing, and a
government literally hosting us at this Summit. We win here in six months, then replicate
the playbook in Serbia and Bosnia."*

---

## Slide 10 — Traction

```
Already shipped and running in production:

• 2 FastAPI backends live on Railway           99.5% uptime
• Frost-prediction ML                           AUC 0.994
• 8 merged feature PRs                          TypeScript end-to-end
• Full i18n EN + BS                             Serbian shipping Q3 2026
• Satellite NDVI via Copernicus CDSE            Free tier sufficient at scale
• Smith + TOMCAST disease models                Calibrated for regional cultivars

This is not a prototype. It is a product.
```

*"Every feature on this slide runs today. I'll send the APK to every judge in this
room after the pitch. You can pin your own farm on it tonight."*

---

## Slide 11 — The team

```
Norda Jakupović       Co-founder / CEO · full-stack engineer, product
<Co-founder 2>        Co-founder / CTO · ML + data engineering
<Co-founder 3>        Co-founder / COO · agronomy & regional GTM

Advisor (TBC): Prof. <…>, Biotechnical Faculty, University of Montenegro

All three under 35. All three from the region we are serving.
```

*"Three founders, under thirty-five, from the countries we serve.
We know the farmer because the farmer is our grandfather."*

---

## Slide 12 — The ask

```
€250,000 SEED · 18 months runway

• €120k  Engineering (3 FTE) + agronomist
• €70k   Growth: content, activation, MoU execution in CG + RS
• €30k   Infra, data, ML retraining, OpenAI
• €20k   Legal, GDPR, insurance, buffer

→ 4,500 paying farmers · €216k ARR · Ministry MoU signed
→ Series A-ready inflection at month 18

Join us in protecting 1 million farmers by 2030.
```

*"We're raising two hundred fifty thousand euros to reach four and a half thousand paying
farmers in eighteen months. Western Balkan farmers are running out of seasons. We're not.
Let's give them the best ten years of harvests they've ever had. Thank you."*

---

# Appendix slides (keep in deck, show only if asked)

## A1 — Three-year P&L (base case)
| Line                                | Year 1 | Year 2  | Year 3  |
|-------------------------------------|--------|---------|---------|
| Paying farmers (year end)           | 1,500  | 4,500   | 10,000  |
| Total revenue                       | €26k   | €190k   | €445k   |
| EBITDA                              | −€126k | −€102k  | +€32k   |

## A2 — Unit economics per Pro farmer / month
ARPU €3.33 · LLM €0.05 · Infra €0.08 · Stripe €0.06 · Support €0.10 → **€3.04 margin (91%)**

## A3 — Risks and mitigations
| Risk                                  | Mitigation                                        |
|---------------------------------------|---------------------------------------------------|
| Low willingness to pay                | IPARD co-funding · Gov anchor · insurance         |
| Weather API outages                   | Dual-provider · AsyncStorage 24-h cache           |
| GDPR / data sovereignty               | On-device storage · no PII on backend             |
| Regional ML drift                     | Retrain annually per country                      |
| Language coverage                     | EN + BS shipped · SR + AL Year 2                  |

## A4 — Why Copernicus / EU tech stack matters
All data sources are European — Sentinel-2, Open-Meteo, ECMWF. Auditable. IPARD-aligned.
No US-dependent cloud vendor lock-in. A story EU judges, World Bank and Montenegro
Government all recognise.

## A5 — Scientific references (one-line each)
FAO-56 (Allen et al. 1998) · Smith 1956 · TOMCAST (Madden et al. 1978) · Sentinel-2 L2A
handbook (ESA) · World Bank WB6 CCDR 2024 · Paraušić et al. 2025 JCEA.
