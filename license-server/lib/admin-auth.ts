import type { VercelRequest } from '@vercel/node';

export function hasValidAdminTokenFromHeaders(authHeader: string | null): boolean {
  const token = process.env.LICENSE_ADMIN_TOKEN;
  if (!token) return false;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const provided = authHeader.slice('Bearer '.length).trim();
  return provided.length > 0 && provided === token;
}

export function hasValidAdminToken(req: VercelRequest): boolean {
  return hasValidAdminTokenFromHeaders(req.headers.authorization ?? null);
}
