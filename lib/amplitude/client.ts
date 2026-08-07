"use client";

import { createInstance } from "@amplitude/analytics-browser";
import { setCookie } from "nookies";
import {
  COOKIE_OPTIONS,
  decodeIdentity,
  encodeIdentity,
  IDENT_COOKIE,
  type Identity,
} from "./identity";

let client: ReturnType<typeof createInstance> | null = null;

function readIdentityFromCookie(): Identity | null {
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${IDENT_COOKIE}=`))
    ?.slice(IDENT_COOKIE.length + 1);
  return decodeIdentity(raw);
}

function writeIdentityToCookie(identity: Identity): void {
  setCookie(null, IDENT_COOKIE, encodeIdentity(identity), {
    path: COOKIE_OPTIONS.path,
    sameSite: COOKIE_OPTIONS.sameSite,
    maxAge: COOKIE_OPTIONS.maxAge,
  });
}

/**
 * Boots the browser SDK on the server-minted session and keeps it there. Expiry
 * is not the SDK's decision here: the proxy rolls the cookie, and the SDK is
 * told about it. That is what stops a busy server + idle tab from splitting.
 */
export async function initAmplitude(): Promise<void> {
  if (client) return;
  const identity = readIdentityFromCookie();
  if (!identity) return;

  client = createInstance();

  await client.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "", {
    sessionId: identity.sessionId,
    deviceId: identity.deviceId,
    sessionTimeout: 10_000,
  }).promise;

  client.add({
    name: "session-cookie-sync",
    type: "before",
    async onSessionIdChanged(sessionId) {
      const current = readIdentityFromCookie();
      if (!current) return;

      writeIdentityToCookie({
        ...current,
        sessionId,
        lastActivity: Date.now(),
      });
    },
  });
}

export function trackClient(
  eventType: string,
  properties?: Record<string, unknown>,
): void {
  client?.track(eventType, properties, { time: Date.now() });
}
