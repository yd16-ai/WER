import React, { useState } from 'react';
import { Shuffle, Copy, Check, Users } from 'lucide-react';
import { StudentItem, ClassSettings } from '../types';
import { playFanfareSound, playFlipSound } from '../utils/soundEffects';

interface GroupMakerProps {
  students: StudentItem[];
  settings: ClassSettings;
}

interface GroupResult {
  groupNumber: number;
  members: StudentItem[];
}

export const GroupMaker: React.FC<GroupMakerProps> = ({ students, settings }) => {
  const [groupCount, setGroupCount] = useState<number>(4);
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Non-excluded students
  const activeStudents = students.filter((s) => !s.isExcluded);

  const makeGroups = (count = groupCount) => {
    if (activeStudents.length === 0) return;

    setIsShuffling(true);
    if (settings.soundEnabled) playFlipSound();

    setTimeout(() => {
      // Shuffle active students
      const shuffled = [...activeStudents].sort(() => Math.random() - 0.5);
      const newGroups: GroupResult[] = Array.from({ length: count }, (_, idx) => ({
        groupNumber: idx + 1,
        members: [],
      }));

      shuffled.forEach((student, index) => {
        newGroups[index % count].members.push(student);
      });

      // Sort members by ID inside each group
      newGroups.forEach((g) => {
        g.members.sort((a, b) => a.id - b.id);
      });

      setGroups(newGroups);
      setIsShuffling(false);
      if (settings.soundEnabled) playFanfareSound();
    }, 400);
  };

  const copyToClipboard = () => {
    if (groups.length === 0) return;
    const lines = groups.map((g) => {
      const memberList = g.members
        .map((m) => (settings.showNames && m.name ? `${m.id}번(${m.name})` : `${m.id}번`))
        .join(', ');
      return `[${g.groupNumber}조 - ${g.members.length}명]: ${memberList}`;
    });
    const text = `=== 1~24번 모둠 편성 결과 ===\n` + lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const groupColors = [
    'border-sky-500/40 bg-sky-950/20 text-sky-400',
    'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
    'border-amber-500/40 bg-amber-950/20 text-amber-400',
    'border-purple-500/40 bg-purple-950/20 text-purple-400',
    'border-rose-500/40 bg-rose-950/20 text-rose-400',
    'border-indigo-500/40 bg-indigo-950/20 text-indigo-400',
    'border-teal-500/40 bg-teal-950/20 text-teal-400',
    'border-fuchsia-500/40 bg-fuchsia-950/20 text-fuchsia-400',
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-6 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-semibold text-slate-200">모둠(조) 개수 선택:</span>
          <div className="flex items-center gap-1.5">
            {[2, 3, 4, 5, 6, 8].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setGroupCount(num);
                  makeGroups(num);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  groupCount === num
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {num}개 조
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => makeGroups()}
            disabled={isShuffling}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4" />
            {isShuffling ? '편성 중...' : '랜덤 모둠 편성'}
          </button>

          {groups.length > 0 && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사 완료!' : '결과 복사'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800/80 rounded-2xl w-full text-center">
          <Users className="w-12 h-12 text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-300 mb-1">모둠 편성을 시작해보세요</h4>
          <p className="text-xs text-slate-500 mb-4">
            현재 대상 인원: 총 {activeStudents.length}명
          </p>
          <button
            onClick={() => makeGroups()}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md"
          >
            모둠 자동 생성하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
          {groups.map((group, idx) => {
            const colorClass = groupColors[idx % groupColors.length];
            return (
              <div
                key={group.groupNumber}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <span className={`text-base font-black px-2.5 py-1 rounded-lg border ${colorClass}`}>
                      {group.groupNumber}모둠
                    </span>
                    <span className="text-xs text-slate-400">
                      총 <strong className="text-slate-200 font-mono">{group.members.length}</strong>명
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50"
                      >
                        <span className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-amber-300 font-mono shrink-0">
                          {member.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {settings.showNames && member.name ? member.name : `${member.id}번`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
