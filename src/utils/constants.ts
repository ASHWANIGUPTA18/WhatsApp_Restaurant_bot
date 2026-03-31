import { env } from "../config/env.js";

export const WA_API_BASE_URL = `https://graph.facebook.com/${env.WA_API_VERSION}`;
export const WA_MESSAGES_URL = `${WA_API_BASE_URL}/${env.WA_PHONE_NUMBER_ID}/messages`;

export const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours
export const SESSION_PREFIX = "session:";
