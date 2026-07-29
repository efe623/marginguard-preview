import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "BOOTSTRAP_OWNER_EMAIL",
  "BOOTSTRAP_OWNER_PASSWORD",
  "BOOTSTRAP_BUSINESS_NAME"
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const { data: created, error: userError } = await admin.auth.admin.createUser({
  email: process.env.BOOTSTRAP_OWNER_EMAIL,
  password: process.env.BOOTSTRAP_OWNER_PASSWORD,
  email_confirm: true
});
if (userError || !created.user) throw userError ?? new Error("Owner could not be created.");

const { data: business, error: businessError } = await admin
  .from("businesses")
  .insert({
    name: process.env.BOOTSTRAP_BUSINESS_NAME,
    currency: process.env.BOOTSTRAP_BUSINESS_CURRENCY || "AED",
    timezone: "Asia/Dubai",
    country_code: "AE"
  })
  .select("id")
  .single();
if (businessError) throw businessError;

const now = new Date().toISOString();
const { error: setupError } = await admin.from("business_memberships").insert({
  business_id: business.id,
  user_id: created.user.id,
  role: "owner",
  status: "active",
  joined_at: now
});
if (setupError) throw setupError;
await admin.from("profiles").upsert({
  user_id: created.user.id,
  display_name: process.env.BOOTSTRAP_OWNER_EMAIL.split("@")[0],
  timezone: "Asia/Dubai"
});

process.stdout.write("Owner and business created. Sign in to enroll authenticator MFA.\n");
