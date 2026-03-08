import { Quiz, Question } from "../types";
import { playPCMAsync, stopPCM } from "./tts";
import { playPop, playTick, playSuccess } from "./sfx";

export class QuizRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  quiz: Quiz;
  stream: MediaStream;
  recorder: MediaRecorder;
  audioCtx: AudioContext;
  masterGain: GainNode;
  dest: MediaStreamAudioDestinationNode;
  worker: Worker;
  
  // State
  currentQuestionIndex = 0;
  phase = 'init';
  phaseStartTime = 0;
  isRecording = false;
  recordedChunks: Blob[] = [];
  isCancelled = false;
  extension = 'webm';
  
  // Assets
  bgImages: HTMLImageElement[] = [];
  cachedLines: { [key: number]: string[] } = {};
  silenceOscillator?: OscillatorNode;
  
  onProgress?: (progress: number) => void;
  onComplete?: (url: string, extension: string) => void;
  onError?: (err: any) => void;

  constructor(quiz: Quiz) {
    this.quiz = quiz;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1080;
    this.canvas.height = 1920;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.dest = this.audioCtx.createMediaStreamDestination();
    
    // Connect master gain to both the recording destination and the speakers
    this.masterGain.connect(this.dest);
    this.masterGain.connect(this.audioCtx.destination);
    
    // Keep audio stream active to prevent WebM encoder from dropping silent frames (fixes A/V desync)
    this.silenceOscillator = this.audioCtx.createOscillator();
    this.silenceOscillator.type = 'sine';
    this.silenceOscillator.frequency.value = 0; // Inaudible
    this.silenceOscillator.connect(this.dest);
    this.silenceOscillator.start();
    
    const blob = new Blob([`
      let intervalId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          intervalId = setInterval(() => self.postMessage('tick'), 1000 / 30);
        } else if (e.data === 'stop') {
          clearInterval(intervalId);
        }
      };
    `], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = () => {
      if (this.isRecording) this.drawFrame();
    };
    
    // @ts-ignore
    const canvasStream = this.canvas.captureStream(30); // 30 FPS for smoother video without overloading
    const tracks = [...canvasStream.getVideoTracks(), ...this.dest.stream.getAudioTracks()];
    this.stream = new MediaStream(tracks);
    
    let mimeType = 'video/webm; codecs=vp9';
    this.extension = 'webm';
    
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
      this.extension = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) {
      mimeType = 'video/webm; codecs=h264';
    }
    
    this.recorder = new MediaRecorder(this.stream, { 
      mimeType,
      videoBitsPerSecond: 8000000 // 8 Mbps for high quality
    });
    
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.recorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      if (this.onComplete) this.onComplete(url, this.extension);
    };
  }
  
  async loadImages() {
    for (const q of this.quiz.questions) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = q.backgroundImage;
      await new Promise(r => { img.onload = r; img.onerror = r; });
      this.bgImages.push(img);
    }
  }

  async start() {
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    await this.loadImages();
    
    this.isRecording = true;
    this.recorder.start();
    this.worker.postMessage('start');
    
    for (let i = 0; i < this.quiz.questions.length; i++) {
      if (this.isCancelled) break;
      this.currentQuestionIndex = i;
      await this.runQuestionSequence(this.quiz.questions[i]);
    }
    
    this.stop();
  }

  drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  }

  drawFrame() {
    if (!this.isRecording) return;
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Background
    const bgImg = this.bgImages[this.currentQuestionIndex];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      // Cover mode
      const scale = Math.max(w / bgImg.width, h / bgImg.height);
      const x = (w / 2) - (bgImg.width / 2) * scale;
      const y = (h / 2) - (bgImg.height / 2) * scale;
      this.ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
    } else {
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(0, 0, w, h);
    }
    
    // Dark overlay
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);

    const q = this.quiz.questions[this.currentQuestionIndex];
    if (!q) return;

    const now = performance.now();
    const phaseTime = now - this.phaseStartTime;

    // Progress
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.drawRoundedRect(60, 60, 180, 60, 30);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${this.currentQuestionIndex + 1} / ${this.quiz.questions.length}`, 150, 90);

    // Question Box
    if (this.phase !== 'init') {
      const boxY = 400;
      let boxScale = 1;
      let boxOpacity = 1;
      
      if (this.phase === 'question' && phaseTime < 500) {
        boxScale = 0.95 + (phaseTime / 500) * 0.05;
        boxOpacity = phaseTime / 500;
      }
      
      this.ctx.save();
      this.ctx.translate(w/2, boxY);
      this.ctx.scale(boxScale, boxScale);
      this.ctx.globalAlpha = boxOpacity;
      
      this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
      this.ctx.shadowBlur = 40;
      this.ctx.shadowOffsetY = 20;
      
      this.ctx.fillStyle = '#fff';
      this.drawRoundedRect(-420, -150, 840, 300, 40);
      this.ctx.fill();
      
      this.ctx.shadowColor = 'transparent';
      
      this.ctx.fillStyle = '#171717'; // neutral-900
      this.ctx.font = 'bold 50px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Measure and wrap text
      let lines = this.cachedLines[this.currentQuestionIndex];
      if (!lines) {
        const words = q.text.split(' ');
        lines = [];
        let line = '';
        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (this.ctx.measureText(testLine).width > 740 && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        this.cachedLines[this.currentQuestionIndex] = lines;
      }
      
      const lineHeight = 65;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((l, i) => {
        this.ctx.fillText(l, 0, startY + i * lineHeight);
      });
      
      this.ctx.restore();
    }

    // Options
    if (this.phase === 'options' || this.phase === 'timer' || this.phase === 'reveal') {
      const startY = 750;
      q.options.forEach((opt, idx) => {
        let optOpacity = 1;
        let optX = 0;
        
        if (this.phase === 'options') {
          const delay = idx * 150;
          if (phaseTime < delay) {
            optOpacity = 0;
          } else if (phaseTime < delay + 300) {
            const p = (phaseTime - delay) / 300;
            optOpacity = p;
            optX = -50 * (1 - p);
          }
        }
        
        if (optOpacity > 0) {
          this.ctx.save();
          this.ctx.globalAlpha = optOpacity;
          
          let bgColor = 'rgba(255,255,255,0.15)';
          let textColor = '#fff';
          let borderColor = 'rgba(255,255,255,0.2)';
          
          if (this.phase === 'reveal') {
            if (idx === q.correctOptionIndex) {
              bgColor = '#10b981'; // emerald-500
              borderColor = '#34d399'; // emerald-400
            } else {
              bgColor = 'rgba(0,0,0,0.6)';
              textColor = 'rgba(255,255,255,0.4)';
              borderColor = 'transparent';
            }
          }
          
          this.ctx.translate(w/2 + optX, startY + idx * 150);
          
          this.ctx.fillStyle = bgColor;
          this.drawRoundedRect(-420, 0, 840, 120, 30);
          this.ctx.fill();
          
          if (borderColor !== 'transparent') {
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
          }
          
          this.ctx.fillStyle = textColor;
          this.ctx.font = (this.phase === 'reveal' && idx === q.correctOptionIndex) ? 'bold 40px system-ui, -apple-system, sans-serif' : '40px system-ui, -apple-system, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(opt, 0, 60);
          
          this.ctx.restore();
        }
      });
    }

    // Timer
    if (this.phase === 'timer' || this.phase === 'reveal') {
      this.ctx.save();
      this.ctx.translate(w/2, 1650);
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
      this.ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.letterSpacing = '4px';
      this.ctx.fillText(this.phase === 'timer' ? "O'YLASH VAQTI..." : "TO'G'RI JAVOB", 0, -20);
      this.ctx.letterSpacing = '0px'; // reset
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.drawRoundedRect(-420, 10, 840, 24, 12);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      let progress = 0;
      if (this.phase === 'timer') {
        progress = 1 - Math.min(1, phaseTime / 5000);
      }
      
      if (progress > 0) {
        const gradient = this.ctx.createLinearGradient(-420, 0, 420, 0);
        gradient.addColorStop(0, '#fbbf24'); // amber-400
        gradient.addColorStop(1, '#f97316'); // orange-500
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.drawRoundedRect(-420, 10, 840 * progress, 24, 12);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }

  setPhase(p: string) {
    this.phase = p;
    this.phaseStartTime = performance.now();
  }

  async sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  async runQuestionSequence(q: Question) {
    if (this.isCancelled) return;
    
    this.setPhase('init');
    await this.sleep(500);
    if (this.isCancelled) return;

    this.setPhase('question');
    
    let audioPromise = Promise.resolve();
    if (q.audioBase64) {
      audioPromise = playPCMAsync(q.audioBase64, 24000, this.masterGain);
    }

    // Wait 2 seconds for the user to read the question while audio starts
    await this.sleep(2000);
    if (this.isCancelled) return;

    this.setPhase('options');
    for (let idx = 0; idx < q.options.length; idx++) {
      if (this.isCancelled) return;
      setTimeout(() => {
        if (!this.isCancelled) playPop(this.masterGain);
      }, idx * 150);
    }
    
    // Wait for options animation to finish
    await this.sleep(q.options.length * 150 + 500);
    if (this.isCancelled) return;

    // IMPORTANT: Wait for the audio to completely finish before starting the timer
    await audioPromise;
    if (this.isCancelled) return;

    // Small pause after audio finishes
    await this.sleep(500);
    if (this.isCancelled) return;

    this.setPhase('timer');
    for (let i = 0; i < 5; i++) {
      if (this.isCancelled) return;
      playTick(this.masterGain);
      await this.sleep(1000);
    }
    if (this.isCancelled) return;

    this.setPhase('reveal');
    playSuccess(this.masterGain);
    await this.sleep(3000);
    if (this.isCancelled) return;

    this.setPhase('end');
    await this.sleep(500);
    
    if (this.onProgress) {
      this.onProgress((this.currentQuestionIndex + 1) / this.quiz.questions.length);
    }
  }

  stop() {
    this.isRecording = false;
    this.isCancelled = true;
    this.worker.postMessage('stop');
    this.worker.terminate();
    stopPCM();
    if (this.silenceOscillator) {
      try { this.silenceOscillator.stop(); } catch(e) {}
    }
    if (this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    this.stream.getTracks().forEach(t => t.stop());
  }
}
