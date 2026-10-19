import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Play, Sparkles, RotateCcw } from 'lucide-react';
import { StudentItem, ClassSettings } from '../types';
import { playTickSound, playFanfareSound } from '../utils/soundEffects';

interface WheelPickerProps {
  students: StudentItem[];
  settings: ClassSettings;
  onPickWinners: (numbers: number[]) => void;
  onResetPicked: () => void;
}

// 12 distinct harmonious colors for slices
const SLICE_COLORS = [
  '#0284c7', // sky
  '#4f46e5', // indigo
  '#7c3aed', // violet
  '#c026d3', // fuchsia
  '#e11d48', // rose
  '#ea580c', // orange
  '#d97706', // amber
  '#16a34a', // green
  '#0d9488', // teal
  '#2563eb', // blue
  '#9333ea', // purple
  '#059669', // emerald
];

export const WheelPicker: React.FC<WheelPickerProps> = ({
  students,
  settings,
  onPickWinners,
  onResetPicked,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  // Available students
  const availableStudents = students.filter(
    (s) => !s.isExcluded && (!settings.preventDuplicates || !s.isPicked)
  );

  // Wheel state refs
  const currentAngleRef = useRef(0);
  const angularVelocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastSliceIndexRef = useRef<number>(-1);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;

    ctx.clearRect(0, 0, size, size);

    if (availableStudents.length === 0) {
      // Empty state
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('추첨할 번호가 없습니다', center, center);
      return;
    }

    const totalSlices = availableStudents.length;
    const sliceAngle = (Math.PI * 2) / totalSlices;

    // Draw Slices
    for (let i = 0; i < totalSlices; i++) {
      const student = availableStudents[i];
      const startA = angle + i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startA, endA);
      ctx.closePath();

      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text inside slice
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startA + sliceAngle / 2);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      if (totalSlices <= 12) {
        ctx.font = 'bold 24px Pretendard, sans-serif';
      } else if (totalSlices <= 24) {
        ctx.font = 'bold 18px Pretendard, sans-serif';
      } else {
        ctx.font = 'bold 14px Pretendard, sans-serif';
      }

      const text = settings.showNames && student.name ? `${student.id}. ${student.name}` : `${student.id}번`;
      ctx.fillText(text, radius - 20, 0);

      ctx.restore();
    }

    // Outer rim border
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(center, center, 12, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [availableStudents, settings.showNames]);

  const spinWheel = () => {
    if (isSpinning || availableStudents.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    // Initial random velocity between 0.35 and 0.55 rad/frame
    const initialVelocity = 0.38 + Math.random() * 0.22;
    angularVelocityRef.current = initialVelocity;

    const totalSlices = availableStudents.length;
    const sliceAngle = (Math.PI * 2) / totalSlices;

    // Pointer is fixed at TOP (angle = 3*Math.PI/2 or -Math.PI/2)
    const pointerAngle = (3 * Math.PI) / 2;

    const animate = () => {
      currentAngleRef.current = (currentAngleRef.current + angularVelocityRef.current) % (Math.PI * 2);

      // Calculate slice currently under pointer for tick sound
      // (pointerAngle - currentAngle) mod 2PI
      let relativeAngle = (pointerAngle - currentAngleRef.current) % (Math.PI * 2);
      if (relativeAngle < 0) relativeAngle += Math.PI * 2;
      const currentSliceIndex = Math.floor(relativeAngle / sliceAngle);

      if (currentSliceIndex !== lastSliceIndexRef.current) {
        lastSliceIndexRef.current = currentSliceIndex;
        if (settings.soundEnabled) {
          playTickSound(480 + (currentSliceIndex % 6) * 40, 0.02);
        }
      }

      drawWheel(currentAngleRef.current);

      // Decelerate with natural friction
      angularVelocityRef.current *= 0.985;

      if (angularVelocityRef.current > 0.002) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Stop spinning!
        setIsSpinning(false);
        angularVelocityRef.current = 0;

        // Final winner calculation
        let finalRelative = (pointerAngle - currentAngleRef.current) % (Math.PI * 2);
        if (finalRelative < 0) finalRelative += Math.PI * 2;
        const winIdx = Math.floor(finalRelative / sliceAngle) % totalSlices;
        const winningStudent = availableStudents[winIdx];

        if (winningStudent) {
          setWinner(winningStudent.id);
          if (settings.soundEnabled) {
            playFanfareSound();
          }
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          onPickWinners([winningStudent.id]);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const winningStudentObj = students.find((s) => s.id === winner);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4">
      <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-4">
        <span>룰렛 번호 수: <strong className="text-sky-400 font-mono">{availableStudents.length}</strong>개</span>
        <span aria-hidden="true">·</span>
        <span>화살표가 가리키는 번호가 당첨됩니다</span>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Top Pointer Needle */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-lg">
          <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-amber-400 filter drop-shadow-md" />
        </div>

        {/* Wheel Canvas */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-full shadow-2xl backdrop-blur-md">
          <canvas
            ref={canvasRef}
            width={440}
            height={440}
            className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[440px] md:h-[440px] rounded-full cursor-pointer transition-transform duration-200"
            onClick={spinWheel}
          />
        </div>

        {/* Winner Banner if picked */}
        {winner !== null && (
          <div className="mt-6 flex flex-col items-center bg-slate-800/90 border border-amber-400/40 rounded-2xl px-8 py-4 shadow-xl shadow-amber-500/10">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 룰렛 당첨자
            </span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-amber-300 font-mono">
                {winner}번
              </span>
              {settings.showNames && winningStudentObj?.name && (
                <span className="text-2xl font-bold text-slate-100">
                  {winningStudentObj.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spin Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={spinWheel}
            disabled={isSpinning || availableStudents.length === 0}
            className="px-10 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-lg md:text-xl rounded-2xl shadow-xl shadow-sky-500/25 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isSpinning ? '돌아가는 중...' : '룰렛 돌리기'}</span>
          </button>

          {settings.preventDuplicates && (
            <button
              onClick={onResetPicked}
              title="추첨 기록 초기화"
              className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
