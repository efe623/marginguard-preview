import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional()
});

const serverSchema = publicSchema.extend({
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),
  SUPABASE_SECRET_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CONNECT_CLIENT_ID: z.string().optional(),
  RECOVERY_CODE_PEPPER: z.string().optional(),
  CLIENT_SESSION_SECRET: z.string().optional(),
  SCANNER_CALLBACK_SECRET: z.string().optional(),
  OWNER_SETUP_SECRET: z.string().min(20).optional(),
  SUPPORT_USER_ID: z.uuid().optional().or(z.literal("")),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  CRON_SECRET: z.string().optional()
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
});

// This repository is intentionally a public, fixture-only product prototype.
// It must never connect to the production Supabase project.
export const isSupabaseConfigured = false;

export function getServerEnv() {
  return serverSchema.parse({
    ...publicEnv,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID,
    RECOVERY_CODE_PEPPER: process.env.RECOVERY_CODE_PEPPER,
    CLIENT_SESSION_SECRET: process.env.CLIENT_SESSION_SECRET,
    SCANNER_CALLBACK_SECRET: process.env.SCANNER_CALLBACK_SECRET,
    OWNER_SETUP_SECRET: process.env.OWNER_SETUP_SECRET,
    SUPPORT_USER_ID: process.env.SUPPORT_USER_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    CRON_SECRET: process.env.CRON_SECRET
  });
}
