import { NextRequest, NextResponse } from "next/server";

const directMatchHosts = new Set(["xinxinyuntu.top", "www.xinxinyuntu.top"]);

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostname = (forwardedHost ?? request.headers.get("host") ?? request.nextUrl.hostname)
    .split(":")[0]!
    .toLowerCase();
  const path = request.nextUrl.pathname;

  if (
    directMatchHosts.has(hostname) &&
    (path === "/spirits" || path === "/flavors" || path.startsWith("/flavors/"))
  ) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/spirits", "/flavors/:path*"],
};
