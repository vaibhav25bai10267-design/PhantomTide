# Phantom Tide

Phantom Tide is a maritime surveillance and SAR image interpretation demo for India’s Exclusive Economic Zone. It correlates **fictional** SAR observations with fictional AIS beacons, classifies unmatched vessel-shaped returns and possible oil slicks, and includes a five-scan training challenge.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

1. Run npm install.
2. Copy .env.example to .env.local.
3. Run npm run dev.
4. Open http://localhost:3000.

The app works without credentials: dossiers use a deterministic local briefing, and leaderboard entries are retained in browser storage plus demo memory for the current server process.

## Optional integrations

- GEMINI_API_KEY enables the server-side Gemini dossier. GEMINI_MODEL is optional and defaults to gemini-3.8-flash. The key is never sent to the browser; dossier requests use stateless interactions.
- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY enable leaderboard persistence. Apply supabase/schema.sql in the Supabase SQL editor first. The table has public read/insert policies for this demo and is validated by the API.

Do not commit .env.local. .env.example contains variable names only.

## Routes

- / — live detection dashboard, SAR map, matching gates, forecast horizon, contact dossiers.
- /challenge — five mission SAR spotting challenge, score card, and leaderboard.
- GET /api/detections — SAR/AIS correlation, filtered by maxDistanceKm, maxMinutes, and hoursAhead.
- POST /api/dossier — { contact } to generate a briefing and alert burst.
- GET /api/leaderboard, POST /api/leaderboard — fetch or submit training scores.

## Checks

Run npm run lint, npm run typecheck, and npm run build.

All map positions, SAR textures, AIS tracks, and leaderboard seed scores are synthetic. This demo is not an operational maritime intelligence feed.
