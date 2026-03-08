let audioCtx: AudioContext | null = null;

export const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playPop = (destination?: AudioNode) => {
  try {
    const ctx = destination ? (destination.context as AudioContext) : getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    if (destination) {
      gain.connect(destination);
    } else {
      gain.connect(ctx.destination);
    }
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("SFX Error:", e);
  }
};

export const playTick = (destination?: AudioNode) => {
  try {
    const ctx = destination ? (destination.context as AudioContext) : getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    if (destination) {
      gain.connect(destination);
    } else {
      gain.connect(ctx.destination);
    }
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.error("SFX Error:", e);
  }
};

export const playSuccess = (destination?: AudioNode) => {
  try {
    const ctx = destination ? (destination.context as AudioContext) : getAudioContext();
    const playNote = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      if (destination) {
        gain.connect(destination);
      } else {
        gain.connect(ctx.destination);
      }
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    };
    const now = ctx.currentTime;
    playNote(523.25, now); // C5
    playNote(659.25, now + 0.1); // E5
    playNote(783.99, now + 0.2); // G5
    playNote(1046.50, now + 0.3); // C6
  } catch (e) {
    console.error("SFX Error:", e);
  }
};
