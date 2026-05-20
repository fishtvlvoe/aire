import { beforeEach, describe, expect, it } from "vitest";

import {
  evaluateLicenseActivation,
  resetLicenseActivationBindingsForTest,
} from "../license-activation";

describe("license activation device binding", () => {
  beforeEach(() => {
    resetLicenseActivationBindingsForTest();
  });

  it("rejects activation without a serial key", () => {
    expect(evaluateLicenseActivation({ serialKey: "", deviceId: "device-a" })).toEqual({
      ok: false,
      status: 400,
      body: { error: "MISSING_KEY" },
    });
  });

  it("rejects activation without a device id", () => {
    expect(evaluateLicenseActivation({ serialKey: "AIRE-TEST-NEW-001", deviceId: "" })).toEqual({
      ok: false,
      status: 400,
      body: { error: "MISSING_DEVICE" },
    });
  });

  it("allows the same serial key to activate again on the same device", () => {
    expect(evaluateLicenseActivation({ serialKey: "AIRE-TEST-NEW-001", deviceId: "device-a" })).toEqual({
      ok: true,
      status: 200,
      body: { success: true },
    });

    expect(evaluateLicenseActivation({ serialKey: "AIRE-TEST-NEW-001", deviceId: "device-a" })).toEqual({
      ok: true,
      status: 200,
      body: { success: true },
    });
  });

  it("rejects the same serial key on a different device", () => {
    expect(evaluateLicenseActivation({ serialKey: "AIRE-TEST-NEW-002", deviceId: "device-a" }).ok).toBe(true);

    expect(evaluateLicenseActivation({ serialKey: "AIRE-TEST-NEW-002", deviceId: "device-b" })).toEqual({
      ok: false,
      status: 409,
      body: { error: "ALREADY_ACTIVATED_OTHER_DEVICE" },
    });
  });

  it("keeps the used-license fixture bound to another device", () => {
    expect(evaluateLicenseActivation({ serialKey: "AIRE-TEST-USED-001", deviceId: "device-a" })).toEqual({
      ok: false,
      status: 409,
      body: { error: "ALREADY_ACTIVATED_OTHER_DEVICE" },
    });
  });
});
