import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

const publicPaths = [
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/mfa",
  "/recovery",
  "/accept-invitation",
  "/approve",
  "/api/auth",
  "/api/client-otp",
  "/api/files/scan-callback",
  "/api/jobs/email-outbox",
  "/api/stripe/webhook",
  "/api/health"
];

export async function updateSession(request: NextRequest) {
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
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
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
