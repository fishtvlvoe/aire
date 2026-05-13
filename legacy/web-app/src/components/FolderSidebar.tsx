'use client';

import { useEffect, useState } from 'react';

export type Folder = { id: number; name: string; listing_count: number };
export type FolderSel = number | 'none' | null;

interface Props {
  selected: FolderSel;
  archivedView: boolean;
  onSelect: (sel: FolderSel) => void;
  onSelectArchive: () => void;
  onFoldersChange?: (folders: Folder[]) => void;
}

export default function FolderSidebar({ selected, archivedView, onSelect, onSelectArchive, onFoldersChange }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  function notifyChange(updated: Folder[]) {
    setFolders(updated);
    onFoldersChange?.(updated);
  }

  useEffect(() => {
    void fetch('/api/listings/folders')
      .then(r => r.json())
      .then((d: { folders: Folder[] }) => notifyChange(d.folders));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const res = await fetch('/api/listings/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      const d = (await res.json()) as { folder: Folder };
      notifyChange([...folders, d.folder].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setAdding(false);
    } else {
      const d = (await res.json()) as { error?: string };
      alert(d.error ?? '建立失敗');
    }
  }

  async function handleRename(id: number, name: string) {
    const res = await fetch(`/api/listings/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      notifyChange(folders.map(f => f.id === id ? { ...f, name } : f));
    } else {
      const d = (await res.json()) as { error?: string };
      alert(d.error ?? '更名失敗');
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('確定刪除此資料夾？物件不會被刪除，只會移到未分類。')) return;
    const res = await fetch(`/api/listings/folders/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notifyChange(folders.filter(f => f.id !== id));
      if (selected === id) onSelect(null);
    }
  }

  const navBtn = (label: string, active: boolean, count: number | null, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-md px-3 py-2 text-sm flex items-center justify-between transition ${active ? 'bg-[#1B3A6B] text-white' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      <span>{label}</span>
      {count !== null && (
        <span className={`text-xs rounded-full px-1.5 py-0.5 ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
      )}
    </button>
  );

  return (
    <aside className="w-52 flex-none border-r border-slate-200 bg-white px-2 py-4 min-h-full">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">物件管理</p>
      {navBtn('全部', !archivedView && selected === null, null, () => onSelect(null))}
      {navBtn('未分類', !archivedView && selected === 'none', null, () => onSelect('none'))}

      {folders.length > 0 && (
        <p className="mt-3 mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">我的資料夾</p>
      )}
      {folders.map(folder => (
        <FolderItem
          key={folder.id}
          folder={folder}
          active={!archivedView && selected === folder.id}
          onClick={() => onSelect(folder.id)}
          onRename={(name) => void handleRename(folder.id, name)}
          onDelete={() => void handleDelete(folder.id)}
        />
      ))}

      {adding ? (
        <div className="mt-1 flex gap-1">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') void handleCreate();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            placeholder="資料夾名稱"
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button type="button" onClick={() => void handleCreate()} className="rounded bg-[#1B3A6B] px-2 py-1 text-xs text-white">確認</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-1 w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-400 hover:bg-slate-100 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-none">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          新增資料夾
        </button>
      )}

      <div className="mt-4 border-t border-slate-100 pt-2">
        {navBtn('封存區', archivedView, null, onSelectArchive)}
      </div>
    </aside>
  );
}

function FolderItem({ folder, active, onClick, onRename, onDelete }: {
  folder: Folder;
  active: boolean;
  onClick: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) onRename(trimmed);
    else setEditName(folder.name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="my-0.5">
        <input
          autoFocus
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setEditName(folder.name); setEditing(false); } }}
          onBlur={commitRename}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
    );
  }

  return (
    <div className={`group my-0.5 flex items-center rounded-md ${active ? 'bg-[#1B3A6B]' : 'hover:bg-slate-100'}`}>
      <button type="button" onClick={onClick} className="min-w-0 flex-1 px-3 py-2 text-left text-sm truncate">
        <span className={active ? 'text-white' : 'text-slate-700'}>{folder.name}</span>
        <span className={`ml-1.5 text-xs ${active ? 'text-white/60' : 'text-slate-400'}`}>{folder.listing_count}</span>
      </button>
      <div className="flex gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition">
        <button type="button" title="重新命名" onClick={() => setEditing(true)}
          className={`rounded p-1 hover:bg-white/20 ${active ? 'text-white/70' : 'text-slate-400 hover:text-slate-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
          </svg>
        </button>
        <button type="button" title="刪除資料夾" onClick={onDelete}
          className={`rounded p-1 ${active ? 'text-white/70 hover:bg-white/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
