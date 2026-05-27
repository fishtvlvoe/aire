import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function sha256File(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function readAuthenticodeSignature(installerPath) {
  if (process.platform !== "win32") {
    return {
      status: "unavailable",
      statusMessage: "Authenticode verification requires Windows",
      subject: null,
      thumbprint: null,
      timestampSubject: null,
    };
  }

  const ps = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      [
        "$sig = Get-AuthenticodeSignature -FilePath $args[0]",
        "$out = [ordered]@{",
        "  status = [string]$sig.Status",
        "  statusMessage = [string]$sig.StatusMessage",
        "  subject = if ($sig.SignerCertificate) { [string]$sig.SignerCertificate.Subject } else { $null }",
        "  thumbprint = if ($sig.SignerCertificate) { [string]$sig.SignerCertificate.Thumbprint } else { $null }",
        "  timestampSubject = if ($sig.TimeStamperCertificate) { [string]$sig.TimeStamperCertificate.Subject } else { $null }",
        "}",
        "$out | ConvertTo-Json -Compress",
      ].join("; "),
      installerPath,
    ],
    { encoding: "utf8" },
  );

  if (ps.status !== 0) {
    return {
      status: "error",
      statusMessage: ps.stderr || ps.stdout || "Get-AuthenticodeSignature failed",
      subject: null,
      thumbprint: null,
      timestampSubject: null,
    };
  }

  return JSON.parse(ps.stdout.trim());
}

export function normalizeSigningStatus(signature) {
  if (signature.status === "Valid") return "valid";
  if (signature.status === "NotSigned") return "unsigned";
  if (signature.status === "unavailable") return "unknown";
  return "invalid";
}

export function buildTrustMetadata({
  installerPath,
  installerSha256,
  workflowUrl,
  commitSha,
  releaseTag,
  sourceArtifactUrl = null,
  signature,
  expectedPublisher = "",
  smartScreenObservation = "not_observed",
  defenderObservation = "not_observed",
  defenderDetectionName = "",
  windowsRuntimeEvidence = [],
  customerReleaseRequested = false,
}) {
  const signingStatus = normalizeSigningStatus(signature);
  const publisherSubject = signature.subject ?? null;
  const publisherMatches =
    !expectedPublisher ||
    Boolean(publisherSubject && publisherSubject.toLowerCase().includes(expectedPublisher.toLowerCase()));
  const defenderClean = defenderObservation === "clean" || defenderObservation === "not_observed";
  const customerReleaseReady =
    customerReleaseRequested &&
    signingStatus === "valid" &&
    publisherMatches &&
    defenderClean &&
    !defenderDetectionName;

  return {
    schema: "aire.windows-installer-trust.v1",
    generatedAt: new Date().toISOString(),
    workflowRunUrl: workflowUrl,
    commitSha,
    releaseTag,
    installerFilename: basename(installerPath),
    installerPath,
    installerSha256,
    sourceArtifactUrl,
    signing: {
      status: signingStatus,
      authenticodeStatus: signature.status,
      statusMessage: signature.statusMessage ?? null,
      publisherSubject,
      expectedPublisher: expectedPublisher || null,
      publisherMatches,
      certificateThumbprint: signature.thumbprint ?? null,
      timestampSubject: signature.timestampSubject ?? null,
      timestampStatus: signature.timestampSubject ? "present" : "missing_or_unavailable",
    },
    observations: {
      smartScreen: smartScreenObservation,
      defender: defenderObservation,
      defenderDetectionName: defenderDetectionName || null,
    },
    windowsRuntimeEvidence,
    customerReleaseRequested,
    customerReleaseReady,
    releaseStatus: customerReleaseReady ? "customer-release-ready" : "internal-only",
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.installer || !args.out) {
    throw new Error("Usage: node scripts/verify-windows-installer-trust.mjs --installer <path> --out <metadata.json>");
  }
  if (!existsSync(args.installer)) {
    throw new Error(`Installer not found: ${args.installer}`);
  }

  const signature = args["signature-json"]
    ? JSON.parse(readFileSync(args["signature-json"], "utf8"))
    : readAuthenticodeSignature(args.installer);
  const metadata = buildTrustMetadata({
    installerPath: args.installer,
    installerSha256: sha256File(args.installer),
    workflowUrl: args["workflow-url"] ?? null,
    commitSha: args.commit ?? null,
    releaseTag: args["release-tag"] ?? null,
    sourceArtifactUrl: args["source-artifact-url"] ?? null,
    signature,
    expectedPublisher: args["expected-publisher"] ?? "",
    smartScreenObservation: args["smart-screen"] ?? "not_observed",
    defenderObservation: args.defender ?? "not_observed",
    defenderDetectionName: args["defender-detection-name"] ?? "",
    windowsRuntimeEvidence: args["windows-runtime-evidence"] ? args["windows-runtime-evidence"].split(",") : [],
    customerReleaseRequested: Boolean(args["customer-release"]),
  });

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  if (metadata.customerReleaseRequested && !metadata.customerReleaseReady) {
    throw new Error(`Windows installer is not customer-release-ready: ${metadata.signing.status}`);
  }
  console.log(JSON.stringify({ releaseStatus: metadata.releaseStatus, signingStatus: metadata.signing.status }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
