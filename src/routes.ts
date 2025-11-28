import { Role } from "./validaton-schema";

export const DEFAULT_LOGIN_REDIRECT: string = "/dashboard";

// Prefix for API authentication routes.
export const apiAuthPrefix: string = "/api/auth";

// Routes which are accessible to all.
export const publicRoutes: (string|RegExp)[] = [
  "/", 
  "/auth/verify-email",
  "/about",
  "/career",
  "/contact",
  /^\/courses(\/.*)?$/,
  "/blogs",  // Matches: /courses, /courses/, /courses/anything
   /^\/blogs(\/.*)?$/,
];

// APIs which are accessible to all.
export const publicApis: string[] = [
  "/api/courses",           // Add this
  "/api/courses/",          // Add this too
  "/api/admin/courses",
  "/api/admin/courses/",
  "/api/blogs",
  "/api/blogs/"
];
// Routes which are used for authentication.
export const authRoutes: string[] = [
  "/auth/error",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Routes which are protected with different roles
export const protectedRoutes: Record<string, Role[]> = {
  "^/dashboard/admin(/.*)?$": ["ADMIN"],
  "^/dashboard/user(/.*)?$": ["USER"],
};