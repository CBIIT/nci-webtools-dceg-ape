import { NextResponse } from "next/server";

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Define protected routes
  const protectedRoutes = ["/ape"];

  // Check if current path needs protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check for session cookie (express-session default name is "connect.sid")
    const sessionCookie = request.cookies.get("connect.sid");

    if (!sessionCookie) {
      // No session cookie, redirect to login
      const loginUrl = new URL("/api/login", request.url);
      loginUrl.searchParams.set("destination", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Not a protected route, allow access
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    "/ape/:path*",
    // Add other protected routes here as needed
  ],
};
