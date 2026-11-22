# Phantom Tide

**Evidence-first maritime anomaly review prototype for India's Exclusive Economic Zone (EEZ).**

- **Live Deployment:** [https://phantom-tide.vercel.app/](https://phantom-tide.vercel.app/)
- **Event:** ASTRA 2026 Hackathon
- **Domains:** Earth Observation (`02`) · Space-Based Disaster Management (`03`) · Satellite Communication & Navigation (`04`) · Indian Space Missions Alignment (`01`)

> **Prototype & Synthetic Data Disclosure:** All map positions, radar observations, SAR textures, AIS tracks, fisheries traceability records, simulation scenarios, and seed leaderboard scores in Phantom Tide are **synthetic**. This application is an analyst decision-support prototype and **not** a live or operational maritime intelligence feed.

---

## Overview

Vessel position beacons (such as AIS) provide useful operational context, but they do not by themselves explain every radar observation at sea—especially when transponders go silent, report inconsistent positions, or when surface anomalies like possible oil slicks occur beneath cloud cover.

**Phantom Tide** explores an analyst-facing evidence review layer designed to **complement** (not replace) existing Indian maritime monitoring infrastructure such as the Directorate General of Shipping's **MMDAC**. Inspired by all-weather Synthetic Aperture Radar (SAR) missions like **ISRO EOS-04 (C-Band)** and **ISRO–NASA NISAR (L/S-Band)**, the prototype correlates simulated SAR contacts against simulated AIS beacons within configurable distance and time windows so human analysts can inspect evidence and decide what to review next.

---

## Key Features

- **Interactive 3D Orbital Showcase (`/`):** Pitch-black deep-space landing experience featuring a procedural 3D Earth sphere centered on the Indian Ocean, orbiting EOS-04 and NISAR swath concepts, a 3-chapter mission switcher, and an interactive radial signal visualizer connected to live `/api/detections` summary telemetry.
- **Tactical SAR–AIS Radar Console (`/radar`):**
  - Dark-mode Leaflet ocean map of India's EEZ with collapsible contact register and filter pills (`ALL`, `GHOST`, `OIL SLICK`, `AIS`).
  - **Optical vs. SAR Mode & Monsoon Cloud Overlay** plus an animated orbital swath visualization.
  - **Configurable Correlation Gates:** Dynamically adjust **Distance Gate (`maxDistanceKm`)**, **Time Window (`maxMinutes`)**, and **Drift Projection Horizon (`hoursAhead`)** to observe how classifications update in real time.
  - **Optical-vs-SAR X-Ray Slider:** Interactive split-screen canvas inside each case dossier comparing cloud-obscured optical views against procedural SAR backscatter signatures (metallic hull + Kelvin wake or damped oil-slick patch).
  - **Workflow Stress-Test Simulations:** Trigger synthetic **AIS Blackout** or **GPS-Spoof** scenarios on matched vessels to verify how the correlation engine and spoof-vector visualization respond.
- **Evidence-First Case Dossiers:** Transparent `0–100` confidence breakdown, plain-English correlation factors, compact NavIC-style alert preview, and optional server-side **Gemini AI** incident briefings (with automatic deterministic local fallback).
- **Fisheries Traceability Review (`/esg`):** Sample seafood batch verification that cross-checks declared harvest coordinates against nearby unmatched radar returns and possible oil slicks.
- **SAR Analyst Training Challenge (`/challenge`):** Five-scan interactive spotting game on procedural monochrome SAR speckle slices with scientific explanations, downloadable score card, and leaderboard.

---

## Architecture & Tech Stack

| Layer | Technologies Used |
|---|---|
| **Frontend & UI** | Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Geospatial & Visuals** | Leaflet (dynamic client-side rendering, CartoDB Dark Matter tiles), HTML5 2D Canvas (procedural 3D Earth, SAR speckle & X-Ray slider) |
| **Backend & Correlation** | Next.js API Routes, deterministic Haversine distance + time-window correlation & drift projection (`lib/maritime/`) |
| **Optional AI & Database** | Google Gemini API (`@google/genai`), Supabase PostgreSQL (`@supabase/supabase-js`) |
| **Deployment** | Vercel ([https://phantom-tide.vercel.app/](https://phantom-tide.vercel.app/)) |

### Current Prototype vs. Future Operational Path

- **Current Prototype (Live Today):** Next.js dashboard and API routes running on deterministic synthetic maritime data, correlation logic, interactive scenario controls, optional Gemini dossier generation, and Supabase-backed leaderboard.
- **Future Operational Requirements (Not Connected in Demo):** Authorized SAR and AIS data feeds, labeled historical evaluation (false-positive and miss-rate benchmarking), security/privacy review, and scoped pilots with design partners.

---

## Routes & API Reference

### Pages
- `/` — 3D orbital landing showcase, mission chapters, and interactive radial signal visualizer.
- `/radar` — Live synthetic detection dashboard, SAR/Optical map, matching gates, forecast horizon, X-Ray slider, blackout/spoof scenarios, and contact dossiers.
- `/esg` — Sample fisheries traceability batch verification workflow.
- `/challenge` — Five-mission SAR spotting challenge, score card, and leaderboard.

### API Endpoints
- `GET /api/detections` — Runs SAR/AIS correlation on synthetic data. Supports query parameters:
  - `maxDistanceKm` (default `5`)
  - `maxMinutes` (default `30`)
  - `hoursAhead` (default `0`)
  - `blackout` / `spoof` (optional comma-separated MMSI list for scenario testing)
- `POST /api/dossier` — Accepts `{ contact }` and returns a structured analyst briefing and alert burst (uses Gemini when configured, otherwise deterministic local briefing).
- `GET /api/esg` & `POST /api/esg` — Lists sample seafood export batches or audits custom `{ lat, lng, radiusKm }` harvest coordinates against synthetic anomalies.
- `GET /api/leaderboard` & `POST /api/leaderboard` — Fetches or submits SAR Analyst Challenge scores.

---

## Run Locally

**Requirements:** Node.js `20.9` or newer and `npm`.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

The app runs cleanly **without credentials**: case dossiers fall back to a deterministic local briefing, and leaderboard entries are retained in browser storage plus in-memory demo storage for the active server process.

### Optional Integrations
- **`GEMINI_API_KEY`**: Enables server-side Gemini case dossiers. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. The key is never exposed to the browser; dossier requests are stateless.
- **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Enable persistent leaderboard storage. Apply `supabase/schema.sql` in the Supabase SQL Editor first. The table uses public read/insert policies scoped to this demo and validated by the API.
- **Security Note:** Never commit `.env.local`. Keep only variable names in `.env.example`.

---

## Verification Checks

Run all checks before pushing or deploying:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## Acknowledgments & Domain References

- **Domain & Institutional Context:** Directorate General of Shipping, India ([MMDAC / DGComm Centre](https://dgma.gov.in/nautical-wing/nw-mmdac-dgcomm-center)); ISRO **EOS-04**, **ISRO–NASA NISAR**, **NavIC**, **Bhoonidhi**, and **MOSDAC** mission concepts; ESA [Sentinel-1 SAR overview](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1) (referenced for SAR all-weather imaging principles; Phantom Tide does not ingest live satellite data).
- **Open-Source & Platform Tools:** Next.js, React, Tailwind CSS, Framer Motion, Lucide, Leaflet, CartoDB Dark Matter basemap tiles, Google Gemini API, Supabase, and Vercel.

---

## Team

Built for **ASTRA 2026**:
- **Member 1:** Core Detection Engine, APIs & Integration
- **Member 2:** Tactical Radar Map, Swath Visualization & HUD
- **Member 3:** SAR Analyst Challenge, X-Ray Slider & Visual Components
- **Member 4:** Product Strategy, Presentation, QA & Demo Production
