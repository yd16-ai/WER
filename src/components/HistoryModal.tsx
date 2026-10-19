import React, { useState } from 'react';
import { X, Copy, Check, Trash2, Clock } from 'lucide-react';
import { DrawHistoryRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DrawHistoryRecord[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyHistory = () => {
    if (history.length === 0) return;
    const text = history
      .map((item, idx) => {
        const numbersStr = item.numbers
          .map((num, i) => (item.names[i] ? `${num}번(${item.names[i]})` : `${num}번`))
          .join(', ');
        return `${idx + 1}회차 [${item.timestamp}]: ${numbersStr}`;
      })
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modeLabels: Record<string, string> = {
    slot: '슬롯머신',
    wheel: '룰렛',
    cards: '행운카드',
    lottery: '로또추첨',
    groups: '모둠편성',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-slate-100">추첨 히스토리 기록</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Clock className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">아직 추첨 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-800 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 font-mono">
                      #{history.length - index}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-amber-300 font-mono">
                          {record.numbers.map((n) => `${n}번`).join(', ')}
                        </span>
                        {record.names && record.names.filter(Boolean).length > 0 && (
                          <span className="text-xs font-semibold text-slate-300">
                            ({record.names.filter(Boolean).join(', ')})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{modeLabels[record.mode] || record.mode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{record.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400">
            총 <strong className="text-sky-400 font-mono">{history.length}</strong>건의 기록
          </span>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleCopyHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사됨' : '전체 복사'}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('모든 추첨 기록을 삭제하시겠습니까?')) {
                      onClearHistory();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium rounded-xl border border-rose-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  기록 삭제
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
