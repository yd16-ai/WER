// Web Audio API pure synthesizer sound effects for classroom lucky draw

let audioCtx: AudioContext | null = null;
let isSoundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isSoundMuted = muted;
}

export function isMuted(): boolean {
  return isSoundMuted;
}

export function playTickSound(frequency = 600, duration = 0.03) {
  if (isSoundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.debug('Audio tick suppressed', e);
  }
}

export function playPopSound() {
  if (isSoundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.debug('Audio pop suppressed', e);
  }
}

export function playFlipSound() {
  if (isSoundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.debug('Audio flip suppressed', e);
  }
}

let drumrollInterval: number | null = null;

export function startDrumroll() {
  if (isSoundMuted) return;
  stopDrumroll();
  try {
    let count = 0;
    drumrollInterval = window.setInterval(() => {
      count++;
      const pitch = 140 + Math.random() * 80 + Math.min(count * 2, 100);
      playTickSound(pitch, 0.04);
    }, 55);
  } catch (e) {
    console.debug('Drumroll error', e);
  }
}

export function stopDrumroll() {
  if (drumrollInterval !== null) {
    clearInterval(drumrollInterval);
    drumrollInterval = null;
  }
}

export function playFanfareSound() {
  if (isSoundMuted) return;
  stopDrumroll();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Harmonious victory chord progression: C4 -> E4 -> G4 -> C5
    const notes = [
      { freq: 261.63, start: 0, dur: 0.18 },
      { freq: 329.63, start: 0.12, dur: 0.18 },
      { freq: 392.00, start: 0.24, dur: 0.22 },
      { freq: 523.25, start: 0.38, dur: 0.55 },
      { freq: 659.25, start: 0.45, dur: 0.55 },
      { freq: 783.99, start: 0.50, dur: 0.65 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    });
  } catch (e) {
    console.debug('Fanfare suppressed', e);
  }
}
