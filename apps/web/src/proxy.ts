import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/reports",
  "/report",
  "/messages",
  "/admin",
];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requiresSignIn = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
  if (!requiresSignIn) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (!data.user || error || !data.user.email_confirmed_at) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", data.user.id)
    .single();
  if (profile?.is_banned) {
    return NextResponse.redirect(new URL("/account-suspended", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/reports/:path*", "/report/:path*", "/messages/:path*", "/admin/:path*"],
};
