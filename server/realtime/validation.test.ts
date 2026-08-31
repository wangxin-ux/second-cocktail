import assert from "node:assert/strict";
import test from "node:test";
import { parseCookie } from "./session";
import { allowRateLimit } from "./rate-limit";
import { hashToken, validateTonightSignals } from "./validation";

const valid = { nickname: "Mina", age: 26, meetingLocation: "Bar counter", energy: "open", mbti: "ENFP", spirit: "gin", flavor: "sour", cocktailId: "corpse-reviver", cocktailName: "Corpse Reviver No. 2" };

test("validates the minimum server-owned tonight signals", () => {
  assert.deepEqual(validateTonightSignals(valid), { ...valid, ageBand: 25 });
  assert.equal(validateTonightSignals({ ...valid, age: 17 }), null);
  assert.equal(validateTonightSignals({ ...valid, nickname: "" }), null);
  assert.equal(validateTonightSignals({ ...valid, meetingLocation: "" }), null);
  assert.equal(validateTonightSignals({ ...valid, energy: "anything" }), null);
});

test("cookies expose only the opaque raw token to the lookup layer", () => {
  assert.equal(parseCookie("theme=dark; second_tonight=opaque%2Ftoken"), "opaque/token");
  assert.notEqual(hashToken("opaque/token"), "opaque/token");
});

test("the basic rate limit rejects excess socket actions", () => {
  const key = `test-${Date.now()}`;
  assert.equal(allowRateLimit(key, 2), true);
  assert.equal(allowRateLimit(key, 2), true);
  assert.equal(allowRateLimit(key, 2), false);
});
