import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { createAdminClient } from "@/lib/supabase/server";

interface SessionClaims {
  session_id?: string;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const aalLevel = aalData?.currentLevel;

  let hasMfaEnabled = false;
  if (user) {
    const { data: mfaList } = await supabase.auth.mfa.listFactors();
    hasMfaEnabled = !!(mfaList?.totp && Array.isArray(mfaList.totp) && mfaList.totp.length > 0);
  }

  // 1) Nepřihlášený – všechno kromě /login → /login
  if (!user && !path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2) Jedna aktivní relace – ověření current_session_id
  if (user && session) {
    let sessionIdFromJwt: string | null = null;

    try {
      const decoded = jwtDecode<SessionClaims>(session.access_token);
      sessionIdFromJwt = decoded.session_id ?? null;
    } catch {
      sessionIdFromJwt = null;
    }

    if (sessionIdFromJwt) {
      const supabaseAdmin = await createAdminClient();

      const { data: profileRow } = await supabaseAdmin
        .from("profiles")
        .select("current_session_id")
        .eq("id", user.id)
        .maybeSingle();

      const currentSessionId = profileRow?.current_session_id ?? null;
      const isStaleSession = !currentSessionId || currentSessionId !== sessionIdFromJwt;
      const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null;


      // stará/neplatná session → všechno kromě /login přesměruj na login
      if (isStaleSession) {
        if (!path.startsWith("/login")) {
          return NextResponse.redirect(
            new URL("/login?reason=session_changed", request.url),
          );
        }
      } else {
        // aktuální session – aktualizujeme user_devices (pokud tabulka existuje)
        await supabaseAdmin
          .from("user_devices")
          .upsert(
            {
              user_id: user.id,
              session_id: sessionIdFromJwt,
              user_agent: request.headers.get("user-agent") ?? null,
              ip_address: ip,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "session_id" },
          );
      }
    }
  }

  // 3) MFA stránka – pokud už MFA není potřeba nebo je hotové, pryč
  if (user && path === "/auth/mfa") {
    if (!hasMfaEnabled || aalLevel === "aal2") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4) Přihlášený uživatel nesmí na /login (kromě případu stale session,
  // kterou jsme výše propustili právě na /login)
  if (user && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5) Role-routing pro /dashboard
  if (user && path.startsWith("/dashboard") && (!hasMfaEnabled || aalLevel === "aal2")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "CLIENT";

    if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/client", request.url));
    }

    if (path.startsWith("/dashboard/banker") && role !== "BANKER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/client", request.url));
    }

    if (path.startsWith("/dashboard/child") && role !== "CHILD") {
      return NextResponse.redirect(new URL("/dashboard/client", request.url));
    }

    if (path.startsWith("/dashboard/client") && role === "BANKER") {
      return NextResponse.redirect(new URL("/dashboard/banker", request.url));
    }

    if (path.startsWith("/dashboard/client") && role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    if (path === "/dashboard" || path === "/dashboard/") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      if (role === "BANKER") {
        return NextResponse.redirect(new URL("/dashboard/banker", request.url));
      }
      if (role === "CHILD") {
        return NextResponse.redirect(new URL("/dashboard/child", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard/client", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
