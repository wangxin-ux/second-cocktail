const venuePattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function rootHostname() {
  const configured = process.env.VENUE_ROOT_DOMAIN?.trim().toLowerCase();
  if (configured) return configured;
  const appOrigin = process.env.APP_ORIGIN;
  if (!appOrigin) return process.env.NODE_ENV === "production" ? "" : "localhost";
  try {
    return new URL(appOrigin).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostname(value: string | null | undefined) {
  const first = value?.split(",")[0]?.trim().toLowerCase().replace(/\.$/, "") ?? "";
  if (!first) return "";
  if (first.startsWith("[")) return first.slice(1, first.indexOf("]"));
  return first.split(":")[0];
}

export function resolveVenueIdFromHost(value: string | null | undefined) {
  const host = hostname(value);
  const root = rootHostname();
  if (!host || !root) return null;
  if (host === root || host === `www.${root}`) return "main";
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "::1"].includes(host)) return "local";
  if (!host.endsWith(`.${root}`)) return null;
  const subdomain = host.slice(0, -(root.length + 1));
  return venuePattern.test(subdomain) ? subdomain : null;
}

export function resolveVenueIdFromRequest(request: Request) {
  return resolveVenueIdFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
}

export function isAllowedVenueOrigin(value: string | undefined) {
  if (!value) return process.env.NODE_ENV !== "production";
  try {
    const origin = new URL(value);
    if (process.env.NODE_ENV === "production" && origin.protocol !== "https:") return false;
    return Boolean(resolveVenueIdFromHost(origin.host));
  } catch {
    return false;
  }
}
