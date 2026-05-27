import { describe, expect, it } from "vitest";

import { buildTrustMetadata, normalizeSigningStatus } from "../verify-windows-installer-trust.mjs";

describe("verify-windows-installer-trust", () => {
  it("keeps unsigned installers internal-only", () => {
    const metadata = buildTrustMetadata({
      installerPath: "AIRE_0.1.3_x64-setup.exe",
      installerSha256: "abc",
      workflowUrl: "https://github.com/fishtvlvoe/aire/actions/runs/1",
      commitSha: "sha",
      releaseTag: "aire-v0.1.3",
      signature: { status: "NotSigned", statusMessage: "Not signed" },
      customerReleaseRequested: true,
    });

    expect(metadata.signing.status).toBe("unsigned");
    expect(metadata.customerReleaseReady).toBe(false);
    expect(metadata.releaseStatus).toBe("internal-only");
  });

  it("marks valid signed clean installers as customer-release-ready", () => {
    const metadata = buildTrustMetadata({
      installerPath: "AIRE_0.1.4_x64-setup.exe",
      installerSha256: "def",
      workflowUrl: "https://github.com/fishtvlvoe/aire/actions/runs/2",
      commitSha: "sha",
      releaseTag: "aire-v0.1.4",
      expectedPublisher: "AIRE",
      defenderObservation: "clean",
      signature: {
        status: "Valid",
        statusMessage: "Signature verified",
        subject: "CN=AIRE, O=Fishot",
        thumbprint: "THUMB",
        timestampSubject: "CN=Microsoft Timestamp",
      },
      customerReleaseRequested: true,
    });

    expect(metadata.signing.status).toBe("valid");
    expect(metadata.signing.publisherMatches).toBe(true);
    expect(metadata.customerReleaseReady).toBe(true);
    expect(metadata.releaseStatus).toBe("customer-release-ready");
  });

  it("normalizes unexpected authenticode states as invalid", () => {
    expect(normalizeSigningStatus({ status: "HashMismatch" })).toBe("invalid");
  });
});
