import { redis } from "../config/redis.js";
import { SESSION_PREFIX, SESSION_TTL_SECONDS } from "../utils/constants.js";
import type { UserSession } from "./states.js";

function sessionKey(phoneNumber: string): string {
  return `${SESSION_PREFIX}${phoneNumber}`;
}

export async function getSession(
  phoneNumber: string
): Promise<UserSession | null> {
  const data = await redis.get(sessionKey(phoneNumber));
  if (!data) return null;
  return JSON.parse(data) as UserSession;
}

export async function setSession(session: UserSession): Promise<void> {
  session.updatedAt = Date.now();
  await redis.set(
    sessionKey(session.phoneNumber),
    JSON.stringify(session),
    "EX",
    SESSION_TTL_SECONDS
  );
}

export async function deleteSession(phoneNumber: string): Promise<void> {
  await redis.del(sessionKey(phoneNumber));
}
