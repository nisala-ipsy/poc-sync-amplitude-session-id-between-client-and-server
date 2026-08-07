import "server-only";
import { createInstance } from "@amplitude/analytics-node";
import { cookies } from "next/headers";
import { decodeIdentity, IDENT_COOKIE, type Identity } from "./identity";

/**
 * The Node SDK has no session concept at all — `session_id` is just a field you
 * stamp on each event. So the whole job is reading the number the proxy already
 * decided, which is guaranteed present on every request.
 */
const client = createInstance();
client.init(process.env.AMPLITUDE_API_KEY ?? process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "", {
  flushIntervalMillis: 0,
  flushQueueSize: 1,
});

export async function serverIdentity(): Promise<Identity | null> {
  const store = await cookies();
  return decodeIdentity(store.get(IDENT_COOKIE)?.value);
}

export async function trackServer(
  eventType: string,
  properties?: Record<string, unknown>,
  userId?: string,
): Promise<void> {
  const identity = await serverIdentity();
  if (!identity) return;

  await client.track({ event_type: eventType, event_properties: properties }, undefined, {
    session_id: identity.sessionId,
    device_id: identity.deviceId,
    user_id: userId,
    time: Date.now(),
  }).promise;
}
