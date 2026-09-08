import { flavors, type FlavorId } from "@/app/flavors/flavors";
import { spirits, type SpiritId } from "@/app/spirits/spirits";
import { energyOptions, genderOptions, genderPreferenceOptions, mbtiOptions, sanitizeProfile, type SecondProfile } from "@/lib/second/profile";
import { fixedMenuRecipes } from "@/lib/cocktails/fixed-menu";

export const agentDestinations = ["home", "profile", "spirits", "match"] as const;
export const agentAutoStartStorageKey = "second:agent-autostart-match:v1";
export type AgentDestination = (typeof agentDestinations)[number];

export type AgentProposal = {
  profilePatch?: SecondProfile;
  drink?: { spirit: SpiritId; flavor: FlavorId };
  cocktail?: { id: string; name: string; spirit: SpiritId; flavor: FlavorId };
  destination?: AgentDestination;
};

export type AgentReply = {
  reply: string;
  proposal?: AgentProposal;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function sanitizeAgentReply(value: unknown, fallback: string): AgentReply {
  const input = record(value);
  const reply = typeof input?.reply === "string" ? input.reply.trim().slice(0, 600) : fallback;
  const rawProposal = record(input?.proposal);
  if (!rawProposal) return { reply: reply || fallback };

  const rawPatch = record(rawProposal.profilePatch);
  const profilePatch = rawPatch ? sanitizeProfile({
    nickname: rawPatch.nickname,
    age: rawPatch.age,
    heightCm: rawPatch.heightCm,
    gender: genderOptions.find((item) => item === rawPatch.gender),
    preferredGender: genderPreferenceOptions.find((item) => item === rawPatch.preferredGender),
    minPartnerHeightCm: rawPatch.minPartnerHeightCm,
    meetingLocation: rawPatch.meetingLocation,
    mbti: mbtiOptions.find((item) => item === rawPatch.mbti),
    energy: energyOptions.find((item) => item.id === rawPatch.energy)?.id,
  }) : undefined;
  const rawDrink = record(rawProposal.drink);
  const spirit = spirits.find((item) => item.id === rawDrink?.spirit)?.id;
  const flavor = flavors.find((item) => item.id === rawDrink?.flavor)?.id;
  const destination = agentDestinations.find((item) => item === rawProposal.destination);
  const cocktailId = typeof rawProposal.cocktailId === "string" ? rawProposal.cocktailId : "";
  const cocktail = fixedMenuRecipes.find((item) => item.id === cocktailId);
  const proposal: AgentProposal = {
    ...(profilePatch && Object.keys(profilePatch).length ? { profilePatch } : {}),
    ...(spirit && flavor ? { drink: { spirit, flavor } } : {}),
    ...(cocktail ? { cocktail: { id: cocktail.id, name: cocktail.name, spirit: cocktail.baseSpirit, flavor: cocktail.flavor } } : {}),
    ...(destination ? { destination } : {}),
  };
  return Object.keys(proposal).length ? { reply: reply || fallback, proposal } : { reply: reply || fallback };
}
