const windows = new Map<string, number[]>();

export function allowRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const values = (windows.get(key) ?? []).filter((value) => value > now - windowMs);
  if (values.length >= limit) return false;
  values.push(now);
  windows.set(key, values);
  return true;
}
