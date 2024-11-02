import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Exclude auth routes and public assets
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  // if (!token) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  // const decoded = verifyToken(token);
  // if (!decoded) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return NextResponse.next();
}