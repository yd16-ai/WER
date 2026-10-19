import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';
import { StudentItem, ClassSettings } from '../types';
import { playTickSound, startDrumroll, stopDrumroll, playFanfareSound } from '../utils/soundEffects';

interface SlotPickerProps {
  students: StudentItem[];
  settings: ClassSettings;
  onPickWinners: (numbers: number[]) => void;
  onResetPicked: () => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  students,
  settings,
  onPickWinners,
  onResetPicked,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);
  const [lastWinners, setLastWinners] = useState<number[]>([]);
  const rollIntervalRef = useRef<number | null>(null);

  // Available students (not excluded, and if preventDuplicates is true, not already picked)
  const availableStudents = students.filter(
    (s) => !s.isExcluded && (!settings.preventDuplicates || !s.isPicked)
  );

  const pickCount = Math.min(settings.pickCount, Math.max(1, availableStudents.length));

  // Initialize display
  useEffect(() => {
    if (lastWinners.length > 0) {
      setDisplayNumbers(lastWinners);
    } else if (availableStudents.length > 0) {
      setDisplayNumbers(availableStudents.slice(0, pickCount).map((s) => s.id));
    } else {
      setDisplayNumbers([1]);
    }
  }, [students, pickCount]);

  const fireConfetti = () => {
    try {
      const end = Date.now() + 1000;
      const colors = ['#38bdf8', '#818cf8', '#f43f5e', '#fbbf24', '#34d399'];
      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (e) {
      console.debug('Confetti suppressed', e);
    }
  };

  const startDraw = () => {
    if (isRolling) return;
    if (availableStudents.length === 0) {
      return;
    }

    const countToPick = Math.min(pickCount, availableStudents.length);
    setIsRolling(true);
    setLastWinners([]);

    if (settings.soundEnabled) {
      startDrumroll();
    }

    const availableIds = availableStudents.map((s) => s.id);
    let speed = 40;
    const duration = settings.animationSpeed === 'fast' ? 1400 : settings.animationSpeed === 'slow' ? 3200 : 2200;
    const startTime = Date.now();

    const updateRoll = () => {
      const elapsed = Date.now() - startTime;

      // Random mock numbers for animation
      const temp: number[] = [];
      for (let i = 0; i < countToPick; i++) {
        const randIndex = Math.floor(Math.random() * availableIds.length);
        temp.push(availableIds[randIndex]);
      }
      setDisplayNumbers(temp);

      if (settings.soundEnabled && elapsed % 80 < 30) {
        playTickSound(350 + Math.random() * 200, 0.02);
      }

      if (elapsed < duration) {
        // Decelerate towards the end
        if (elapsed > duration * 0.65) {
          speed = Math.min(speed + 14, 240);
        }
        rollIntervalRef.current = window.setTimeout(updateRoll, speed);
      } else {
        // Complete roll and pick real distinct winners
        stopDrumroll();
        const shuffled = [...availableIds].sort(() => Math.random() - 0.5);
        const finalWinners = shuffled.slice(0, countToPick);

        setDisplayNumbers(finalWinners);
        setLastWinners(finalWinners);
        setIsRolling(false);

        if (settings.soundEnabled) {
          playFanfareSound();
        }
        fireConfetti();
        onPickWinners(finalWinners);
      }
    };

    updateRoll();
  };

  // Keyboard shortcut: Spacebar to pick
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        startDraw();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, availableStudents, pickCount, settings]);

  const getStudentName = (id: number) => {
    const s = students.find((item) => item.id === id);
    return s && s.name ? s.name : null;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4">
      {/* Status banner */}
      <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-6">
        <span>
          추첨 가능: <strong className="text-emerald-400 font-mono tabular-nums">{availableStudents.length}</strong>명
        </span>
        <span aria-hidden="true">·</span>
        <span>
          전체 대상: <strong className="text-slate-200 font-mono tabular-nums">{students.filter((s) => !s.isExcluded).length}</strong>명
        </span>
        {settings.preventDuplicates && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-sky-400">중복 추첨 방지 ON</span>
          </>
        )}
      </div>

      {/* Main Showcase Board */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {availableStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-slate-100 mb-2">모든 번호가 추첨되었습니다!</h3>
            <p className="text-slate-400 text-sm mb-6">1번부터 24번까지 모두 당첨되었습니다.</p>
            <button
              onClick={onResetPicked}
              className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              추첨 목록 초기화하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Winners Display */}
            <div className={`flex flex-wrap items-center justify-center gap-4 md:gap-8 my-4 ${displayNumbers.length > 2 ? 'scale-90 md:scale-100' : ''}`}>
              {displayNumbers.map((num, idx) => {
                const name = getStudentName(num);
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center transition-all duration-300"
                  >
                    <div
                      className={`relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48 rounded-3xl border-2 transition-all duration-200 ${
                        isRolling
                          ? 'border-sky-500/60 bg-slate-800/80 shadow-lg shadow-sky-500/10 scale-95'
                          : lastWinners.includes(num)
                          ? 'border-amber-400 bg-gradient-to-b from-amber-500/10 to-slate-800 shadow-xl shadow-amber-500/20 scale-105 ring-4 ring-amber-400/20'
                          : 'border-slate-700 bg-slate-800/60'
                      }`}
                    >
                      <span
                        className={`font-black tracking-tight tabular-nums transition-all ${
                          displayNumbers.length > 3
                            ? 'text-5xl md:text-7xl'
                            : 'text-6xl md:text-8xl'
                        } ${
                          isRolling
                            ? 'text-sky-300 animate-pulse'
                            : lastWinners.includes(num)
                            ? 'text-amber-300'
                            : 'text-slate-100'
                        }`}
                      >
                        {num}
                      </span>
                      <span className="absolute top-3 right-4 text-xs font-bold text-slate-500 tracking-wider">
                        NO.{num}
                      </span>
                    </div>

                    {settings.showNames && name && (
                      <div className="mt-3 text-center">
                        <span className="text-lg md:text-xl font-bold text-slate-200">
                          {name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sub-label */}
            <div className="mt-4 mb-8 text-center text-xs md:text-sm text-slate-400">
              {isRolling ? (
                <span className="text-sky-400 font-semibold animate-pulse">두구두구... 추첨 중입니다!</span>
              ) : lastWinners.length > 0 ? (
                <span className="text-amber-400 font-semibold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {lastWinners.map((w) => `${w}번`).join(', ')} 당첨을 축하합니다!
                </span>
              ) : (
                <span>[추첨 시작] 버튼 또는 키보드 [스페이스바]를 눌러주세요</span>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={startDraw}
                disabled={isRolling}
                className="group relative px-10 py-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xl md:text-2xl rounded-2xl shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-95 transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>{isRolling ? '추첨 진행 중...' : `${pickCount}명 번호 뽑기`}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick helper footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between w-full text-xs text-slate-500 px-2 gap-3">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[11px]">
            Space
          </kbd>
          <span>스페이스바로 바로 뽑기</span>
        </div>
        <div className="flex items-center gap-3">
          {lastWinners.length > 0 && (
            <button
              onClick={() => {
                const text = lastWinners
                  .map((num) => {
                    const name = getStudentName(num);
                    return name ? `${num}번 ${name}` : `${num}번`;
                  })
                  .join(', ');
                navigator.clipboard.writeText(text);
                alert(`결과가 복사되었습니다: ${text}`);
              }}
              className="text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
            >
              결과 클립보드 복사
            </button>
          )}
          {settings.preventDuplicates && (
            <button
              onClick={onResetPicked}
              className="text-slate-400 hover:text-rose-400 underline underline-offset-4 transition-colors"
            >
              추첨 목록 초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
