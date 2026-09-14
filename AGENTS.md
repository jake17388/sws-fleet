# SWS Fleet
- Deploy project changes to the main app on GitHub Pages automatically after relevant checks pass, unless the user specifies otherwise. Push to `main` and verify the GitHub Pages deployment succeeds before reporting it live.
- React + TypeScript + Vite. `src/App.tsx` contains the shell, auth, and vehicle UI.
- `src/vehicleModel.ts` defines vehicle types and database mappings; `src/persistence.ts` handles vehicle reads/writes.
- `src/Dashboard.tsx` derives overview totals from saved fleet and service records.
- `src/ServicePage.tsx` and `src/serviceModel.ts` implement service scheduling and history.
- `src/SettingsPage.tsx` contains account security, the team administration placeholder, and browser-local display preferences.
- Supabase configuration is in `src/supabase.ts`; never commit `.env.local` or credentials.
- Run focused tests with `npm test -- src/<file>.test.ts`; run `npm run build` for TypeScript and production validation.
- Preserve database-returned IDs, await writes, and display failures before reporting success. Do not fall back to local data after a remote error.
