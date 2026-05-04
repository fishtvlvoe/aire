'use client';

import Link from 'next/link';
import { getSupplementaryStatus } from '@/lib/listings/supplementary-status';

interface Props {
  listingId: number;
  listingStatus: string;
  supplementaryData: string | null | undefined;
}

export default function SupplementStatusIcon({ listingId, listingStatus, supplementaryData }: Props) {
  const status = getSupplementaryStatus(listingStatus, supplementaryData);
  const href = `/listings/${listingId}/supplement`;

  if (status === 'not-started') {
    return (
      <span title="尚未開始補件" aria-label="尚未開始補件" className="inline-flex items-center text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }

  if (status === 'missing') {
    return (
      <Link href={href} title="有缺件，點此補件" aria-label="有缺件，點此補件"
        className="inline-flex items-center text-amber-500 hover:text-amber-600 transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </Link>
    );
  }

  return (
    <Link href={href} title="補件已完成，點此查看" aria-label="補件已完成，點此查看"
      className="inline-flex items-center text-emerald-500 hover:text-emerald-600 transition">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    </Link>
  );
}
