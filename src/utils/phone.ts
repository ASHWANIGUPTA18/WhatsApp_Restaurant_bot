export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");

  // Remove leading zeros
  normalized = normalized.replace(/^0+/, "");

  return normalized;
}
