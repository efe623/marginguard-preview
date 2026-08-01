# UnitPulse

UnitPulse is an invite-only desktop web app for small businesses to stop unpaid extra work. The launch workflow is:

- No login or account creation
- Sample data only
- No Supabase, Stripe, or external AI connection
- Actions demonstrate the intended workflow but do not save or send anything

## Local development

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The app goes directly to the dashboard.

## Verification

```powershell
pnpm check
```

The real, data-backed UnitPulse application lives in a separate private
deployment. Do not add production credentials to this preview.
