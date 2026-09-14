# SWS Fleet
- React + TypeScript + Vite. `src/App.tsx` contains the shell, auth, and vehicle UI.
- `src/vehicleModel.ts` defines vehicle types and database mappings; `src/persistence.ts` handles vehicle reads/writes.
- `src/Dashboard.tsx` derives overview totals from saved fleet and service records.
- `src/ServicePage.tsx` and `src/serviceModel.ts` implement service scheduling and history.
- Supabase configuration is in `src/supabase.ts`; never commit `.env.local` or credentials.
- Run focused tests with `npm test -- src/<file>.test.ts`; run `npm run build` for TypeScript and production validation.
- Preserve database-returned IDs, await writes, and display failures before reporting success. Do not fall back to local data after a remote error.
