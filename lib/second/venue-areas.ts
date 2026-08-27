export type VenueArea = { id: string; label: string; labelZh: string };

// Demo-only area-level labels. Replace this one config when a real venue is known.
export const demoVenueAreas: readonly VenueArea[] = [
  { id: "bar", label: "Bar", labelZh: "吧台区" },
  { id: "lounge", label: "Lounge", labelZh: "休息区" },
  { id: "entrance", label: "Entrance", labelZh: "入口区" },
];
