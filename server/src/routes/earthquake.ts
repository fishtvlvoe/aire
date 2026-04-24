import { Router } from 'express';

import { db } from '../db.js';

export const earthquakeRouter = Router();

function defaultSinceIso(): string {
  const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - fiveYearsMs).toISOString();
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

earthquakeRouter.get('/data/earthquake', (req, res) => {
  const lat = typeof req.query.lat === 'string' ? Number(req.query.lat) : NaN;
  const lng = typeof req.query.lng === 'string' ? Number(req.query.lng) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  const radiusRaw = typeof req.query.radius === 'string' ? Number(req.query.radius) : 5;
  const radius = Number.isFinite(radiusRaw) ? Math.max(0, radiusRaw) : 5;

  const since = typeof req.query.since === 'string' && req.query.since ? req.query.since : defaultSinceIso();

  try {
    const baseRows = db
      .prepare(
        `SELECT date, magnitude, depth, lat, lng FROM earthquake_records WHERE date >= ?`,
      )
      .all(since) as Array<{
      date: string;
      magnitude: number;
      depth: number;
      lat: number;
      lng: number;
    }>;

    const filtered = baseRows
      .map((r) => ({
        date: r.date,
        magnitude: r.magnitude,
        depth: r.depth,
        distance_km: haversineKm(lat, lng, Number(r.lat), Number(r.lng)),
      }))
      .filter((r) => Number.isFinite(r.distance_km) && r.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json({ data: filtered, total: filtered.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such table: earthquake_records')) {
      res.json({ data: [], total: 0 });
      return;
    }
    res.status(500).json({ error: 'internal_error' });
  }
});
