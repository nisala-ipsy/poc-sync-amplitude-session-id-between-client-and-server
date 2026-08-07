import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_OPTIONS,
  createIdentity,
  decodeIdentity,
  encodeIdentity,
  IDENT_COOKIE,
  touch,
} from "./lib/amplitude/identity";

/**
 * Mints and slides the identity cookie before anything renders, so even the
 * first SSR pass — and any request with no client in flight — already knows the
 * session id.
 */
export default function proxy(request: NextRequest) {
  const now = Date.now();
  const existing = decodeIdentity(request.cookies.get(IDENT_COOKIE)?.value);
  const identity = existing ? touch(existing, now) : createIdentity(now);
  const encoded = encodeIdentity(identity);

  // Rewrite the cookie on the *request* too, so this render sees the fresh
  // value rather than the one the browser sent.
  const headers = new Headers(request.headers);
  const cookies = request.cookies
    .getAll()
    .filter((c) => c.name !== IDENT_COOKIE)
    .map((c) => `${c.name}=${c.value}`);
  headers.set("cookie", [...cookies, `${IDENT_COOKIE}=${encoded}`].join("; "));

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(IDENT_COOKIE, encoded, COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
