import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedVenueOrigin, resolveVenueIdFromHost } from "./venue";

test("resolves the root and one bar subdomain into separate venues", () => {
  process.env.APP_ORIGIN = "https://xinxinyuntu.top";
  assert.equal(resolveVenueIdFromHost("xinxinyuntu.top"), "main");
  assert.equal(resolveVenueIdFromHost("www.xinxinyuntu.top"), "main");
  assert.equal(resolveVenueIdFromHost("lab.xinxinyuntu.top"), "lab");
  assert.equal(resolveVenueIdFromHost("other.example.com"), null);
  assert.equal(resolveVenueIdFromHost("nested.lab.xinxinyuntu.top"), null);
});

test("only accepts HTTPS origins belonging to a configured venue", () => {
  process.env.APP_ORIGIN = "https://xinxinyuntu.top";
  assert.equal(isAllowedVenueOrigin("https://lab.xinxinyuntu.top"), true);
  assert.equal(isAllowedVenueOrigin("https://attacker.example"), false);
});
