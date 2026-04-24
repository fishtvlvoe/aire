import { Router } from 'express';

import { db } from '../db.js';

export const realPriceRouter = Router();

realPriceRouter.get('/data/real-price', (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city : '';
  const district = typeof req.query.district === 'string' ? req.query.district : undefined;
  const year = typeof req.query.year === 'string' ? req.query.year : undefined;
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;

  const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
  const offsetRaw = typeof req.query.offset === 'string' ? Number(req.query.offset) : 0;

  const limit = Number.isFinite(limitRaw) ? Math.max(0, Math.min(500, Math.trunc(limitRaw))) : 50;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.trunc(offsetRaw)) : 0;

  if (!city) {
    res.status(400).json({ error: 'city is required' });
    return;
  }

  const where: string[] = ['city = ?'];
  const params: unknown[] = [city];

  if (district) {
    where.push('(district IS NULL OR district = ?)');
    params.push(district);
  }
  if (year) {
    where.push('year = ?');
    params.push(year);
  }
  if (type) {
    where.push('type = ?');
    params.push(type);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const totalRow = db
      .prepare(`SELECT COUNT(*) as total FROM real_price_records ${whereSql}`)
      .get(...params) as { total?: number };

    const rows = db
      .prepare(`SELECT * FROM real_price_records ${whereSql} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    res.json({ data: rows, total: Number(totalRow?.total ?? 0) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such table: real_price_records')) {
      res.json({ data: [], total: 0 });
      return;
    }
    res.status(500).json({ error: 'internal_error' });
  }
});
