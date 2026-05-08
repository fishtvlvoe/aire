'use client';

import { useRef, useState } from 'react';

interface LogoUploaderProps {
  logoPath: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

const MAX_FILE_SIZE = 1024 * 1024;

export default function LogoUploader({ logoPath, onUpload, onRemove }: LogoUploaderProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('Logo 檔案不可超過 1MB');
      return;
    }
    setError('');
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '上傳失敗');
    } finally {
      setIsUploading(false);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  const removeFile = async () => {
    setError('');
    setIsRemoving(true);
    try {
      await onRemove();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '移除失敗');
    } finally {
      setIsRemoving(false);
    }
  };

  const previewUrl = logoPath?.startsWith('/') ? logoPath : logoPath ? `/${logoPath}` : null;

  return (
    <div className="space-y-3">
      {logoPath ? (
        <div className="rounded-lg border border-slate-200 p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Logo 預覽"
              className="max-w-[120px] max-h-[60px] object-contain"
            />
          ) : null}
          <button
            type="button"
            onClick={() => {
              void removeFile();
            }}
            disabled={isRemoving}
            className="mt-4 rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isRemoving ? '移除中...' : '移除 Logo'}
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
          <p className="mb-3 text-sm text-slate-500">尚未上傳 Logo</p>
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className="hidden"
            onChange={(event) => {
              void uploadFile(event.target.files?.[0]);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="rounded bg-[#1B3A6B] px-4 py-2 text-sm font-medium text-white hover:bg-[#23477d] disabled:opacity-50"
          >
            {isUploading ? '上傳中...' : '上傳 Logo'}
          </button>
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
