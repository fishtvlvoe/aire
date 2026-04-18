import React, { useState } from 'react';

interface RegenerateButtonProps {
  listingId: number;
  documentType: string;
  onSuccess: (result: unknown) => void;
}

export const RegenerateButton: React.FC<RegenerateButtonProps> = ({ listingId, documentType, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '產生失敗');
      onSuccess(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '產生失敗';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50">
        {loading ? '產出中...' : '重新產出'}
      </button>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};
