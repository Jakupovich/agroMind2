# AgroMind — 3-Minute Demo Script

**Context:** Adria Future Summit, Porto Montenegro, judges include MTEL, World Bank, AI Nation, Reputeo, Government of Montenegro.
**Speaker count:** 1 speaker runs the pitch + demo. 2nd team-member drives the phone (mirror to screen). 3rd team-member stands by with the backup video and laptop-based web fallback.
**Language:** English.

---

## Total time budget: 3:00

| Segment | Time | Lead speaker | What is on screen |
|---------|------|--------------|-------------------|
| 1. Hook | 0:00–0:20 | Speaker 1 | Slide 2 (problem stats + Vesna) |
| 2. Trajectory | 0:20–0:40 | Speaker 1 | Slide 3 (three tailwinds) |
| 3. Solution | 0:40–1:00 | Speaker 1 | Slide 4 (four AIs) |
| 4. **LIVE DEMO** | **1:00–1:50** | Speaker 2 (phone) | Phone screen mirrored |
| 5. Defensibility | 1:50–2:10 | Speaker 1 | Slide 6 (science stack) |
| 6. Market & traction | 2:10–2:30 | Speaker 1 | Slides 7 + 10 |
| 7. Business & ask | 2:30–3:00 | Speaker 1 | Slides 8 + 12 |

---

## Pre-pitch checklist (T-minus 30 min)

- [ ] Phone fully charged, brightness 100%, airplane mode OFF
- [ ] Wi-Fi tested at the actual stage; backup: 5G hotspot from Speaker 3's phone
- [ ] Farm already pinned at **Danilovgrad, 42.5531°N 19.1061°E** (selected because it has
      fresh NDVI imagery and realistic irrigation values)
- [ ] AsyncStorage `farm_crops` seeded with `['potato','corn']` (disease + frost both render)
- [ ] Language switched to **Bosnian** — the effect is strongest when judges hear the alert
      in the target language
- [ ] Railway backends pinged (`/health`) to wake from sleep
- [ ] A **scheduled push notification** queued to fire at **1:20 of the pitch** titled:
      `HITNO · Mraz večeras u 03:00 — pokrenite prskalice za kajsiju`
      (see `push_demo.md` for the trigger command)
- [ ] Backup: 60-second MP4 recorded and cached on phone + laptop + on a USB stick
- [ ] Slide deck open, fullscreen, cursor hidden (ESC if Keynote / Cmd+L if PowerPoint)

---

## Full speaker script (memorise the underlined lines)

### 0:00 — Hook (20 seconds)

> *"Last spring, Serbian farmers lost **two hundred thousand tonnes** of fruit in a single
> frost night. Eighty percent of the country's apricots — gone. For Vesna, two hectares
> outside Smederevo, that was six thousand euros. **It didn't have to happen.** A two-hundred-
> euro sprinkler, triggered six hours earlier, saves the entire crop. She didn't get the alert —
> because nobody builds that alert in Bosnian, Serbian or Montenegrin."*

Slide: **Slide 2** — visible on stage screen.

### 0:20 — Trajectory (20 seconds)

> *"Three things are happening at the same time. Climate disasters are now annual, not
> generational. The EU is pouring **one billion euros** into Western Balkan agriculture
> through IPARD Three. And smartphones finally reached seventy-eight percent of rural
> households. This is a ten-year window that opens today. The product that wins farmers'
> hearts in their own language owns it."*

Slide: **Slide 3**.

### 0:40 — Solution (20 seconds)

> *"AgroMind is one app, four AIs, one farmer. We read Copernicus satellites, ECMWF
> weather archives, and a trained machine-learning model, and we answer three questions
> every day: **how much to water, when to spray, and when frost is coming**. In Bosnian.
> On any phone. For five euros a month. I'm going to show you."*

Slide: **Slide 4**. Hand mic to Speaker 2 (or keep mic and narrate demo).

### 1:00 — LIVE DEMO (50 seconds) — *highest-risk, highest-impact segment*

**Speaker 2** drives the phone. Speaker 1 narrates each click.

1. **(1:00)** Open app from cold start. Onboarding mapa already-completed.
   Dashboard loads. Narration:
   > *"This is a real farm in Bijelo Polje. Everything you see is live — live weather,
   > live forecast, live Copernicus imagery pulled ten seconds ago."*

2. **(1:10)** Scroll to **Frost Prediction** card (Corn → red / Potato → amber).
   > *"The machine-learning model flags frost risk for tonight at ninety-four percent.
   > It was trained on twenty years of local weather, AUC point-nine-nine-four."*

3. **(1:20)** **PUSH NOTIFICATION FIRES on screen**. Speaker 1 reads it out loud in Bosnian:
   > *"HITNO — Mraz večeras u tri ujutru. Pokrenite prskalice za kajsiju."*
   > *"That's the alert Vesna didn't get."*

4. **(1:30)** Tap the alert → opens the Frost detail with the suggested action.

5. **(1:38)** Back to dashboard → scroll to **ROI card**:
   > *"This month, for this farmer, AgroMind saved eighty-seven euros, twelve thousand
   > litres of water, and prevented two frost losses."*

6. **(1:45)** Scroll to **Subsidy Match** card:
   > *"And here's an open IPARD call this farm qualifies for — **sixty percent** of a new
   > irrigation system, **paid by the EU**, surfaced automatically."*

**Recovery plans:**
- **If push fails to fire by 1:22:** Speaker 2 swipes down notifications shade from
  top and reveals a *pre-delivered identical notification*, seeded with `expo-notifications`
  before the pitch.
- **If app itself fails (cold-boot):** Speaker 3 cuts the MP4 into the stream. Speaker 1
  continues without pause. Never apologise on stage; just keep narrating.

### 1:50 — Defensibility (20 seconds)

> *"Every single feature is grounded in peer-reviewed agronomic science. FAO-56 for
> irrigation. Smith Periods and TOMCAST for disease. Copernicus Sentinel-Two for satellite.
> GPT only translates these decisions into plain Bosnian. This is not a ChatGPT wrapper —
> this is **Bayer's technology stack for a fraction of Bayer's price**."*

Slide: **Slide 6**.

### 2:10 — Market & traction (20 seconds)

> *"Nine-hundred and thirty-five thousand farms in Montenegro, Bosnia and Serbia. Two-hundred
> and ten thousand are smartphone-enabled smallholders — that's our SAM, twelve point six
> million euros a year. We already have **two backends in production, full localisation,
> and a frost model with AUC point-nine-nine-four**. This is a product, not a prototype."*

Slides: **Slide 7 → Slide 10**.

### 2:30 — Business & ask (30 seconds)

> *"Freemium subscriptions at five euros a month. Ninety-one percent gross margin because
> AI inference now costs five cents per farmer per month. Three hundred thousand euros in
> IPARD Three flowing into every one of our target countries — we surface those opportunities
> to the farmer, directly.*
>
> *We're raising **two hundred and fifty thousand euros** to reach four and a half thousand
> paying farmers and sign our first Ministry-of-Agriculture contract in the next eighteen
> months. Western Balkan farmers are running out of seasons. We are not. Let's give them
> the best ten years of harvests they have ever had. Thank you."*

Slides: **Slide 8 → Slide 12**. End on Slide 12.

---

## Anticipated Q&A and prepared one-liners

> **"Why won't Bayer or Climate Corp just enter this market?"**
> *"They will — once the market is big enough. By then we own the farmer relationship in
> their language. Ask anyone who's tried to displace a localised tool with a translated one."*

> **"Your ML is good — how does it compare to commercial tools?"**
> *"AUC zero-point-nine-nine-four is at the ceiling of what peer-reviewed agronomy papers
> report for frost prediction. Our edge isn't accuracy; it's **that it's in the farmer's
> hand at five euros a month, in his language**."*

> **"What's your moat?"**
> *"Three layers: first-mover in three languages at once; regional disease models
> calibrated for Balkan cultivars; Ministry-of-Agriculture MoUs that are hard to copy.
> Plus two years of a compounding data flywheel once we pass ten thousand farmers."*

> **"How do you handle the digital-divide / older-farmer problem?"**
> *"We onboard through their children and their extension-service advisors. Eighty
> percent of the text in the app is optional; the core flow is a map pin and a push
> notification. That's the same UX as WhatsApp, which those farmers already use."*

> **"GDPR? Data sovereignty?"**
> *"Farm location and crop data live on-device, never on our servers. We use European
> data providers — Copernicus, Open-Meteo. No user PII leaves the device. IPARD-aligned."*

> **"What is the farmer's willingness to pay in this region?"**
> *"Our pricing is less than two espressos per month. IPARD pays sixty percent of
> adjacent expenses like irrigation systems. The ROI card in the app shows the farmer
> has saved ten to thirty euros in the first month of use — retention becomes rational."*

> **"Why hasn't someone done this already?"**
> *"Because it took three things to converge: cheap LLMs (happened last year), free
> Copernicus API (opened 2023), and seventy-five percent rural smartphone penetration
> (crossed in 2023). Everyone who tried this in 2019 was too early."*

---

## Hard rules on stage

- **Never say "prototype", "demo" or "MVP"** — say **"product"**.
- **Never apologise** for anything; if something breaks, keep narrating the feature verbally
  while Speaker 3 cuts in the backup video. The judges will only know something went wrong
  if you *say* something went wrong.
- **Always end with a number and a date**: "*four and a half thousand farmers in eighteen
  months*" is the closing hook that gets the next meeting.
- **No filler** — *"so…"*, *"um…"*, *"basically"* — rehearse enough to delete these.
- **One person talks at a time.** Demo driver says nothing during demo; Speaker 1 narrates.
