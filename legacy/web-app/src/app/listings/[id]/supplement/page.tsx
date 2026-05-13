import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

// 獨立補件入口，將請求轉至實際補件表單頁面
export default async function SupplementPage({ params }: Props) {
  const { id } = await params;
  redirect(`/listings/${id}/supplementary`);
}
