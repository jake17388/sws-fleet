# SWS Fleet

React/TypeScript fleet inventory and maintenance app with Supabase persistence.

## Run and verify

- `npm install`
- `npm run dev` — app at `/sws-fleet/`.
- `npm test -- src/workflow.test.tsx` — create/edit/reload vehicle, schedule/edit/complete service, history, and failed-save retry.
- `npm run build` — type check and production build.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` to use the connected app. Sign in with an existing Supabase account. Without these variables, the app uses browser-local sample vehicles and service records. Remote errors never fall back to local samples.

## Database setup

The existing `public.vehicles` table must already be configured. Apply `supabase/migrations/202609140001_service_records.sql` using the project's migration process before using Service. This migration has not been applied by the code change.

The migration grants signed-in users service read/create/update access only for vehicles visible through the existing vehicle RLS policies. Confirm that vehicle visibility matches the intended maintenance editors before applying. Completed records cannot be updated through the normal authenticated policy. No delete policy is provided. The migration adds no vehicle permissions.

## Maintenance workflow

Open Service or a vehicle's “View service and maintenance” link. Schedule a job with a date, a meter threshold, or both. Either threshold can make work due; “Due soon” means within seven calendar days. Complete a job with date, meter, cost in USD (zero allowed), provider, and notes. Completion moves it to vehicle-filtered history and updates dashboard totals. Completion readings remain in history; update the vehicle's current meter separately. Recurring schedules and outbound notifications are not included.

Vehicle writes await Supabase confirmation and retain its returned ID. Failed saves keep the form open for retry. Watch preferences in connected mode last for the current visit; notification delivery is not implemented.

## Verification boundary

Automated tests exercise local persistence and mocked Supabase create/update/error responses. Browser testing covers create/edit/reload vehicles and schedule/complete/reload service history in isolated local mode. Live Supabase verification requires a signed-in browser and the applied service migration; it has not been completed by this change.
