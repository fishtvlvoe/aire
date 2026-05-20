export type LicenseActivationBody = {
  serialKey?: unknown;
  deviceId?: unknown;
};

export type LicenseActivationResult =
  | {
      ok: true;
      status: 200;
      body: { success: true };
    }
  | {
      ok: false;
      status: 400 | 409 | 422;
      body: { error: "MISSING_KEY" | "MISSING_DEVICE" | "INVALID_KEY" | "ALREADY_ACTIVATED_OTHER_DEVICE" };
    };

const deviceBindings = new Map<string, string>([["AIRE-TEST-USED-001", "other-device"]]);

export function evaluateLicenseActivation(body: LicenseActivationBody): LicenseActivationResult {
  const serialKey = typeof body.serialKey === "string" ? body.serialKey.trim() : "";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";

  if (serialKey === "") {
    return { ok: false, status: 400, body: { error: "MISSING_KEY" } };
  }

  if (deviceId === "") {
    return { ok: false, status: 400, body: { error: "MISSING_DEVICE" } };
  }

  if (!serialKey.startsWith("AIRE-")) {
    return { ok: false, status: 422, body: { error: "INVALID_KEY" } };
  }

  const existingDeviceId = deviceBindings.get(serialKey);
  if (existingDeviceId && existingDeviceId !== deviceId) {
    return {
      ok: false,
      status: 409,
      body: { error: "ALREADY_ACTIVATED_OTHER_DEVICE" },
    };
  }

  deviceBindings.set(serialKey, deviceId);
  return { ok: true, status: 200, body: { success: true } };
}

export function resetLicenseActivationBindingsForTest(): void {
  deviceBindings.clear();
  deviceBindings.set("AIRE-TEST-USED-001", "other-device");
}
