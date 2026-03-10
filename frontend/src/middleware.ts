import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (middleware can't access localStorage)
  const token = request.cookies.get("access_token")?.value;
  
  // Check if route is public (exact match for "/" or startsWith for others)
  const isPublicRoute = publicRoutes.some(route => 
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If user is authenticated and trying to access auth routes (login/signup)
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // If user is authenticated and on landing page, redirect to dashboard
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
