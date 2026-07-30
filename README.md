# UnitPulse

UnitPulse is an invite-only desktop web app for small businesses to stop unpaid extra work. The launch workflow is:

`structured scope → change request → locked Change Order → verified client approval → deposit confirmation → authorized work`

AI features, payment-card handling, refunds, payouts, and Excel uploads are intentionally absent.

## Local preview

```powershell
pnpm install
pnpm dev
```

With no Supabase variables, the app opens in clearly labelled fixture mode. Use any valid-looking email and a password of at least 10 characters.

## Real-data setup

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Set the Supabase URL, publishable key, and secret key.
3. Link the project and apply `supabase/migrations/20260729141922_initial_schema.sql`.
4. Disable public sign-up in Supabase Auth and enable TOTP MFA.
5. Set the one-time bootstrap variables, then run:

```powershell
pnpm bootstrap-owner
```

6. Sign in as the owner and enroll Google Authenticator or another TOTP app. Recovery codes are shown once.
7. Configure Stripe Connect with `/api/stripe/callback` as an OAuth redirect and `/api/stripe/webhook` as a connected-account webhook.
8. Configure Resend and call `POST /api/jobs/email-outbox` on a schedule with `Authorization: Bearer $CRON_SECRET`.
9. Deploy a malware scanner using the contract in `services/file-scanner/README.md`.

Never expose `SUPABASE_SECRET_KEY`, Stripe secrets, the recovery-code pepper, scanner secret, or cron secret to the browser.

## Verification

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The database migration should also be linted and tested against a disposable Supabase project before production. Local database verification requires Docker.
