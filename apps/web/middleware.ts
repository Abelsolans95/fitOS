import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /app/* routes — redirect unauthenticated users to /login
  if (!user && pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect /onboarding/* routes
  if (!user && pathname.startsWith("/onboarding")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If authenticated user is on /login or /register, redirect to their dashboard or onboarding
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    const role = user.user_metadata?.role;
    const onboardingCompleted = user.user_metadata?.onboarding_completed;
    if (role === "client" && !onboardingCompleted) {
      url.pathname = "/onboarding/client";
    } else if (role === "trainer" && !onboardingCompleted) {
      url.pathname = "/onboarding/trainer";
    } else {
      url.pathname = role === "client" ? "/app/client/dashboard" : "/app/trainer/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // If authenticated client accesses /app/* without completing onboarding, redirect
  if (user && pathname.startsWith("/app/")) {
    const role = user.user_metadata?.role;
    const onboardingCompleted = user.user_metadata?.onboarding_completed;
    if (!onboardingCompleted) {
      const url = request.nextUrl.clone();
      url.pathname = role === "client" ? "/onboarding/client" : "/onboarding/trainer";
      return NextResponse.redirect(url);
    }
  }

  // Prevent trainers from accessing client routes and vice versa
  if (user && pathname.startsWith("/app/")) {
    const role = user.user_metadata?.role;
    if (role === "trainer" && pathname.startsWith("/app/client/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/trainer/dashboard";
      return NextResponse.redirect(url);
    }
    if (role === "client" && pathname.startsWith("/app/trainer/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/client/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
