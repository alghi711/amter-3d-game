import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/api/saves/:path*",
    "/api/care/:path*",
    "/api/cat/:path*",
    "/api/player/:path*",
    "/api/auth/me",
  ],
};

/**
 * Middleware Next.js untuk meneruskan identitas sesi masuk dan cookie pemain
 * secara aman ke rute hilir melalui custom headers.
 */
export function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get("mochi_session")?.value;
  const playerId = req.cookies.get("mochi_player")?.value;

  const requestHeaders = new Headers(req.headers);

  if (sessionToken) {
    requestHeaders.set("x-mochi-session", sessionToken);
  }
  if (playerId) {
    requestHeaders.set("x-mochi-player", playerId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
