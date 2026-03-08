import { useState, useEffect, useRef } from "react";
import { Quiz } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { X, Maximize2, RotateCcw } from "lucide-react";
import { playPCMAsync, stopPCM } from "../services/tts";
import { playPop, playTick, playSuccess } from "../services/sfx";
import { useTranslation } from "react-i18next";

interface PlayerProps {
  quiz: Quiz;
  onExit: () => void;
}

export function Player({ quiz, onExit }: PlayerProps) {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<
    "init" | "question" | "options" | "timer" | "reveal" | "end"
  >("init");
  const containerRef = useRef<HTMLDivElement>(null);

  const question = quiz.questions[currentQuestionIndex];

  useEffect(() => {
    if (!question) return;

    let isCancelled = false;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runSequence = async () => {
      setPhase("init");
      await sleep(500);
      if (isCancelled) return;

      setPhase("question");

      let audioPromise = Promise.resolve();
      if (question.audioBase64) {
        audioPromise = playPCMAsync(question.audioBase64);
      }

      // Wait 2 seconds for the user to read the question while audio starts
      await sleep(2000);
      if (isCancelled) return;

      setPhase("options");
      question.options.forEach((_, idx) => {
        setTimeout(() => {
          if (!isCancelled) playPop();
        }, idx * 150);
      });

      // Wait for options animation to finish
      await sleep(question.options.length * 150 + 500);
      if (isCancelled) return;

      // IMPORTANT: Wait for the audio to completely finish before starting the timer
      await audioPromise;
      if (isCancelled) return;

      // Small pause after audio finishes
      await sleep(500);
      if (isCancelled) return;

      setPhase("timer");
      const duration = quiz.timerDuration || 5;
      for (let i = 0; i < duration; i++) {
        if (isCancelled) return;
        playTick();
        await sleep(1000);
      }
      if (isCancelled) return;

      setPhase("reveal");
      playSuccess();
      await sleep(3000);
      if (isCancelled) return;

      setPhase("end");
      await sleep(500);
      if (isCancelled) return;

      if (currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setCurrentQuestionIndex(quiz.questions.length); // End state
      }
    };

    runSequence();

    return () => {
      isCancelled = true;
      stopPCM();
    };
  }, [currentQuestionIndex, question, quiz.questions.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (currentQuestionIndex >= quiz.questions.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-neutral-900 p-8 rounded-3xl text-center max-w-md w-full border border-neutral-800 shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{t("player.endTitle")}</h2>
          <p className="text-neutral-400 mb-8">
            {t("player.endText")}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setCurrentQuestionIndex(0)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-semibold transition-colors"
            >
              <RotateCcw size={20} /> {t("player.restart")}
            </button>
            <button
              onClick={onExit}
              className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors"
            >
              <X size={20} /> {t("player.exit")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blur effect */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl scale-110"
        style={{
          backgroundImage: `url(${question.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute top-6 right-6 z-50 flex gap-3">
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-neutral-800/80 hover:bg-neutral-700 backdrop-blur rounded-full text-white transition-colors shadow-lg"
        >
          <Maximize2 size={20} />
        </button>
        <button
          onClick={onExit}
          className="p-3 bg-neutral-800/80 hover:bg-neutral-700 backdrop-blur rounded-full text-white transition-colors shadow-lg"
        >
          <X size={20} />
        </button>
      </div>

      {/* 9:16 Video Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[420px] aspect-[9/16] bg-neutral-900 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10"
        style={{
          backgroundImage: `url(${question.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col p-8 z-10">

          {/* Progress Indicator */}
          <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white/90 font-mono text-sm font-bold shadow-lg">
            {currentQuestionIndex + 1} / {quiz.questions.length}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {/* Question Box */}
            <AnimatePresence>
              {(phase === "question" ||
                phase === "options" ||
                phase === "timer" ||
                phase === "reveal") && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white text-neutral-900 w-full rounded-3xl p-8 shadow-2xl mb-12 text-center relative"
                  >
                    <h2 className="text-2xl font-bold leading-snug">
                      {question.text}
                    </h2>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Options */}
            <div className="w-full space-y-4">
              <AnimatePresence>
                {(phase === "options" ||
                  phase === "timer" ||
                  phase === "reveal") &&
                  question.options.map((opt, idx) => {
                    const isReveal = phase === "reveal";
                    const isCorrect = idx === question.correctOptionIndex;

                    let bgColor = "bg-white/10 backdrop-blur-md";
                    let textColor = "text-white";
                    let borderColor = "border-white/20";

                    if (isReveal) {
                      if (isCorrect) {
                        bgColor = "bg-emerald-500";
                        borderColor = "border-emerald-400";
                        textColor = "text-white font-bold";
                      } else {
                        bgColor = "bg-black/60 backdrop-blur-md";
                        textColor = "text-white/40";
                        borderColor = "border-transparent";
                      }
                    }

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: idx * 0.15,
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        className={`w-full border rounded-2xl p-5 text-center text-xl transition-all duration-500 shadow-lg ${bgColor} ${textColor} ${borderColor}`}
                      >
                        {opt}
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="h-24 flex items-end pb-6">
            <AnimatePresence>
              {(phase === "timer" || phase === "reveal") && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="w-full"
                >
                  <div className="text-center text-white/90 text-sm mb-3 font-bold uppercase tracking-[0.2em] drop-shadow-md">
                    {phase === "timer" ? t("player.thinkTime") : t("player.correctAnswer")}
                  </div>
                  <div className="h-2.5 w-full bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: phase === "reveal" ? "0%" : "0%" }}
                      transition={{
                        duration: phase === "reveal" ? 0 : (quiz.timerDuration || 5),
                        ease: "linear",
                      }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
