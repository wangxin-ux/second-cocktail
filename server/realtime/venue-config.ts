import type { MeetingArea } from "./socket-events";

const developmentAreas: readonly MeetingArea[] = [
  { id: "dev-bar", label: "DEV — Bar", labelZh: "开发 — 吧台区" },
  { id: "dev-lounge", label: "DEV — Lounge", labelZh: "开发 — 休息区" },
  { id: "dev-entrance", label: "DEV — Entrance", labelZh: "开发 — 入口区" },
];

function parseVenueAreas(value: string | undefined): readonly MeetingArea[] | null {
  if (!value) return null;
  try {
    const areas: unknown = JSON.parse(value);
    if (!Array.isArray(areas) || areas.length === 0) return null;
    const parsed = areas.map((area) => {
      if (!area || typeof area !== "object") return null;
      const input = area as Record<string, unknown>;
      const id = typeof input.id === "string" ? input.id.trim().slice(0, 32) : "";
      const label = typeof input.label === "string" ? input.label.trim().slice(0, 80) : "";
      const labelZh = typeof input.labelZh === "string" ? input.labelZh.trim().slice(0, 80) : "";
      return id && label && labelZh ? { id, label, labelZh } : null;
    });
    return parsed.every((area): area is MeetingArea => Boolean(area)) ? parsed : null;
  } catch {
    return null;
  }
}

export function getMeetingAreas(): readonly MeetingArea[] {
  const configured = parseVenueAreas(process.env.VENUE_MEETING_AREAS);
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return developmentAreas;
  throw new Error("VENUE_MEETING_AREAS must contain at least one configured public meeting area in production.");
}
