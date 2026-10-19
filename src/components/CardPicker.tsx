import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Shuffle, Eye, EyeOff, Sparkles, HelpCircle } from 'lucide-react';
import { StudentItem, ClassSettings } from '../types';
import { playFlipSound, playFanfareSound } from '../utils/soundEffects';

interface CardPickerProps {
  students: StudentItem[];
  settings: ClassSettings;
  onPickWinners: (numbers: number[]) => void;
  onResetPicked: () => void;
}

interface CardState {
  originalId: number;
  revealed: boolean;
}

export const CardPicker: React.FC<CardPickerProps> = ({
  students,
  settings,
  onPickWinners,
}) => {
  const [cards, setCards] = useState<CardState[]>([]);
  const [lastFlippedNumber, setLastFlippedNumber] = useState<number | null>(null);

  // Initialize and shuffle cards
  const initializeCards = () => {
    // Only non-excluded students
    const validStudents = students.filter((s) => !s.isExcluded);
    const shuffled = [...validStudents]
      .sort(() => Math.random() - 0.5)
      .map((s) => ({
        originalId: s.id,
        revealed: s.isPicked,
      }));
    setCards(shuffled);
    setLastFlippedNumber(null);
  };

  useEffect(() => {
    initializeCards();
  }, [students.length]);

  const handleCardClick = (index: number) => {
    const card = cards[index];
    if (card.revealed) return;

    if (settings.soundEnabled) {
      playFlipSound();
    }

    const newCards = [...cards];
    newCards[index].revealed = true;
    setCards(newCards);
    setLastFlippedNumber(card.originalId);

    if (settings.soundEnabled) {
      setTimeout(() => playFanfareSound(), 200);
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    onPickWinners([card.originalId]);
  };

  // Pick random hidden card
  const pickRandomHidden = () => {
    const unrevealedIndices = cards
      .map((c, idx) => (!c.revealed ? idx : -1))
      .filter((idx) => idx !== -1);

    if (unrevealedIndices.length === 0) return;
    const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    handleCardClick(randomIdx);
  };

  // Reveal all cards
  const revealAll = () => {
    if (settings.soundEnabled) playFlipSound();
    setCards((prev) => prev.map((c) => ({ ...c, revealed: true })));
  };

  // Hide all cards & reshuffle
  const reshuffleAll = () => {
    initializeCards();
    if (settings.soundEnabled) playFlipSound();
  };

  const getStudent = (id: number) => students.find((s) => s.id === id);

  const unrevealedCount = cards.filter((c) => !c.revealed).length;

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between w-full mb-6 gap-4 px-2">
        <div className="flex items-center gap-3 text-xs md:text-sm text-slate-400">
          <span>
            남은 카드: <strong className="text-amber-400 font-mono">{unrevealedCount}</strong> / {cards.length}장
          </span>
          {lastFlippedNumber !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">
                방금 뽑힌 번호: <strong>{lastFlippedNumber}번</strong>
                {settings.showNames && getStudent(lastFlippedNumber)?.name ? ` (${getStudent(lastFlippedNumber)?.name})` : ''}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={pickRandomHidden}
            disabled={unrevealedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            랜덤 1장 열기
          </button>

          <button
            onClick={reshuffleAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            다시 섞기
          </button>

          <button
            onClick={revealAll}
            disabled={unrevealedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 transition-colors disabled:opacity-40"
          >
            <Eye className="w-4 h-4" />
            전체 공개
          </button>
        </div>
      </div>

      {/* 24 Cards Responsive Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 w-full">
        {cards.map((card, idx) => {
          const student = getStudent(card.originalId);
          return (
            <div
              key={idx}
              onClick={() => handleCardClick(idx)}
              className="perspective-1000 h-28 sm:h-36 cursor-pointer select-none group"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  card.revealed ? 'rotate-y-180' : 'group-hover:scale-105'
                }`}
              >
                {/* Front of Card (Hidden Mystery State) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 group-hover:border-amber-400/80 shadow-lg flex flex-col items-center justify-center p-2 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-700/50 flex items-center justify-center mb-1 text-amber-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                    행운 카드
                  </span>
                </div>

                {/* Back of Card (Revealed Number State) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-b from-amber-500/15 via-slate-800 to-slate-900 border-2 border-amber-400 shadow-xl flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight leading-none">
                    {card.originalId}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400/80 mt-1">
                    {card.originalId}번
                  </span>
                  {settings.showNames && student?.name && (
                    <span className="text-xs font-semibold text-slate-100 truncate w-full px-1 mt-0.5">
                      {student.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
