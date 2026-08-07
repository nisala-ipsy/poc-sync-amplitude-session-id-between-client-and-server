/**
 * Approach A — the server owns the Amplitude session.
 *
 * Pure logic: no DOM, no next/headers, no Amplitude import. Both runtimes agree
 * on one rule — a session expires only when NEITHER side has been active within
 * the window — and that rule lives here alone.
 */

export type Identity = {
  deviceId: string;
  /** Amplitude convention: session_id is the epoch-ms the session started. */
  sessionId: number;
  /** Last activity from either side. Drives the sliding window. */
  lastActivity: number;
};

export const IDENT_COOKIE = "amp_ident";
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function createIdentity(now: number): Identity {
  return { deviceId: crypto.randomUUID(), sessionId: now, lastActivity: now };
}

/** Slide the window forward, or start a new session if the window has passed. */
export function touch(identity: Identity, now: number, timeoutMs = SESSION_TIMEOUT_MS): Identity {
  const expired = now - identity.lastActivity > timeoutMs;
  return {
    deviceId: identity.deviceId,
    sessionId: expired ? now : identity.sessionId,
    lastActivity: now,
  };
}

export function encodeIdentity(identity: Identity): string {
  return `${identity.deviceId}~${identity.sessionId}~${identity.lastActivity}`;
}

export function decodeIdentity(raw: string | undefined): Identity | null {
  const [deviceId, sessionId, lastActivity] = raw?.split("~") ?? [];
  if (!deviceId || !Number(sessionId)) return null;
  return { deviceId, sessionId: Number(sessionId), lastActivity: Number(lastActivity) };
}

/** Not httpOnly on purpose: the browser SDK must read the same session id. */
export const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: false,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
} as const;
