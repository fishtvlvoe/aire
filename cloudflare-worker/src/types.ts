export interface LicenseRecord {
  status: "inactive" | "active" | "revoked";
  device_id?: string;
  device_name?: string;
  os_version?: string;
  activated_at?: string;
  valid_until?: string | null;
}

export interface Env {
  LICENSES: KVNamespace;
}
