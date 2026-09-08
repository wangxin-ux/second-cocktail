import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAgentReply } from "./intent";

test("keeps only supported agent actions and profile values", () => {
  assert.deepEqual(sanitizeAgentReply({
    reply: "已整理好。",
    proposal: {
      profilePatch: { minPartnerHeightCm: 180, preferredGender: "man", age: 8, unknown: "x" },
      drink: { spirit: "gin", flavor: "refreshing" },
      destination: "match",
      url: "https://example.com",
    },
  }, "fallback"), {
    reply: "已整理好。",
    proposal: {
      profilePatch: { preferredGender: "man", minPartnerHeightCm: 180 },
      drink: { spirit: "gin", flavor: "refreshing" },
      destination: "match",
    },
  });
});

test("drops malformed proposals", () => {
  assert.deepEqual(sanitizeAgentReply({ reply: "可以聊聊。", proposal: { destination: "https://bad.example" } }, "fallback"), { reply: "可以聊聊。" });
});
