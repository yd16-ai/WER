import React, { useState } from 'react';
import { X, UserCheck, UserX, RotateCcw, FileText, Check } from 'lucide-react';
import { StudentItem } from '../types';

interface StudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentItem[];
  onUpdateStudents: (updated: StudentItem[]) => void;
}

export const StudentListModal: React.FC<StudentListModalProps> = ({
  isOpen,
  onClose,
  students,
  onUpdateStudents,
}) => {
  const [bulkText, setBulkText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [localStudents, setLocalStudents] = useState<StudentItem[]>(students);

  if (!isOpen) return null;

  const handleNameChange = (id: number, name: string) => {
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  };

  const handleToggleExclude = (id: number) => {
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isExcluded: !s.isExcluded } : s))
    );
  };

  const handleBulkApply = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const updated = localStudents.map((s, index) => {
      const name = lines[index] ? lines[index] : '';
      return {
        ...s,
        name,
      };
    });

    setLocalStudents(updated);
    setIsBulkMode(false);
    setBulkText('');
  };

  const handleResetNames = () => {
    if (confirm('모든 학생 이름을 초기화하시겠습니까?')) {
      const resetList = localStudents.map((s) => ({
        ...s,
        name: '',
        isExcluded: false,
      }));
      setLocalStudents(resetList);
    }
  };

  const handleSaveAndClose = () => {
    onUpdateStudents(localStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-lg font-bold text-slate-100">학생 명단 및 결석 관리 (1~24번)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              각 번호에 학생 이름을 등록하거나 결석 학생을 추첨에서 제외할 수 있습니다.
            </p>
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
          {/* Quick Toolbar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <button
              onClick={() => setIsBulkMode(!isBulkMode)}
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {isBulkMode ? '개별 입력 목록 보기' : '명단 일괄 붙여넣기'}
            </button>

            <button
              onClick={handleResetNames}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              전체 초기화
            </button>
          </div>

          {isBulkMode ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                1번부터 순서대로 한 줄에 한 명씩 학생 이름을 입력하거나 복사하여 붙여넣으세요:
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="김민준&#10;이서아&#10;박도윤&#10;정하은..."
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsBulkMode(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkApply}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl"
                >
                  명단 일괄 적용하기
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {localStudents.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    student.isExcluded
                      ? 'bg-rose-950/20 border-rose-900/40 opacity-60'
                      : 'bg-slate-800/40 border-slate-700/60'
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-sky-400 font-mono border border-slate-700 shrink-0">
                    {student.id}
                  </span>

                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) => handleNameChange(student.id, e.target.value)}
                    placeholder={`${student.id}번 이름 입력`}
                    disabled={student.isExcluded}
                    className="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                  />

                  <button
                    onClick={() => handleToggleExclude(student.id)}
                    title={student.isExcluded ? '결석 해제 (추첨 포함)' : '결석 처리 (추첨 제외)'}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                      student.isExcluded
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {student.isExcluded ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <UserX className="w-3.5 h-3.5" /> 결석
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <UserCheck className="w-3.5 h-3.5" /> 출석
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400">
            출석 학생: <strong className="text-emerald-400">{localStudents.filter((s) => !s.isExcluded).length}</strong>명 / 결석: <strong className="text-rose-400">{localStudents.filter((s) => s.isExcluded).length}</strong>명
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleSaveAndClose}
              className="flex items-center gap-1.5 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md"
            >
              <Check className="w-4 h-4" />
              저장 및 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
