import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const basicAuth = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  if (!username || !password) return false;
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;
  const base64 = authHeader.split(' ')[1];
  const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
  return user === username && pass === password;
};

export function middleware(req: NextRequest) {
  // Allow public files (/_next, /favicon, etc.)
  if (req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }
  if (!basicAuth(req)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="DevOps Dashboard"',
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}; 