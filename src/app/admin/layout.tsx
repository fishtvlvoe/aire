import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
      <div className="flex w-full">
        <Sidebar />
        <main className="flex-1 p-8 min-w-0">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
