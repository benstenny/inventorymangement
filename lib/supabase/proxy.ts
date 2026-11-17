import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readPublicEnv } from "@/lib/env";

/** Paths anyone can open without logging in. */
const PUBLIC_PATHS = ["/login", "/api/health"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Runs before every page: refreshes the Supabase session cookie and sends
 * anyone who isn't logged in to /login.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const env = readPublicEnv();

  // Not connected to Supabase yet: only the login page (which explains the
  // setup) and the health check are reachable.
  if (!env) {
    return isPublic(pathname) ? NextResponse.next() : redirectToLogin(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // getClaims verifies the token signature; don't trust getSession() here.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);

  if (!loggedIn && !isPublic(pathname)) {
    return redirectToLogin(request);
  }
  if (loggedIn && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}
