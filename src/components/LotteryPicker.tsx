import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Sparkles } from 'lucide-react';
import { StudentItem, ClassSettings } from '../types';
import { playPopSound, playFanfareSound } from '../utils/soundEffects';

interface LotteryPickerProps {
  students: StudentItem[];
  settings: ClassSettings;
  onPickWinners: (numbers: number[]) => void;
  onResetPicked: () => void;
}

interface BallPhysics {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const BALL_COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#8b5cf6', // purple
];

export const LotteryPicker: React.FC<LotteryPickerProps> = ({
  students,
  settings,
  onPickWinners,
  onResetPicked,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [extractedBall, setExtractedBall] = useState<number | null>(null);

  const availableStudents = students.filter(
    (s) => !s.isExcluded && (!settings.preventDuplicates || !s.isPicked)
  );

  const ballsRef = useRef<BallPhysics[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const speedMultiplierRef = useRef(1);

  // Initialize balls
  useEffect(() => {
    const balls: BallPhysics[] = availableStudents.map((s, idx) => {
      const angle = (idx / availableStudents.length) * Math.PI * 2;
      const r = 50 + Math.random() * 50;
      return {
        id: s.id,
        x: 160 + Math.cos(angle) * r,
        y: 160 + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 17,
        color: BALL_COLORS[s.id % BALL_COLORS.length],
      };
    });
    ballsRef.current = balls;
  }, [availableStudents.length]);

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const chamberRadius = 140;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Glass chamber background
      ctx.beginPath();
      ctx.arc(centerX, centerY, chamberRadius, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        centerX - 40,
        centerY - 40,
        20,
        centerX,
        centerY,
        chamberRadius
      );
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Glass rim
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Glass highlight
      ctx.beginPath();
      ctx.arc(centerX, centerY, chamberRadius - 6, -Math.PI * 0.7, -Math.PI * 0.2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Update and draw balls
      const mult = speedMultiplierRef.current;
      ballsRef.current.forEach((ball) => {
        ball.x += ball.vx * mult;
        ball.y += ball.vy * mult;

        // Keep inside chamber
        const dx = ball.x - centerX;
        const dy = ball.y - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist + ball.radius > chamberRadius) {
          // Normal reflection
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = ball.vx - 2 * dot * nx;
          ball.vy = ball.vy - 2 * dot * ny;

          // Re-clamp position
          ball.x = centerX + nx * (chamberRadius - ball.radius);
          ball.y = centerY + ny * (chamberRadius - ball.radius);
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();

        // 3D sphere gradient highlight
        const ballGrad = ctx.createRadialGradient(
          ball.x - 5,
          ball.y - 5,
          2,
          ball.x,
          ball.y,
          ball.radius
        );
        ballGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        ballGrad.addColorStop(0.5, 'transparent');
        ballGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = ballGrad;
        ctx.fill();

        // White circle on ball for number
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Number
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.id.toString(), ball.x, ball.y + 0.5);
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const drawBall = () => {
    if (isDrawing || availableStudents.length === 0) return;

    setIsDrawing(true);
    setExtractedBall(null);
    speedMultiplierRef.current = 4.5; // whirling fast

    let whirlTicks = 0;
    const whirlInterval = setInterval(() => {
      whirlTicks++;
      if (settings.soundEnabled && whirlTicks % 3 === 0) {
        playPopSound();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(whirlInterval);
      speedMultiplierRef.current = 1;

      // Select random winner
      const randomIdx = Math.floor(Math.random() * availableStudents.length);
      const winner = availableStudents[randomIdx];

      setExtractedBall(winner.id);
      setIsDrawing(false);

      if (settings.soundEnabled) {
        playFanfareSound();
      }

      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
      });

      onPickWinners([winner.id]);
    }, 1800);
  };

  const winnerObj = students.find((s) => s.id === extractedBall);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4">
      <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-4">
        <span>추첨 볼: <strong className="text-sky-400 font-mono">{availableStudents.length}</strong>개</span>
        <span aria-hidden="true">·</span>
        <span>에어 회오리 속에서 1개의 공이 추출됩니다</span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
        {/* Tumbler Globe */}
        <div className="relative p-2 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-2xl"
          />
        </div>

        {/* Extracted Ball Stage */}
        <div className="flex flex-col items-center justify-center min-w-[240px] bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-4">
            추출된 행운의 로또 볼
          </span>

          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
              extractedBall !== null
                ? 'bg-gradient-to-tr from-amber-500 to-amber-300 ring-8 ring-amber-400/20 scale-105'
                : 'bg-slate-800 border-2 border-dashed border-slate-700'
            }`}
          >
            {extractedBall !== null ? (
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner">
                <span className="text-3xl font-black text-slate-950 font-mono">
                  {extractedBall}
                </span>
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-500">대기 중</span>
            )}
          </div>

          <div className="mt-4 text-center">
            {extractedBall !== null ? (
              <div>
                <p className="text-xl font-black text-amber-300">{extractedBall}번 당첨!</p>
                {settings.showNames && winnerObj?.name && (
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{winnerObj.name}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">버튼을 눌러 공을 뽑으세요</p>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={drawBall}
          disabled={isDrawing || availableStudents.length === 0}
          className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-lg md:text-xl rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{isDrawing ? '로또 볼 회전 중...' : '로또 볼 뽑기'}</span>
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
  );
};
