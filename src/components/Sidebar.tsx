'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { resolveListingHref } from '@/lib/listing-routes'

const navigationItems = [
  { href: '/listings', label: '物件列表' },
  { href: '/listings/new', label: '新增物件' },
];

type Listing = {
  id: number
  status: string
  field_visit_data?: string
  created_at: string
}

function getAddressFromListing(listing: Listing): string {
  if (listing.field_visit_data) {
    try {
      const data = JSON.parse(listing.field_visit_data)
      if (data.address) {
        return data.address.length > 20 ? data.address.substring(0, 20) + '...' : data.address
      }
    } catch {
      // 如果解析失敗，fallback 到 id
    }
  }
  return `#${listing.id}`
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-400/80 text-gray-100'
    case 'field-visit-complete':
      return 'bg-blue-400/80 text-blue-100'
    case 'ready-for-generation':
      return 'bg-amber-400/80 text-amber-100'
    case 'documents-ready':
      return 'bg-green-400/80 text-green-100'
    default:
      return 'bg-gray-400/80 text-gray-100'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'field-visit-complete':
      return '已看屋'
    case 'ready-for-generation':
      return '待生成'
    case 'documents-ready':
      return '已完成'
    default:
      return status
  }
}

export default function Sidebar() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        const response = await fetch('/api/listings')
        if (response.ok) {
          const data = await response.json()
          const sortedListings = data.listings
            .sort((a: Listing, b: Listing) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
          setListings(sortedListings)
        }
      } catch (error) {
        console.error('Failed to fetch listings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentListings()
  }, [])

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

      <div className="border-t border-white/20 pt-6 mt-8">
        <h3 className="text-sm font-semibold mb-4">最近物件</h3>
        {loading ? (
          <div className="text-sm text-white/60">載入中…</div>
        ) : listings.length === 0 ? (
          <div className="text-sm text-white/60">尚無物件</div>
        ) : (
          <div className="flex flex-col gap-2">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={resolveListingHref({ id: listing.id, status: listing.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready' })}
                className="block rounded-md px-3 py-2 text-sm transition hover:bg-white/15"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-white/90">
                    {getAddressFromListing(listing)}
                  </div>
                  <div className="flex">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(listing.status)}`}>
                      {getStatusLabel(listing.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
