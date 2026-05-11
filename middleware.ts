import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Logged-in non-admin visiting an admin route → redirect home
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Non-rider (and non-admin) visiting a rider route → redirect home
    if (pathname.startsWith("/rider") && token?.role !== "rider" && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith("/admin")) return !!token;
        if (pathname.startsWith("/rider")) return !!token;

        const protectedPrefixes = ["/cart", "/checkout", "/orders"];
        if (protectedPrefixes.some((p) => pathname.startsWith(p))) return !!token;

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/rider/:path*",
  ],
};
