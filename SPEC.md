# Phantom Tide — Project Specification

## Problem and demo flow
Phantom Tide is a demo maritime surveillance console for the Indian Exclusive Economic Zone. It compares synthetic SAR detections against AIS beacons to flag vessels that stopped broadcasting and probable oil slicks. The interface labels all bundled observations as simulated demo data.

1. Open the live operations dashboard and review matched vessels, ghost vessels, and suspected slicks.
2. Change distance/time matching gates and the forecast horizon; watch classifications and projected positions update from `GET /api/detections`.
3. Open a contact dossier to review its evidence and request an AI-generated (or deterministic fallback) briefing.
4. Play the five-mission SAR spotting challenge, then save a score and review the leaderboard.

## Data model
- `sar_detections`: demo SAR observation ID, mission, region, UTC timestamp, coordinates, estimated vessel length, heading/speed, backscatter, slick area, sea state, cloud cover.
- `ais_beacons`: MMSI, vessel name/type, UTC timestamp, coordinates, heading/speed, reported vessel length.
- `leaderboard`: UUID ID, player name, score, accuracy percentage, ghosts spotted, creation timestamp. Public read and insert only; validate submissions in the API.
- Initial SAR/AIS observations are deterministic in-code demo fixtures. The SQL schema is provided for leaderboard persistence; the API works without Supabase for local demos.

## API and pages
- `/` — responsive live operations dashboard with filters, map, contact list, and dossier.
- `/challenge` — five-mission SAR spotting game and score card.
- `GET /api/detections?maxDistanceKm=5&maxMinutes=30&hoursAhead=0` — `{ summary, contacts }`.
- `POST /api/dossier` — body `{ contact: MatchedContact }`; returns `{ dossier, navicBurst, source }`.
- `GET /api/leaderboard` — returns `{ scores }`.
- `POST /api/leaderboard` — body `{ player_name, score, accuracy_pct, ghosts_spotted }`; returns `{ score }`.

## Demo constraints
The SAR and AIS records are fictional and must be presented as simulated data, not operational intelligence. No external map tiles are required. Gemini and Supabase are optional; deterministic demo behavior remains available without credentials.
