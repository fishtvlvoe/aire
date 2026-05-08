import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AdminBreadcrumb() {
  return (
    <Link
      href="/listings"
      className="text-sm text-slate-500 hover:text-[#1B3A6B] transition mb-4 inline-flex items-center gap-1"
    >
      <ChevronLeft size={16} />
      <span>返回物件列表</span>
    </Link>
  );
}
