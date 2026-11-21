# Build Checklist

- [x] Phase 1: Detection correlation API, dossier API with Gemini/local fallback, leaderboard API with Supabase/demo fallback, schema, and environment template.
- [x] Phase 2: Responsive operations dashboard, schematic SAR/AIS map, filters, correlation gates, forecast projection, and contact dossier.
- [x] Phase 3: Five-mission SAR challenge, scoring/streaks, scientific feedback, downloadable result card, and leaderboard flow.
- [x] Phase 4a: ESLint, TypeScript, production build, route rendering, and API smoke checks.
- [ ] Phase 4b: Interactive browser verification and Vercel deployment.

## Verification notes

- npm run lint, npm run typecheck, and npm run build pass.
- API smoke checks passed for default/tight detection gates, forecast capping, local dossier fallback, valid score submission, and invalid-score rejection.
- Both / and /challenge return HTTP 200 and render their expected page content.
- Interactive browser checking stopped when Computer Use was interrupted with Escape. Playwright MCP is unavailable in this session.
- Vercel deployment is not configured in this checkout: the CLI and project metadata are absent. The project is ready for deployment once the target Vercel account/project is selected.
