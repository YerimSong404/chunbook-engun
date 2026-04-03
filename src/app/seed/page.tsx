'use client';

import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { addMeeting } from '@/lib/db';
import AppShell from '@/components/AppShell';

// ─── 원본 데이터 ───────────────────────────────────────────
const RAW_DATA = [
    { date: '2022-01-30', session: '1회',  book: '살고 싶다는 농담',             presenters: ['조은영'], absentees: ['김도연', '고정은'] },
    { date: '2022-02-19', session: '2회',  book: '달러구트 꿈 백화점',           presenters: ['송예림'], absentees: [] },
    { date: '2022-04-10', session: '3회',  book: '불편한 편의점',                presenters: [], absentees: [] },
    { date: '2022-05-15', session: '4회',  book: '두 번째 지구는 없다',          presenters: ['강유진'], absentees: [] },
    { date: '2022-07-10', session: '5회',  book: '어서오세요, 휴남동 서점입니다', presenters: ['성연지'], absentees: [] },
    { date: '2022-08-15', session: '6회',  book: '물고기는 존재하지 않는다',     presenters: ['김혜수'], absentees: [] },
    { date: '2022-09-17', session: '7회',  book: '나는 매주 시체를 보러 간다',   presenters: ['조은영'], absentees: ['김도연', '고정은'] },
    { date: '2022-10-09', session: '8회',  book: '기분이 태도가 되지 않게',      presenters: ['송예림'], absentees: [] },
    { date: '2022-11-13', session: '9회',  book: '어떤 양형 이유',               presenters: ['강유진'], absentees: [] },
    { date: '2022-12-11', session: '10회', book: '죽은 자의 집 청소',            presenters: [], absentees: [] },
    { date: '2023-01-29', session: '11회', book: '과식의 심리학',                presenters: ['김혜수'], absentees: [] },
    { date: '2023-02-19', session: '12회', book: '달 드링크 서점',               presenters: ['성연지'], absentees: [] },
    { date: '2023-03-12', session: '13회', book: '파이 이야기',                  presenters: ['조은영'], absentees: ['김도연'] },
    { date: '2023-04-15', session: '14회', book: '어떤 물질의 사랑',             presenters: ['송예림'], absentees: [] },
    { date: '2023-06-25', session: '15회', book: '게으르다는 착각',              presenters: ['김혜수'], absentees: [] },
    { date: '2023-07-22', session: '16회', book: '싯다르타',                     presenters: ['강유진'], absentees: [] },
    { date: '2023-08-19', session: '17회', book: '다행한 불행',                  presenters: [], absentees: [] },
    { date: '2023-09-23', session: '18회', book: '슬픈 세상의 기쁜 말',          presenters: ['고정은'], absentees: [] },
    { date: '2023-10-21', session: '19회', book: '심리학이 이토록 재밌을 줄이야', presenters: ['성연지'], absentees: [] },
    { date: '2023-12-02', session: '20회', book: '도파민네이션',                 presenters: ['강유진'], absentees: ['김도연'] },
    { date: '2024-01-13', session: '21회', book: '좋은 곳에서 만나요',           presenters: ['조은영'], absentees: [] },
    { date: '2024-02-25', session: '22회', book: '삶의 발명',                    presenters: ['고정은'], absentees: [] },
    { date: '2024-03-20', session: '23회', book: '돌이킬 수 있는',               presenters: ['송예림'], absentees: [] },
    { date: '2024-04-27', session: '24회', book: '목구멍 속의 유령',             presenters: ['김혜수'], absentees: [] },
    { date: '2024-06-23', session: '25회', book: '구의 증명',                    presenters: ['성연지'], absentees: [] },
    { date: '2024-08-24', session: '26회', book: '지구 끝의 온실',               presenters: ['김도연'], absentees: [] },
    { date: '2024-10-12', session: '27회', book: '인간관계론',                   presenters: ['강유진'], absentees: [] },
    { date: '2024-11-23', session: '28회', book: '우리가 겨울을 지나온 방식',     presenters: ['조은영'], absentees: [] },
    { date: '2024-12-14', session: '29회', book: '동물농장',                     presenters: ['송예림'], absentees: [] },
    { date: '2024-12-14', session: '30회', book: '연말결산',                     presenters: [], absentees: [] },
    { date: '2025-01-11', session: '31회', book: '고양이를 잡아먹은 오리',       presenters: ['김혜수'], absentees: [] },
    { date: '2025-02-15', session: '32회', book: '또다시 같은 꿈을 꾸었어',      presenters: ['성연지'], absentees: [] },
    { date: '2025-03-29', session: '33회', book: '폭풍의 집',                    presenters: ['김도연'], absentees: [] },
    { date: '2025-02-17', session: '34회', book: '찌그러져도 동그라미입니다',     presenters: ['강유진'], absentees: [] },
    { date: '2025-05-24', session: '35회', book: '이동진의 닥대끌대오재 독서법', presenters: ['송예림'], absentees: [] },
    { date: '2025-06-28', session: '36회', book: '파과',                         presenters: ['조은영'], absentees: [] },
    { date: '2025-07-19', session: '37회', book: '두고 온 여름',                 presenters: ['성연지'], absentees: [] },
    { date: '2025-08-23', session: '38회', book: '라이프리스트',                 presenters: ['김혜수'], absentees: [] },
    { date: '2025-10-18', session: '39회', book: '가공범',                       presenters: ['김도연'], absentees: ['고정은'] },
    { date: '2025-11-15', session: '40회', book: '딸아, 돈공부 미루지 마라',     presenters: ['강유진'], absentees: [] },
    { date: '2025-12-20', session: '41회', book: '팩트풀니스',                   presenters: ['김혜수'], absentees: [] },
    { date: '2026-01-17', session: '42회', book: '연말결산+프랑켄슈타인(X)',     presenters: [], absentees: [] },
    { date: '2026-02-28', session: '43회', book: '프랑켄슈타인',                 presenters: ['조은영'], absentees: [] },
];

function parseNum(session: string) {
    return parseInt(session.replace('회', ''), 10);
}

function toTimestamp(dateStr: string) {
    return new Date(dateStr + 'T00:00:00+09:00').getTime();
}

type LogEntry = { icon: string; text: string };

export default function SeedPage() {
    const { members, meetings } = useData();
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [log, setLog] = useState<LogEntry[]>([]);

    // 이름 → ID 매핑
    const nameToId = Object.fromEntries(members.map(m => [m.name, m.id]));

    // 데이터에 등장하는 모든 멤버 이름
    const allNames = [...new Set(RAW_DATA.flatMap(r => [...r.presenters, ...r.absentees]))];
    const missingNames = allNames.filter(n => !nameToId[n]);

    // 기존 meetingNumber 목록
    const existingNumbers = new Set(
        meetings.map(m => m.meetingNumber).filter((n): n is number => n !== undefined)
    );

    const handleSeed = async () => {
        if (!confirm(`총 ${RAW_DATA.length}개의 모임 데이터를 Firestore에 삽입합니다. 계속할까요?`)) return;
        setRunning(true);
        setDone(false);
        setLog([]);

        const entries: LogEntry[] = [];
        let successCount = 0;
        let skipCount = 0;

        for (const raw of RAW_DATA) {
            const num = parseNum(raw.session);

            if (existingNumbers.has(num)) {
                entries.push({ icon: '⏭️', text: `${raw.session} "${raw.book}" — 이미 존재 (skip)` });
                skipCount++;
                continue;
            }

            const presenterId = raw.presenters.length > 0
                ? (nameToId[raw.presenters[0]] ?? '')
                : '';

            const absentMemberIds = raw.absentees
                .map(name => nameToId[name] ?? '')
                .filter(id => id !== '');

            try {
                await addMeeting({
                    date: toTimestamp(raw.date),
                    book: raw.book,
                    author: '',
                    presenterMemberId: presenterId,
                    topics: [],
                    status: 'done',
                    meetingNumber: num,
                    ...(absentMemberIds.length > 0 ? { absentMemberIds } : {}),
                });
                entries.push({ icon: '✅', text: `${raw.session} "${raw.book}"` });
                successCount++;
            } catch (e) {
                entries.push({ icon: '❌', text: `${raw.session} "${raw.book}" — 오류: ${String(e)}` });
            }

            // 상태 업데이트 (매 항목마다)
            setLog([...entries]);
        }

        entries.push({ icon: '🎉', text: `완료! 성공 ${successCount}건, 스킵 ${skipCount}건` });
        setLog([...entries]);
        setRunning(false);
        setDone(true);
    };

    return (
        <AppShell>
            <h1 className="page-title" style={{ marginBottom: 8 }}>🌱 과거 기록 데이터 삽입</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: 24, lineHeight: 1.6 }}>
                1회~43회 데이터를 Firestore에 일괄 삽입합니다.<br />
                이미 존재하는 회차(meetingNumber 기준)는 자동으로 건너뜁니다.
            </p>

            {/* 멤버 ID 매핑 현황 */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 12 }}>멤버 매핑 현황</div>
                {members.length === 0 ? (
                    <p style={{ color: 'var(--accent)', fontSize: '0.88rem' }}>
                        ⚠️ 멤버 데이터가 없습니다. 먼저 멤버를 등록해주세요.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {allNames.map(name => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                                <span>{nameToId[name] ? '✅' : '❌'}</span>
                                <span style={{ fontWeight: 600 }}>{name}</span>
                                {nameToId[name]
                                    ? <span style={{ color: 'var(--text-sub)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{nameToId[name]}</span>
                                    : <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>← Firestore에 없음</span>
                                }
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 기존 데이터 현황 */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-title" style={{ marginBottom: 8 }}>현재 Firestore 상태</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)' }}>
                    등록된 모임: <strong>{meetings.length}건</strong>
                    {existingNumbers.size > 0 && (
                        <> (회차: {[...existingNumbers].sort((a, b) => a - b).join(', ')})</>
                    )}
                </p>
            </div>

            {/* 삽입 버튼 */}
            {missingNames.length > 0 ? (
                <div style={{
                    background: 'var(--accent-light, #fff3cd)',
                    border: '1px solid var(--accent)',
                    borderRadius: 12,
                    padding: '16px',
                    marginBottom: 16,
                    fontSize: '0.88rem',
                    color: 'var(--accent)',
                }}>
                    ⚠️ 다음 멤버가 Firestore에 없어서 삽입을 시작할 수 없어요:<br />
                    <strong>{missingNames.join(', ')}</strong><br />
                    먼저 관리자 페이지에서 멤버를 추가해주세요.
                </div>
            ) : (
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 24 }}
                    onClick={handleSeed}
                    disabled={running || members.length === 0}
                >
                    {running ? '삽입 중…' : `🚀 ${RAW_DATA.length}개 모임 삽입 시작`}
                </button>
            )}

            {/* 로그 */}
            {log.length > 0 && (
                <div className="card">
                    <div className="section-title" style={{ marginBottom: 12 }}>
                        {done ? '결과' : '진행 중…'} ({log.length}/{RAW_DATA.length + 1})
                    </div>
                    <div style={{
                        maxHeight: 400,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                    }}>
                        {log.map((entry, i) => (
                            <div key={i} style={{ fontSize: '0.83rem', display: 'flex', gap: 6 }}>
                                <span>{entry.icon}</span>
                                <span style={{ color: entry.icon === '❌' ? 'var(--accent)' : 'inherit' }}>
                                    {entry.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppShell>
    );
}
