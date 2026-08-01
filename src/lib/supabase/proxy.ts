import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/accept-invitation",
  "/approve",
  "/portal",
  "/api/auth",
  "/api/client-otp",
  "/api/files/scan-callback",
  "/api/jobs/daily",
  "/api/jobs/email-outbox",
  "/api/stripe/webhook",
  "/api/health"
];

export async function updateSession(request: NextRequest) {
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    if (
      [
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/reset-password",
        "/mfa",
        "/recovery"
      ].some((path) => request.nextUrl.pathname.startsWith(path))
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headersToSet).forEach(([name, value]) =>
            response.headers.set(name, value)
          );
        }
      }
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isPublic = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!data?.claims && !isPublic) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    signIn.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  if (data?.claims && request.nextUrl.pathname === "/sign-in") {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // A deleted account can leave a locally valid JWT behind until it expires.
    // Clear it here so sign-in does not bounce between this page and the app.
    await supabase.auth.signOut({ scope: "local" });
    return response;
  }

  return response;
}
