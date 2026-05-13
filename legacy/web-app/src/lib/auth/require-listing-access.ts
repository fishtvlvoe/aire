import { getListing, type Listing } from '@/lib/db';
import type { ResolvedUser } from './resolve-user';

export type ListingAccessResult =
  | { allowed: true; listing: Listing }
  | { allowed: false; status: 401 | 403 | 404; message: string; code: string };

export function requireListingAccess(
  user: ResolvedUser | null,
  listingId: number | string,
): ListingAccessResult {
  if (!user) {
    return { allowed: false, status: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' };
  }

  const id = typeof listingId === 'number' ? listingId : Number(listingId);
  if (Number.isNaN(id)) {
    return { allowed: false, status: 404, message: 'Listing not found', code: 'LISTING_NOT_FOUND' };
  }

  const listing = getListing(id);
  if (!listing) {
    return { allowed: false, status: 404, message: 'Listing not found', code: 'LISTING_NOT_FOUND' };
  }

  if (user.role === 'admin' || listing.owner_id === user.id) {
    return { allowed: true, listing };
  }

  return { allowed: false, status: 403, message: 'Forbidden', code: 'FORBIDDEN' };
}
