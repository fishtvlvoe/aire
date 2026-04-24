import express, { Router } from 'express';

export const parseTranscriptRouter = Router();

parseTranscriptRouter.post(
  '/data/parse-transcript',
  express.text({ type: 'text/plain', limit: '1mb' }),
  (req, res) => {
    const body = typeof req.body === 'string' ? req.body : '';
    if (!body || body.trim().length === 0) {
      res.status(400).json({ error: 'body is required' });
      return;
    }

    // TODO(Wave 3): Copy or symlink parser logic from src/lib/parsers/transcript-parser.ts
    // to avoid duplicating business logic between server and client.
    res.json({
      fields: { _placeholder: 'parser-not-yet-wired' },
      confidence: 0,
    });
  },
);
