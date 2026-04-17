import Link from 'next/link';

const navigationItems = [
  { href: '/listings', label: '物件列表' },
  { href: '/listings/new', label: '新增物件' },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col bg-[#1B3A6B] px-6 py-8 text-white shadow-lg font-['Manrope']">
      <div className="mb-10 border-b border-white/20 pb-6">
        <p className="text-lg font-bold leading-snug">建安不動產 AI 系統</p>
      </div>

      <nav className="flex flex-col gap-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-white/15"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
