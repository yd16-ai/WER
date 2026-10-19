import React from 'react';
import { StudentItem } from '../types';
import { Check } from 'lucide-react';

interface NumberGridOverviewProps {
  students: StudentItem[];
  showNames: boolean;
  onToggleStudentPicked: (id: number) => void;
}

export const NumberGridOverview: React.FC<NumberGridOverviewProps> = ({
  students,
  showNames,
  onToggleStudentPicked,
}) => {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          1~24번 출석 및 추첨 현황판
        </h4>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700 inline-block" />
            <span>대기 중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/60 inline-block" />
            <span>당첨됨</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-950/40 border border-rose-900 inline-block" />
            <span>결석/제외</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {students.map((student) => {
          const isPicked = student.isPicked;
          const isExcluded = student.isExcluded;

          return (
            <button
              key={student.id}
              onClick={() => onToggleStudentPicked(student.id)}
              disabled={isExcluded}
              title={`${student.id}번 ${student.name ? `(${student.name})` : ''} - 클릭하여 당첨 상태 전환`}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                isExcluded
                  ? 'bg-rose-950/20 border-rose-900/40 text-slate-600 line-through cursor-not-allowed'
                  : isPicked
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:border-sky-500/60 hover:text-sky-300 active:scale-95'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>{student.id}</span>
                {isPicked && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
              </div>

              {showNames && student.name && (
                <span className="text-[10px] font-sans font-normal text-slate-400 truncate max-w-full mt-0.5">
                  {student.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
