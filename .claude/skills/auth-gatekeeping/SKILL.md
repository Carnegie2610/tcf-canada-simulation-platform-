
Skill: Auth Gatekeeping

Context

Use this skill when securing application routes, configuring Next.js route middleware session states, or managing Postgres Row-Level Security (RLS) policies.

Guidelines

Middleware-Level Session Lock: Unauthenticated requests to /dashboard/* or /admin/* must fail securely at the middleware level. Do not rely on client-side JS redirects.

RLS native verification: Ensure RLS checks match on JWT email/profile parameters natively in Postgres.

Admin Verification: Validate profiles.role claim inside both layout route wrappers and backend API controllers before executing administrative requests.

Code Patterns

Next.js Middleware Gatekeeper

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sb-access-token');
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}


