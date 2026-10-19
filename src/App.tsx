import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Users,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  Disc,
  CircleDot,
  Grid,
} from 'lucide-react';
import { StudentItem, ClassSettings, PickerMode, DrawHistoryRecord } from './types';
import { SlotPicker } from './components/SlotPicker';
import { WheelPicker } from './components/WheelPicker';
import { CardPicker } from './components/CardPicker';
import { LotteryPicker } from './components/LotteryPicker';
import { GroupMaker } from './components/GroupMaker';
import { StudentListModal } from './components/StudentListModal';
import { HistoryModal } from './components/HistoryModal';
import { NumberGridOverview } from './components/NumberGridOverview';
import { setMuted } from './utils/soundEffects';

const DEFAULT_SETTINGS: ClassSettings = {
  minNum: 1,
  maxNum: 24,
  preventDuplicates: true,
  pickCount: 1,
  soundEnabled: true,
  showNames: true,
  animationSpeed: 'normal',
};

// Default 1~24 students
const createInitialStudents = (): StudentItem[] => {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: '',
    isExcluded: false,
    isPicked: false,
  }));
};

export default function App() {
  const [activeMode, setActiveMode] = useState<PickerMode>('slot');
  const [students, setStudents] = useState<StudentItem[]>(() => {
    try {
      const saved = localStorage.getItem('class_students_24');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Failed to load students', e);
    }
    return createInitialStudents();
  });

  const [settings, setSettings] = useState<ClassSettings>(() => {
    try {
      const saved = localStorage.getItem('class_settings_24');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.debug('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<DrawHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('class_history_24');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Failed to load history', e);
    }
    return [];
  });

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync settings with Web Audio
  useEffect(() => {
    setMuted(!settings.soundEnabled);
    try {
      localStorage.setItem('class_settings_24', JSON.stringify(settings));
    } catch (e) {
      console.debug('Failed to save settings', e);
    }
  }, [settings]);

  // Persist students
  useEffect(() => {
    try {
      localStorage.setItem('class_students_24', JSON.stringify(students));
    } catch (e) {
      console.debug('Failed to save students', e);
    }
  }, [students]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('class_history_24', JSON.stringify(history));
    } catch (e) {
      console.debug('Failed to save history', e);
    }
  }, [history]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle picked winners
  const handlePickWinners = (pickedNumbers: number[]) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const winnerNames = pickedNumbers.map((id) => {
      const s = students.find((item) => item.id === id);
      return s && s.name ? s.name : '';
    });

    // Mark as picked
    setStudents((prev) =>
      prev.map((s) => {
        if (pickedNumbers.includes(s.id)) {
          return {
            ...s,
            isPicked: true,
            pickedOrder: history.length + 1,
          };
        }
        return s;
      })
    );

    // Add to history
    const newRecord: DrawHistoryRecord = {
      id: `${Date.now()}-${Math.random()}`,
      mode: activeMode,
      numbers: pickedNumbers,
      names: winnerNames,
      timestamp: timeStr,
    };
    setHistory((prev) => [newRecord, ...prev]);
  };

  // Reset all picked status
  const handleResetPicked = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        isPicked: false,
        pickedOrder: undefined,
      }))
    );
  };

  // Toggle picked on single student
  const handleToggleStudentPicked = (id: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPicked: !s.isPicked } : s))
    );
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const remainingCount = students.filter(
    (s) => !s.isExcluded && (!settings.preventDuplicates || !s.isPicked)
  ).length;

  const totalActive = students.filter((s) => !s.isExcluded).length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Universal Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-sky-500/20">
            24
          </div>
          <span className="text-lg font-black tracking-tight text-slate-100 whitespace-nowrap shrink-0">
            1~24번 번호 뽑기
          </span>
        </div>

        {/* Zone 2: 4-5 single-line nav tabs */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveMode('slot')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeMode === 'slot'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            슬롯머신
          </button>
          <button
            onClick={() => setActiveMode('wheel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeMode === 'wheel'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            회전 룰렛
          </button>
          <button
            onClick={() => setActiveMode('cards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeMode === 'cards'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            행운 카드
          </button>
          <button
            onClick={() => setActiveMode('lottery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeMode === 'lottery'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            로또 추첨볼
          </button>
          <button
            onClick={() => setActiveMode('groups')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeMode === 'groups'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            모둠 편성
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
          >
            <Users className="w-4 h-4" />
            <span>명단 / 결석 관리</span>
          </button>
        </div>
      </header>

      {/* Mobile nav bar for small screens */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-2 overflow-x-auto">
        {(['slot', 'wheel', 'cards', 'lottery', 'groups'] as PickerMode[]).map((m) => {
          const labels: Record<PickerMode, string> = {
            slot: '슬롯머신',
            wheel: '룰렛',
            cards: '카드',
            lottery: '로또',
            groups: '모둠',
          };
          return (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
                activeMode === m
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Control Utility Toolbar */}
      <section className="border-b border-slate-800/60 bg-slate-900/40 px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left: Quick options */}
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            {/* Pick count selector */}
            {activeMode === 'slot' && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <span className="text-slate-300 font-medium">추첨 인원:</span>
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setSettings((s) => ({ ...s, pickCount: cnt }))}
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors ${
                      settings.pickCount === cnt
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            )}

            {/* Duplicate toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.preventDuplicates}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, preventDuplicates: e.target.checked }))
                }
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className={settings.preventDuplicates ? 'text-sky-300 font-semibold' : 'text-slate-400'}>
                중복 추첨 방지
              </span>
            </label>

            {/* Show student names toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.showNames}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, showNames: e.target.checked }))
                }
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className={settings.showNames ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                학생 이름 표시
              </span>
            </label>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-3">
            {/* Sound toggle */}
            <button
              onClick={() =>
                setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))
              }
              title={settings.soundEnabled ? '음소거' : '소리 켜기'}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-sky-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* History drawer button */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>기록 ({history.length})</span>
            </button>

            {/* Reset round button */}
            {settings.preventDuplicates && (
              <button
                onClick={handleResetPicked}
                title="이번 라운드 당첨 기록 초기화"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>새 라운드</span>
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? '전체화면 종료' : '전자칠판/빔프로젝터 전체화면'}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col justify-between">
        <div>
          {activeMode === 'slot' && (
            <SlotPicker
              students={students}
              settings={settings}
              onPickWinners={handlePickWinners}
              onResetPicked={handleResetPicked}
            />
          )}

          {activeMode === 'wheel' && (
            <WheelPicker
              students={students}
              settings={settings}
              onPickWinners={handlePickWinners}
              onResetPicked={handleResetPicked}
            />
          )}

          {activeMode === 'cards' && (
            <CardPicker
              students={students}
              settings={settings}
              onPickWinners={handlePickWinners}
              onResetPicked={handleResetPicked}
            />
          )}

          {activeMode === 'lottery' && (
            <LotteryPicker
              students={students}
              settings={settings}
              onPickWinners={handlePickWinners}
              onResetPicked={handleResetPicked}
            />
          )}

          {activeMode === 'groups' && (
            <GroupMaker students={students} settings={settings} />
          )}
        </div>

        {/* Bottom 1~24 Status Grid */}
        <div className="mt-8">
          <NumberGridOverview
            students={students}
            showNames={settings.showNames}
            onToggleStudentPicked={handleToggleStudentPicked}
          />
        </div>
      </main>

      {/* Modals */}
      <StudentListModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={students}
        onUpdateStudents={setStudents}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
