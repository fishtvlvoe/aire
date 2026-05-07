import type { VercelRequest } from '@vercel/node';

export function hasValidAdminToken(req: VercelRequest): boolean {
  const token = process.env.LICENSE_ADMIN_TOKEN;
  if (!token) return false;

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return false;
  }

  const provided = header.slice('Bearer '.length).trim();
  return provided.length > 0 && provided === token;
}

