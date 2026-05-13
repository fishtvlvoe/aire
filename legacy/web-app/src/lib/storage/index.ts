// Manages /app/data/uploads/<listing-id>/ and /app/data/outputs/<listing-id>/ directory structure
// Ensures directories exist and returns their paths

import path from "path";
import fs from "fs";

const DATA_ROOT = process.env.DATA_ROOT || "./data";

// Ensure the uploads directory for a listing exists and return its path
export function getUploadsDir(listingId: string): string {
  const dir = path.join(DATA_ROOT, "uploads", listingId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Ensure the outputs directory for a listing exists and return its path
export function getOutputsDir(listingId: string): string {
  const dir = path.join(DATA_ROOT, "outputs", listingId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Return the database file path (from DATABASE_PATH env or default)
export function getDbPath(): string {
  return (
    process.env.DATABASE_PATH ||
    process.env.DB_PATH ||
    path.join(DATA_ROOT, "db", "app.sqlite")
  );
}

// Initialize base data directory structure (call on container startup)
export function initDataDirs(): void {
  const dirs: string[] = [
    path.join(DATA_ROOT, "uploads"),
    path.join(DATA_ROOT, "outputs"),
    path.join(DATA_ROOT, "db"),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
