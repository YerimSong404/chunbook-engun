'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { getLogs } from '@/lib/db';
import { LogEvent, LogAction, LogTarget } from '@/lib/types';
import { FileText, Plus, Edit2, Trash2, Eye, RefreshCw, Filter } from 'lucide-react';

// ── 액션별 메타 ────────────────────────────────────────────
const ACTION_META: Record<LogAction, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    view:   { label: '접속',  color: '#6B8E7D', bg: '#EBF2EE', icon: <Eye   size={13} /> },
    create: { label: '작성',  color: '#695D4A', bg: '#F0EBE1', icon: <Plus  size={13} /> },
    update: { label: '수정',  color: '#8C7D6B', bg: '#F9F6F0', icon: <Edit2 size={13} /> },
    delete: { label: '삭제',  color: '#B91C1C', bg: '#FEE2E2', icon: <Trash2 size={13} /> },
};

const TARGET_LABEL: Record<LogTarget, string> = {
    meeting:  '모임',
    member:   '멤버',
    answer:   '답변',
    settings: '설정',
    page:     '페이지',
};

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return '방금 전';
    if (m < 60) return `${m}분 전`;
    if (h < 24) return `${h}시간 전`;
    return `${d}일 전`;
}

function formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleString('ko-KR', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function daysUntilExpiry(expiresAt: number): number {
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));
}

export default function LogPage() {
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterAction, setFilterAction] = useState<LogAction | 'all'>('all');
    const [filterTarget, setFilterTarget] = useState<LogTarget | 'all'>('all');

    async function fetchLogs() {
        const data = await getLogs();
        setLogs(data);
    }

    useEffect(() => {
        fetchLogs().finally(() => setLoading(false));
    }, []);

    async function handleRefresh() {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    }

    const filtered = useMemo(() => {
        return logs.filter((log) => {
            if (filterAction !== 'all' && log.action !== filterAction) return false;
            if (filterTarget !== 'all' && log.target !== filterTarget) return false;
            return true;
        });
    }, [logs, filterAction, filterTarget]);

    return (
        <AppShell>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--primary-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FileText size={18} color="var(--primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>활동 로그</h1>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>7일간 보관 · {logs.length}건</div>
                    </div>
                </div>
                <button
                    id="log-refresh-btn"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 12px', borderRadius: 8,
                        background: 'var(--surface-alt)', color: 'var(--text-sub)',
                        fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                        transition: 'background 0.15s',
                    }}
                >
                    <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    새로고침
                </button>
            </div>

            {/* 필터 */}
            <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
                padding: '12px 14px', background: 'var(--surface)', borderRadius: 10,
                border: '1px solid var(--border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
                    <Filter size={13} color="var(--text-sub)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)' }}>필터</span>
                </div>

                {/* 액션 필터 */}
                {(['all', 'view', 'create', 'update', 'delete'] as const).map((a) => {
                    const isAll = a === 'all';
                    const meta = isAll ? null : ACTION_META[a];
                    const active = filterAction === a;
                    return (
                        <button
                            key={a}
                            id={`log-filter-action-${a}`}
                            onClick={() => setFilterAction(a)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                fontSize: '0.78rem', fontWeight: 600,
                                background: active ? (meta ? meta.bg : 'var(--primary-light)') : 'var(--bg)',
                                color: active ? (meta ? meta.color : 'var(--primary)') : 'var(--text-sub)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {meta?.icon}
                            {isAll ? '전체' : meta?.label}
                        </button>
                    );
                })}

                <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

                {/* 대상 필터 */}
                {(['all', 'meeting', 'member', 'answer', 'settings'] as const).map((t) => {
                    const active = filterTarget === t;
                    return (
                        <button
                            key={t}
                            id={`log-filter-target-${t}`}
                            onClick={() => setFilterTarget(t)}
                            style={{
                                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                fontSize: '0.78rem', fontWeight: 600,
                                background: active ? 'var(--primary-light)' : 'var(--bg)',
                                color: active ? 'var(--primary)' : 'var(--text-sub)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {t === 'all' ? '전체' : TARGET_LABEL[t]}
                        </button>
                    );
                })}
            </div>

            {/* 로그 목록 */}
            {loading ? (
                <div className="spinner" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-sub)' }}>
                    불러오는 중…
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'var(--surface)', borderRadius: 12,
                    border: '1px dashed var(--border)',
                }}>
                    <FileText size={40} color="var(--border)" style={{ marginBottom: 12 }} />
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>로그가 없어요</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map((log, idx) => {
                        const meta = ACTION_META[log.action];
                        const days = daysUntilExpiry(log.expiresAt);
                        return (
                            <div
                                key={log.id}
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    animation: `fadeInUp 0.2s ease ${Math.min(idx, 10) * 0.03}s both`,
                                }}
                            >
                                {/* 액션 아이콘 */}
                                <div style={{
                                    flexShrink: 0,
                                    width: 32, height: 32, borderRadius: 8,
                                    background: meta.bg,
                                    color: meta.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {meta.icon}
                                </div>

                                {/* 내용 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 700,
                                            color: meta.color, background: meta.bg,
                                            padding: '2px 7px', borderRadius: 4,
                                        }}>
                                            {meta.label}
                                        </span>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 600,
                                            color: 'var(--text-sub)', background: 'var(--surface-alt)',
                                            padding: '2px 7px', borderRadius: 4,
                                        }}>
                                            {TARGET_LABEL[log.target]}
                                        </span>
                                        {log.label && (
                                            <span style={{
                                                fontSize: '0.82rem', fontWeight: 600,
                                                color: 'var(--text)', overflow: 'hidden',
                                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160,
                                            }}>
                                                {log.label}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        {log.memberName && (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                                                👤 {log.memberName}
                                            </span>
                                        )}
                                        {log.detail && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                                                · {log.detail}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 시간 + 만료 */}
                                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                                        {timeAgo(log.createdAt)}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--border)', marginTop: 2 }}>
                                        {formatDate(log.createdAt)}
                                    </div>
                                    <div style={{
                                        fontSize: '0.65rem', marginTop: 4,
                                        color: days <= 1 ? '#B91C1C' : 'var(--border)',
                                        fontWeight: days <= 1 ? 700 : 400,
                                    }}>
                                        {days}일 후 만료
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </AppShell>
    );
}
