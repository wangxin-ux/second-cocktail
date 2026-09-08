import assert from "node:assert/strict";
import test from "node:test";
import { mutuallyMatchesPreferences } from "./match-preferences";

test("requires both people's height and gender preferences to match", () => {
  const first = { heightCm: 168, gender: "woman" as const, preferredGender: "man" as const, minPartnerHeightCm: 180 };
  assert.equal(mutuallyMatchesPreferences(first, { heightCm: 182, gender: "man", preferredGender: "woman", minPartnerHeightCm: 165 }), true);
  assert.equal(mutuallyMatchesPreferences(first, { heightCm: 178, gender: "man", preferredGender: "woman" }), false);
  assert.equal(mutuallyMatchesPreferences(first, { heightCm: 182, gender: "man", preferredGender: "man" }), false);
});

test("keeps legacy profiles compatible when no preferences are set", () => {
  assert.equal(mutuallyMatchesPreferences({}, {}), true);
});
