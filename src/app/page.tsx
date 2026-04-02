'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { SPREAD_TYPES } from '@/constants/tarotConstants';
import type { TarotCard, TarotResponse } from '@/types/tarot';

type ViewMode = 'reading' | 'history';

type ReadingHistory = {
  id: string;
  spread: string;
  timestamp: string;
  cards: TarotCard[];
};

const HISTORY_STORAGE_KEY = 'tarot_reading_history';

export default function Home() {
  const [reading, setReading] = useState<TarotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('reading');
  const [history, setHistory] = useState<ReadingHistory[]>([]);

  useEffect(() => {
    const rawHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!rawHistory) {
      return;
    }

    try {
      const parsedHistory: ReadingHistory[] = JSON.parse(rawHistory);
      setHistory(parsedHistory);
    } catch (error) {
      console.error('读取历史失败：', error);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  }, []);

  const spreadEntries = useMemo(() => Object.entries(SPREAD_TYPES).slice(0, 4), []);

  const saveToHistory = (result: TarotResponse) => {
    const record: ReadingHistory = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      spread: result.spread,
      timestamp: result.timestamp,
      cards: result.cards,
    };

    setHistory((prevHistory) => {
      const nextHistory = [record, ...prevHistory].slice(0, 20);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      return nextHistory;
    });
  };

  const handleReadingRequest = async (spreadType: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spreadType }),
      });

      const data: TarotResponse = await response.json();
      setReading(data);
      saveToHistory(data);
      setViewMode('reading');
    } catch (error) {
      console.error('Error getting reading:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateTime: string) =>
    new Date(dateTime).toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#0f0a1f] text-[#efe7d2]">
      <div className="pointer-events-none absolute inset-0 aurora-bg" />
      <main className="relative mx-auto max-w-6xl px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-6 sm:pt-12">
        <header className="mb-8 text-center">
          <p className="mb-3 text-xs tracking-[0.4em] text-[#d8c39d]/80">ARCANA ORACLE</p>
          <h1 className="text-3xl font-semibold tracking-[0.18em] text-[#f8ecd2] sm:text-5xl">秘仪塔罗殿</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#d9c8a2]/85 sm:text-base">
            穿越迷雾，倾听古老原型的耳语。每一次抽牌，都是你与命运深处的一次对话。
          </p>
        </header>

        <section className="mb-6 flex justify-center">
          <div className="inline-flex rounded-full border border-[#b8945f]/40 bg-black/30 p-1.5 backdrop-blur">
            <button
              onClick={() => setViewMode('reading')}
              className={`rounded-full px-5 py-2 text-sm transition ${
                viewMode === 'reading'
                  ? 'bg-[#b8945f] text-[#1a1307] shadow-[0_0_18px_rgba(219,175,94,0.45)]'
                  : 'text-[#e7d7b8]/85 hover:text-[#f5e6c8]'
              }`}
            >
              神谕占卜
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`rounded-full px-5 py-2 text-sm transition ${
                viewMode === 'history'
                  ? 'bg-[#b8945f] text-[#1a1307] shadow-[0_0_18px_rgba(219,175,94,0.45)]'
                  : 'text-[#e7d7b8]/85 hover:text-[#f5e6c8]'
              }`}
            >
              占卜历史
            </button>
          </div>
        </section>

        {viewMode === 'reading' && (
          <>
            <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {spreadEntries.map(([name, type]) => (
                <button
                  key={type}
                  onClick={() => handleReadingRequest(type)}
                  disabled={loading}
                  className="rounded-xl border border-[#b8945f]/35 bg-[#1b1432]/75 px-4 py-3 text-sm text-[#f1e4c8] shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d9b377]/70 hover:bg-[#22183f] disabled:opacity-50"
                >
                  {name}
                </button>
              ))}
            </section>

            {loading && <div className="mb-8 text-center text-[#d9c8a2]">群星正在排列，正在为你抽牌...</div>}

            {reading && (
              <section className="space-y-6">
                <div className="text-center text-xs text-[#d9c8a2]/75">
                  {reading.spread} · {formatDate(reading.timestamp)}
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {reading.cards.map((card, index) => (
                    <article
                      key={`${card.id}-${index}`}
                      className="rounded-2xl border border-[#b8945f]/30 bg-[#19122d]/82 p-4 shadow-[0_12px_45px_rgba(0,0,0,0.45)] backdrop-blur"
                    >
                      <div className="relative mb-4 h-64 w-full overflow-hidden rounded-lg bg-[#100b1e]">
                        <Image
                          src={card.imageUrl || ''}
                          alt={card.name}
                          fill
                          className={`object-contain p-2 drop-shadow-[0_0_16px_rgba(255,223,154,0.2)] ${card.isReversed ? 'rotate-180' : ''}`}
                        />
                      </div>
                      <h3 className="mb-2 text-base font-semibold text-[#f7ebd0]">
                        {card.position} · {card.name}
                        {card.isReversed ? '（逆位）' : ''}
                      </h3>
                      <p className="text-sm leading-6 text-[#decda9]">
                        {card.isReversed ? card.reversedMeaning : card.uprightMeaning}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {viewMode === 'history' && (
          <section className="rounded-2xl border border-[#b8945f]/30 bg-[#161028]/78 p-4 shadow-[0_12px_45px_rgba(0,0,0,0.45)] backdrop-blur sm:p-6">
            {history.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#d9c8a2]/75">暂无历史记录，先进行一次占卜吧。</div>
            ) : (
              <ul className="space-y-3">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[#b8945f]/25 bg-black/20 px-4 py-3 text-sm text-[#e7d9bd]"
                  >
                    <div className="mb-1 flex items-center justify-between gap-4">
                      <span className="font-medium text-[#f7ebd0]">{item.spread}</span>
                      <span className="text-xs text-[#cab58e]">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-xs leading-5 text-[#d8c6a1]/85">
                      {item.cards.map((card) => `${card.position}-${card.name}${card.isReversed ? '逆位' : '正位'}`).join(' ｜ ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <footer className="pointer-events-none mt-10 text-center text-sm tracking-[0.24em] text-[#d6bf95]/80">
          命运在等待你的召唤
        </footer>
      </main>
    </div>
  );
}
