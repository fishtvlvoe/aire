'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type LicenseStatus = 'issued' | 'activated' | 'revoked';
type StatusFilter = 'all' | LicenseStatus;
type EditableUserField = 'contactName' | 'company' | 'email';
type ToastState = { type: 'success' | 'error'; message: string } | null;

interface LicenseItem {
  index: number;
  licenseKey: string;
  status: LicenseStatus;
  contactName: string | null;
  company: string | null;
  email: string | null;
  machineId: string | null;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  issuedBy: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  features: string[];
}

interface ListResponse {
  items: LicenseItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface CreateResponse {
  items: Array<{
    licenseKey: string;
    status: 'issued';
    createdAt: string;
    expiresAt: string | null;
    features: string[];
  }>;
}

type EditingCellState = {
  licenseKey: string;
  field: EditableUserField;
  value: string;
} | null;

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--fg)',
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gap: '24px',
  },
  alert: {
    border: '1px solid #fde68a',
    background: '#fffbeb',
    color: '#92400e',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  titleWrap: {
    display: 'grid',
    gap: '6px',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    color: 'var(--muted)',
    fontSize: '14px',
  },
  logoutButton: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '9px 14px',
    background: 'var(--bg)',
    color: 'var(--fg)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  kpiGrid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    border: '1px solid var(--border)',
    borderRadius: '12px',
    background: 'var(--bg)',
    padding: '18px',
  },
  cardTitle: {
    margin: '0 0 16px',
    fontSize: '18px',
    lineHeight: 1.4,
  },
  fieldLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    color: 'var(--muted)',
    fontWeight: 600,
  },
  textInput: {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    color: 'var(--fg)',
    background: 'var(--bg)',
  },
  section: {
    display: 'grid',
    gap: '14px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--fg)',
  },
  buttonPrimary: {
    border: '1px solid var(--primary)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    background: 'var(--primary)',
    cursor: 'pointer',
  },
  buttonSubtle: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--fg)',
    background: 'var(--bg)',
    cursor: 'pointer',
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  generatedBox: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: '#f8fafc',
    padding: '12px',
    display: 'grid',
    gap: '8px',
  },
  helperTitle: {
    margin: 0,
    color: 'var(--muted)',
    fontSize: '12px',
    fontWeight: 600,
  },
  keyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  keyCode: {
    fontSize: '12px',
    color: 'var(--fg)',
    wordBreak: 'break-all' as const,
  },
  keyCopyButton: {
    border: 0,
    background: 'transparent',
    color: '#2563eb',
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
  },
  listCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  filterWrap: {
    display: 'inline-flex',
    gap: '4px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '4px',
    background: '#f8fafc',
  },
  filterButton: {
    border: 0,
    borderRadius: '8px',
    padding: '7px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--muted)',
  },
  filterButtonActive: {
    background: 'var(--bg)',
    color: 'var(--fg)',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.2)',
  },
  tableWrap: {
    overflowX: 'auto' as const,
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: '760px',
    fontSize: '14px',
  },
  tableHeadCell: {
    textAlign: 'left' as const,
    padding: '12px 14px',
    background: '#f8fafc',
    color: 'var(--fg)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  },
  tableCell: {
    padding: '12px 14px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top' as const,
  },
  tableCellRight: {
    padding: '12px 14px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top' as const,
    textAlign: 'right' as const,
  },
  userEmpty: {
    color: 'var(--muted)',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  iconButton: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '6px',
    width: '30px',
    height: '30px',
    background: 'var(--bg)',
    color: 'var(--fg)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    color: 'var(--muted)',
    fontSize: '12px',
    flexWrap: 'wrap' as const,
  },
  paginationInner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  inlineButton: {
    border: '1px solid var(--border)',
    borderRadius: '6px',
    background: 'var(--bg)',
    color: 'var(--fg)',
    fontSize: '12px',
    padding: '5px 8px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 50,
    display: 'grid',
    placeItems: 'center',
    padding: '16px',
  },
  modal: {
    width: '100%',
    maxWidth: '640px',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    background: 'var(--bg)',
    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.2)',
  },
  modalBody: {
    padding: '18px',
    display: 'grid',
    gap: '12px',
  },
  modalFooter: {
    borderTop: '1px solid var(--border)',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  transferGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  toast: {
    position: 'fixed' as const,
    right: '16px',
    bottom: '16px',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.22)',
    zIndex: 60,
  },
  statusIssued: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#f1f5f9',
    color: '#334155',
  },
  statusActivated: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#d1fae5',
    color: '#047857',
  },
  statusRevoked: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#fee2e2',
    color: '#b91c1c',
  },
  userButtonName: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    border: 0,
    background: 'transparent',
    borderRadius: '6px',
    padding: '4px 6px',
    margin: '0 -6px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--fg)',
    cursor: 'pointer',
  },
  userButtonSub: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    border: 0,
    background: 'transparent',
    borderRadius: '6px',
    padding: '4px 6px',
    margin: '0 -6px',
    fontSize: '12px',
    color: 'var(--muted)',
    cursor: 'pointer',
  },
  userEditInput: {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '13px',
    color: 'var(--fg)',
    background: 'var(--bg)',
  },
} as const;

export default function AdminLicensesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [listData, setListData] = useState<ListResponse>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [issuedTotal, setIssuedTotal] = useState(0);
  const [activatedTotal, setActivatedTotal] = useState(0);
  const [revokedTotal, setRevokedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  const [count, setCount] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [issuedBy, setIssuedBy] = useState('admin');
  const [allowAdvancedExport, setAllowAdvancedExport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  const [revokeTarget, setRevokeTarget] = useState<LicenseItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const [transferTarget, setTransferTarget] = useState<LicenseItem | null>(null);
  const [transferNewCompany, setTransferNewCompany] = useState('');
  const [transferNewContactName, setTransferNewContactName] = useState('');
  const [transferNewEmail, setTransferNewEmail] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [editingCell, setEditingCell] = useState<EditingCellState>(null);
  const [updatingInfoKey, setUpdatingInfoKey] = useState<string | null>(null);
  const skipNextBlurCommitRef = useRef(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  };

  async function apiCall(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const res = await fetch(input, { credentials: 'same-origin', ...init });
    if (res.status === 401) {
      router.replace('/admin/login');
      throw new Error('unauthorized');
    }
    return res;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE', credentials: 'same-origin' });
    router.replace('/admin/login');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadStats = async () => {
    const statuses: LicenseStatus[] = ['issued', 'activated', 'revoked'];
    const responses = await Promise.all(
      statuses.map(async (status) => {
        const response = await apiCall(`/api/admin/licenses?page=1&pageSize=1&status=${status}`);
        if (!response.ok) return { status, total: 0 };
        const data = (await response.json()) as ListResponse;
        return { status, total: data.total };
      }),
    );

    const totals: Record<LicenseStatus, number> = {
      issued: 0,
      activated: 0,
      revoked: 0,
    };
    responses.forEach(({ status, total }) => {
      totals[status] = total;
    });
    setIssuedTotal(totals.issued);
    setActivatedTotal(totals.activated);
    setRevokedTotal(totals.revoked);
  };

  const loadList = async (page: number, filter: StatusFilter, searchText: string) => {
    setLoading(true);
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(listData.pageSize),
    });
    if (filter !== 'all') query.set('status', filter);
    if (searchText.trim()) query.set('search', searchText.trim());

    const response = await apiCall(`/api/admin/licenses?${query.toString()}`);
    if (!response.ok) {
      showToast('error', '載入序號清單失敗');
      setLoading(false);
      return;
    }
    const data = (await response.json()) as ListResponse;
    setListData(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadList(1, statusFilter, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, debouncedSearch]);

  const todayIssued = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return listData.items.filter((item) => item.createdAt.startsWith(today)).length;
  }, [listData.items]);

  const maxPage = Math.max(1, Math.ceil(listData.total / listData.pageSize));

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const features = ['disclosure-document'];
    if (allowAdvancedExport) features.push('advanced-export');
    const safeCount = Math.max(1, Math.min(100, Number(count) || 1));
    let expiresAtIso: string | null = null;
    if (expiresAt.trim()) {
      const parsedDate = new Date(expiresAt);
      if (Number.isNaN(parsedDate.getTime())) {
        showToast('error', '到期時間格式不正確');
        setSubmitting(false);
        return;
      }
      expiresAtIso = parsedDate.toISOString();
    }

    const response = await apiCall('/api/admin/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: safeCount,
        expiresAt: expiresAtIso,
        issuedBy: issuedBy.trim() || 'admin',
        features,
      }),
    });

    const data = (await response.json()) as { error?: string } & CreateResponse;
    if (!response.ok) {
      showToast('error', data.error ?? '序號建立失敗');
      setSubmitting(false);
      return;
    }

    const keys = data.items.map((item) => item.licenseKey);
    setGeneratedKeys(keys);
    showToast('success', `已建立 ${keys.length} 組序號`);
    setSubmitting(false);
    await Promise.all([loadStats(), loadList(1, statusFilter, debouncedSearch)]);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const response = await apiCall('/api/admin/licenses/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: revokeTarget.licenseKey,
        reason: revokeReason.trim() || undefined,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      showToast('error', data.error ?? '停用失敗');
      setRevoking(false);
      return;
    }
    setRevoking(false);
    setRevokeTarget(null);
    setRevokeReason('');
    showToast('success', '序號已停用');
    await Promise.all([loadStats(), loadList(1, statusFilter, debouncedSearch)]);
  };

  const openTransferDialog = (item: LicenseItem) => {
    setTransferTarget(item);
    setTransferNewCompany('');
    setTransferNewContactName('');
    setTransferNewEmail('');
    setTransferReason('');
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    if (!transferReason.trim()) {
      showToast('error', '請填寫轉讓原因');
      return;
    }

    setTransferring(true);
    const response = await apiCall('/api/admin/licenses/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: transferTarget.licenseKey,
        reason: transferReason.trim(),
        newCompany: transferNewCompany.trim() ? transferNewCompany.trim() : null,
        newContactName: transferNewContactName.trim() ? transferNewContactName.trim() : null,
        newEmail: transferNewEmail.trim() ? transferNewEmail.trim() : null,
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      showToast('error', data.error ?? '轉讓失敗');
      setTransferring(false);
      return;
    }

    setTransferring(false);
    setTransferTarget(null);
    showToast('success', '序號已轉讓（已停用舊序號並核發新序號）');
    await Promise.all([loadStats(), loadList(1, statusFilter, debouncedSearch)]);
  };

  const handleUnbindMachine = async (item: LicenseItem) => {
    if (!window.confirm('確認要解綁此序號的機器綁定嗎？')) return;

    const response = await apiCall('/api/admin/licenses/unbind-machine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: item.licenseKey }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      showToast('error', data.error ?? '解綁失敗');
      return;
    }

    setListData((prev) => ({
      ...prev,
      items: prev.items.map((row) => (row.licenseKey === item.licenseKey ? { ...row, machineId: null } : row)),
    }));
    showToast('success', '已解綁機器');
  };

  const handleExportCsv = () => {
    if (generatedKeys.length === 0) {
      showToast('error', '目前沒有可匯出的新序號');
      return;
    }
    const csv = `licenseKey\n${generatedKeys.join('\n')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    showToast('success', '已複製');
  };

  const startInlineEdit = (item: LicenseItem, field: EditableUserField) => {
    if (item.status === 'issued') return;
    setEditingCell({ licenseKey: item.licenseKey, field, value: item[field] ?? '' });
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setUpdatingInfoKey(null);
  };

  const commitInlineEdit = async () => {
    if (!editingCell) return;
    const { licenseKey, field } = editingCell;
    const nextValueRaw = editingCell.value;
    const nextValue = nextValueRaw.trim();

    const current = listData.items.find((item) => item.licenseKey === licenseKey);
    if (!current) {
      cancelInlineEdit();
      return;
    }

    const previousValue = (current[field] ?? '').trim();
    if (previousValue === nextValue) {
      cancelInlineEdit();
      return;
    }

    setUpdatingInfoKey(licenseKey);
    const response = await apiCall('/api/admin/licenses/update-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        field,
        value: nextValue ? nextValue : null,
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      showToast('error', data.error ?? '更新失敗');
      setUpdatingInfoKey(null);
      return;
    }

    setListData((prev) => ({
      ...prev,
      items: prev.items.map((row) =>
        row.licenseKey === licenseKey ? { ...row, [field]: nextValue ? nextValue : null } : row,
      ),
    }));
    setUpdatingInfoKey(null);
    setEditingCell(null);
    showToast('success', '已更新');
  };

  const renderUserLine = (
    item: LicenseItem,
    field: EditableUserField,
    buttonStyle: (typeof styles)['userButtonName'] | (typeof styles)['userButtonSub'],
    placeholder: string,
  ) => {
    const isEditing = editingCell?.licenseKey === item.licenseKey && editingCell.field === field;
    if (isEditing) {
      return (
        <input
          value={editingCell.value}
          onChange={(event) => setEditingCell({ ...editingCell, value: event.target.value })}
          autoFocus
          disabled={updatingInfoKey === item.licenseKey}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              skipNextBlurCommitRef.current = true;
              void commitInlineEdit();
              return;
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              skipNextBlurCommitRef.current = true;
              cancelInlineEdit();
            }
          }}
          onBlur={() => {
            if (skipNextBlurCommitRef.current) {
              skipNextBlurCommitRef.current = false;
              return;
            }
            void commitInlineEdit();
          }}
          style={styles.userEditInput}
        />
      );
    }

    const value = item[field];
    const text = value?.trim() ? value.trim() : placeholder;
    return (
      <button type="button" onClick={() => startInlineEdit(item, field)} style={buttonStyle}>
        {text}
      </button>
    );
  };

  const renderLicenseActions = (item: LicenseItem) => (
    <>
      <IconButton title="複製序號到剪貼簿" onClick={() => void copyText(item.licenseKey)} icon={<ClipboardIcon />} />

      {item.status !== 'revoked' && <IconButton title="停用此序號" onClick={() => setRevokeTarget(item)} icon={<BanIcon />} />}

      {item.status !== 'revoked' && <IconButton title="轉讓序號" onClick={() => openTransferDialog(item)} icon={<TransferIcon />} />}

      {item.status === 'activated' && item.machineId && (
        <IconButton title="解綁機器" onClick={() => void handleUnbindMachine(item)} icon={<UnlinkIcon />} />
      )}
    </>
  );

  return (
    <main className="admin-license-page" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.alert}>此頁為管理端，需授權 Token。</div>

        <header style={styles.header}>
          <div style={styles.titleWrap}>
            <h1 style={styles.title}>序號控制後台</h1>
            <p style={styles.subtitle}>建立、查詢、停用客戶序號</p>
          </div>
          <button type="button" onClick={() => void handleLogout()} style={styles.logoutButton}>
            登出
          </button>
        </header>

        <section style={styles.kpiGrid}>
          <KpiCard label="有效序號" value={issuedTotal + activatedTotal} />
          <KpiCard label="已啟用" value={activatedTotal} />
          <KpiCard label="已停用" value={revokedTotal} />
          <KpiCard label="今日新增" value={todayIssued} />
        </section>

        <section className="admin-content-grid" style={styles.contentGrid}>
          <form onSubmit={handleCreate} style={{ ...styles.card, ...styles.section }}>
            <h2 style={styles.cardTitle}>建立序號</h2>

            <Field label="數量 (1~100)">
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(event) => setCount(Math.max(1, Math.min(100, Number(event.target.value) || 1)))}
                style={styles.textInput}
                placeholder="1~100"
              />
            </Field>

            <Field label="到期時間">
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                style={styles.textInput}
              />
            </Field>

            <Field label="核發者">
              <input
                type="text"
                value={issuedBy}
                onChange={(event) => setIssuedBy(event.target.value)}
                style={styles.textInput}
              />
            </Field>

            <div style={styles.section}>
              <p style={styles.helperTitle}>功能權限</p>
              <label style={styles.checkboxRow}>
                <input checked readOnly type="checkbox" />
                disclosure-document (預設)
              </label>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={allowAdvancedExport}
                  onChange={(event) => setAllowAdvancedExport(event.target.checked)}
                />
                advanced-export
              </label>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.buttonPrimary,
                  ...(submitting ? styles.disabled : {}),
                }}
              >
                {submitting ? '建立中...' : '建立序號'}
              </button>
              <button type="button" onClick={handleExportCsv} style={styles.buttonSubtle}>
                匯出 CSV
              </button>
            </div>

            <div style={styles.generatedBox}>
              <p style={styles.helperTitle}>最新建立序號</p>
              {generatedKeys.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>尚未建立</div>
              ) : (
                generatedKeys.map((key) => (
                  <div key={key} style={styles.keyRow}>
                    <code style={styles.keyCode}>{key}</code>
                    <button type="button" onClick={() => void copyText(key)} style={styles.keyCopyButton}>
                      複製
                    </button>
                  </div>
                ))
              )}
            </div>
          </form>

          <div className="admin-license-list-card" style={{ ...styles.card, ...styles.section }}>
            <div style={styles.listCardTop}>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜尋序號、姓名、公司或 Email..."
                style={{ ...styles.textInput, width: '280px', maxWidth: '100%' }}
              />
              <div style={styles.filterWrap}>
                {(['all', 'issued', 'activated', 'revoked'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatusFilter(item)}
                    style={{
                      ...styles.filterButton,
                      ...(statusFilter === item ? styles.filterButtonActive : {}),
                    }}
                  >
                    {item === 'all' ? '全部' : item}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-desktop" style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.tableHeadCell, width: '74px' }}>編號</th>
                    <th style={styles.tableHeadCell}>序號 (Key)</th>
                    <th style={{ ...styles.tableHeadCell, width: '110px' }}>狀態</th>
                    <th style={styles.tableHeadCell}>使用者</th>
                    <th style={{ ...styles.tableHeadCell, textAlign: 'right', width: '190px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td style={styles.tableCell} colSpan={5}>
                        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>載入中...</div>
                      </td>
                    </tr>
                  ) : listData.items.length === 0 ? (
                    <tr>
                      <td style={styles.tableCell} colSpan={5}>
                        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                          目前沒有符合條件的序號
                        </div>
                      </td>
                    </tr>
                  ) : (
                    listData.items.map((item) => (
                      <tr key={item.licenseKey}>
                        <td style={styles.tableCell}>{String(item.index).padStart(3, '0')}</td>
                        <td style={styles.tableCell}>
                          <code style={styles.keyCode}>{item.licenseKey}</code>
                        </td>
                        <td style={styles.tableCell}>
                          <StatusBadge status={item.status} />
                        </td>
                        <td style={styles.tableCell}>
                          {item.status === 'issued' ? (
                            <div style={styles.userEmpty}>—</div>
                          ) : (
                            <div style={{ display: 'grid', gap: '2px' }}>
                              {renderUserLine(item, 'contactName', styles.userButtonName, '—')}
                              {renderUserLine(item, 'company', styles.userButtonSub, '—')}
                              {renderUserLine(item, 'email', styles.userButtonSub, '—')}
                            </div>
                          )}
                        </td>
                        <td style={styles.tableCellRight}>
                          <div style={styles.actionRow}>{renderLicenseActions(item)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-table-mobile">
              {loading ? (
                <div className="admin-card admin-card-empty">載入中...</div>
              ) : listData.items.length === 0 ? (
                <div className="admin-card admin-card-empty">目前沒有符合條件的序號</div>
              ) : (
                listData.items.map((item) => (
                  <article key={`${item.licenseKey}-mobile`} className="admin-card">
                    <div className="admin-card-row">
                      <span className="admin-card-label">編號</span>
                      <span>{String(item.index).padStart(3, '0')}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">序號</span>
                      <code className="admin-card-key">{item.licenseKey}</code>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">狀態</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">姓名</span>
                      <span>{item.contactName?.trim() ? item.contactName.trim() : '—'}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">公司</span>
                      <span>{item.company?.trim() ? item.company.trim() : '—'}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">Email</span>
                      <span>{item.email?.trim() ? item.email.trim() : '—'}</span>
                    </div>
                    <div className="admin-card-actions">{renderLicenseActions(item)}</div>
                  </article>
                ))
              )}
            </div>

            <div style={styles.pagination}>
              <span>共 {listData.total} 筆</span>
              <div style={styles.paginationInner}>
                <button
                  type="button"
                  disabled={listData.page <= 1 || loading}
                  onClick={() => void loadList(listData.page - 1, statusFilter, debouncedSearch)}
                  style={{
                    ...styles.inlineButton,
                    ...((listData.page <= 1 || loading) ? styles.disabled : {}),
                  }}
                >
                  上一頁
                </button>
                <span>
                  {listData.page} / {maxPage}
                </span>
                <button
                  type="button"
                  disabled={listData.page >= maxPage || loading}
                  onClick={() => void loadList(listData.page + 1, statusFilter, debouncedSearch)}
                  style={{
                    ...styles.inlineButton,
                    ...((listData.page >= maxPage || loading) ? styles.disabled : {}),
                  }}
                >
                  下一頁
                </button>
              </div>
            </div>
          </div>
        </section>

        {revokeTarget && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modal, maxWidth: '520px' }}>
              <div style={styles.modalBody}>
                <h3 style={{ margin: 0, fontSize: '20px' }}>確認停用序號</h3>
                <code style={{ ...styles.keyCode, border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                  {revokeTarget.licenseKey}
                </code>
                <textarea
                  value={revokeReason}
                  onChange={(event) => setRevokeReason(event.target.value)}
                  placeholder="停用原因（選填）"
                  style={{ ...styles.textInput, minHeight: '96px', resize: 'vertical' }}
                />
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => {
                    setRevokeTarget(null);
                    setRevokeReason('');
                  }}
                  style={styles.buttonSubtle}
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={revoking}
                  onClick={() => void handleRevoke()}
                  style={{
                    ...styles.buttonPrimary,
                    background: '#dc2626',
                    borderColor: '#dc2626',
                    ...(revoking ? styles.disabled : {}),
                  }}
                >
                  {revoking ? '停用中...' : '確認停用'}
                </button>
              </div>
            </div>
          </div>
        )}

        {transferTarget && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalBody}>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>確認轉讓序號</h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>此操作會停用舊序號並核發新序號。</p>
                </div>
                <div style={styles.generatedBox}>
                  <p style={styles.helperTitle}>舊序號</p>
                  <code style={styles.keyCode}>{transferTarget.licenseKey}</code>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    目前：{transferTarget.company ?? '—'} / {transferTarget.contactName ?? '—'}
                  </div>
                </div>

                <div style={styles.transferGrid}>
                  <Field label="新公司">
                    <input
                      value={transferNewCompany}
                      onChange={(event) => setTransferNewCompany(event.target.value)}
                      style={styles.textInput}
                    />
                  </Field>
                  <Field label="新姓名">
                    <input
                      value={transferNewContactName}
                      onChange={(event) => setTransferNewContactName(event.target.value)}
                      style={styles.textInput}
                    />
                  </Field>
                  <Field label="新 Email">
                    <input
                      value={transferNewEmail}
                      onChange={(event) => setTransferNewEmail(event.target.value)}
                      style={styles.textInput}
                    />
                  </Field>
                  <Field label="轉讓原因（必填）">
                    <input
                      value={transferReason}
                      onChange={(event) => setTransferReason(event.target.value)}
                      style={styles.textInput}
                    />
                  </Field>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setTransferTarget(null)} style={styles.buttonSubtle}>
                  取消
                </button>
                <button
                  type="button"
                  disabled={transferring}
                  onClick={() => void handleTransfer()}
                  style={{
                    ...styles.buttonPrimary,
                    ...(transferring ? styles.disabled : {}),
                  }}
                >
                  {transferring ? '轉讓中...' : '確認轉讓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            style={{
              ...styles.toast,
              background: toast.type === 'error' ? '#dc2626' : 'var(--primary)',
            }}
          >
            {toast.message}
          </div>
        )}
      </div>

    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.card}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: '28px', lineHeight: 1.2, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '4px' }}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  if (status === 'activated') {
    return <span style={styles.statusActivated}>{status}</span>;
  }
  if (status === 'revoked') {
    return <span style={styles.statusRevoked}>{status}</span>;
  }
  return <span style={styles.statusIssued}>{status}</span>;
}

function IconButton({ title, icon, onClick }: { title: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} style={styles.iconButton}>
      {icon}
    </button>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h-1a3 3 0 0 1-6 0H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <path d="M9 4h6" />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M6.8 6.8 17.2 17.2" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 7h13l-3-3" />
      <path d="M20 7l-3 3" />
      <path d="M17 17H4l3 3" />
      <path d="M4 17l3-3" />
    </svg>
  );
}

function UnlinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" />
      <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11" />
      <path d="M3 3l18 18" />
    </svg>
  );
}
