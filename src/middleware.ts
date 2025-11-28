// middleware.ts
import authConfig from "@/auth.config";
import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  protectedRoutes,
  publicApis,
  publicRoutes,
} from "@/routes";
import NextAuth from "next-auth";
import { getToken, GetTokenParams } from "next-auth/jwt";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { nextUrl } = req;
  
  // Get fresh token from cookies
  const params: GetTokenParams = { 
    req, 
    secret: process.env.AUTH_SECRET!,
    secureCookie: process.env.NODE_ENV === "production"
  };
  
  const token = await getToken(params);
  const isLoggedIn = !!token;

  console.log("🔍 Middleware check:", {
    path: nextUrl.pathname,
    isLoggedIn,
    hasToken: !!token,
  });

  // 1. Allow API auth routes (NextAuth internal routes)
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  if (isApiAuthRoute) {
    console.log("✅ API auth route - allowing");
    return NextResponse.next();
  }

  // 2. Check public APIs - Allow without authentication
  const isPublicApi = publicApis.some((api) =>
    nextUrl.pathname.startsWith(api)
  );
  if (isPublicApi) {
    console.log("✅ Public API - allowing");
    return NextResponse.next();
  }

  // 3. Check if route is public
  const isPublicRoute = publicRoutes.some((route) => {
    const matches = route instanceof RegExp 
      ? route.test(nextUrl.pathname) 
      : route === nextUrl.pathname;
    return matches;
  });

  // 4. Handle auth routes (login, register, etc.)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  if (isAuthRoute) {
    console.log("🔐 Auth route detected");
    if (isLoggedIn) {
      console.log("↩️ Logged in user on auth route - redirecting to dashboard");
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    console.log("✅ Allowing auth route");
    return NextResponse.next();
  }

  // 5. Allow public routes without authentication
  if (isPublicRoute) {
    console.log("✅ Public route - allowing");
    return NextResponse.next();
  }

  // 6. Redirect non-logged-in users to login for protected routes
  if (!isLoggedIn) {
    console.log("🚫 Not logged in, redirecting to login");
    const loginUrl = new URL("/auth/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Role-based access control
  if (!token.role) {
    console.log("🚫 No role - redirecting to login");
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  // Check protected routes
  for (const pattern in protectedRoutes) {
    const regex = new RegExp(pattern);
    if (regex.test(nextUrl.pathname)) {
      const requiredRoles = protectedRoutes[pattern];
      console.log(`🔐 Protected route: ${pattern}, required:`, requiredRoles);
      
      if (!requiredRoles.includes(token.role)) {
        console.log(`🚫 User role ${token.role} not authorized`);
        return NextResponse.redirect(new URL("/unauthorized", nextUrl));
      }
      
      console.log(`✅ User role ${token.role} authorized`);
    }
  }

  console.log("✅ Allowing request");
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};