import React, { useState, useRef } from "react";
import { Quiz, Question } from "../types";
import {
  Plus,
  Trash2,
  Play,
  Image as ImageIcon,
  Volume2,
  Loader2,
  Sparkles,
  Download,
  Upload,
  Save,
  Mic,
  Timer
} from "lucide-react";
import { generateTTS } from "../services/tts";
import { generateQuizAI } from "../services/ai";
import { QuizRenderer } from "../services/renderer";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

interface EditorProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
  onPlay: () => void;
}

export function Editor({ quiz, setQuiz, onPlay }: EditorProps) {
  const { t, i18n } = useTranslation();
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableVoices = ["Kore", "Aoede", "Charon", "Fenrir", "Puck"];

  const updateQuestion = (index: number, updated: Question) => {
    const newQs = [...quiz.questions];
    newQs[index] = updated;
    setQuiz({ ...quiz, questions: newQs });
  };

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          id: Math.random().toString(36).substr(2, 9),
          text: t("app.newQuestion"),
          options: [t("app.variantA"), t("app.variantB"), t("app.variantC")],
          correctOptionIndex: 0,
          backgroundImage:
            "https://images.unsplash.com/photo-1505506874110-6a7a48e14c49?q=80&w=1000&auto=format&fit=crop",
        },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    const newQs = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: newQs });
  };

  const handleGenerateAudio = async (qIndex: number, q: Question) => {
    setGeneratingAudioId(q.id);
    const optionsLabel = i18n.language === 'en' ? 'Options' : i18n.language === 'ru' ? 'Варианты' : 'Variantlar';
    const textToRead = `${q.text} ${optionsLabel}: ${q.options.join(", ")}.`;
    const audioBase64 = await generateTTS(textToRead, selectedVoice);
    if (audioBase64) {
      updateQuestion(qIndex, { ...q, audioBase64 });
      toast.success(t("editor.audioReady"));
    } else {
      toast.error(t("editor.errorAudio"));
    }
    setGeneratingAudioId(null);
  };

  const handleAIGenerate = async () => {
    if (!aiTopic) return;
    setIsGeneratingAI(true);

    try {
      const newQuestions = await generateQuizAI(aiTopic, i18n.language);
      if (newQuestions && newQuestions.length > 0) {
        setQuiz({ title: aiTopic, questions: newQuestions });

        let updatedQuestions = [...newQuestions];
        for (let i = 0; i < updatedQuestions.length; i++) {
          const q = updatedQuestions[i];
          setGeneratingAudioId(q.id);
          const optionsLabel = i18n.language === 'en' ? 'Options' : i18n.language === 'ru' ? 'Варианты' : 'Variantlar';
          const textToRead = `${q.text} ${optionsLabel}: ${q.options.join(", ")}.`;
          const audioBase64 = await generateTTS(textToRead, selectedVoice);
          if (audioBase64) {
            updatedQuestions[i] = { ...updatedQuestions[i], audioBase64 };
            setQuiz({ title: aiTopic, questions: [...updatedQuestions] });
          }
        }
        setGeneratingAudioId(null);
        setAiTopic('');
        toast.success("AI Quiz muvaffaqiyatli yaratildi!");
      } else {
        toast.error(t("editor.errorAI"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("editor.errorGeneral"));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const renderer = new QuizRenderer(quiz);
      renderer.onProgress = (p) => setExportProgress(p);
      renderer.onComplete = (url, extension) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${quiz.title || 'quiz'}.${extension}`;
        a.click();
        setIsExporting(false);
        toast.success("Video tayyor!");
      };
      await renderer.start();
    } catch (err) {
      console.error(err);
      toast.error(t("editor.errorVideo"));
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(quiz, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${quiz.title || 'quiz'}-data.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast.success("Quiz ma'lumotlari saqlandi!");
    } catch {
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi");
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.questions && Array.isArray(json.questions)) {
          setQuiz(json);
          toast.success("Quiz muvaffaqiyatli yuklandi!");
        } else {
          toast.error("Noto'g'ri fayl formati!");
        }
      } catch (err) {
        toast.error("Faylni o'qishda xatolik yuz berdi!");
      }
    };
    reader.readAsText(file);
    // xuddi shu faylni qayta yuklash uchun qiymatni tozalaymiz
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
          <Loader2 size={64} className="animate-spin text-emerald-500 mb-6" />
          <h2 className="text-3xl font-bold mb-4">{t("editor.preparing")}</h2>
          <p className="text-xl text-red-400 font-semibold max-w-lg mb-8 animate-pulse">
            {t("editor.videoPreparingText")}
          </p>
          <div className="w-full max-w-md bg-neutral-800 rounded-full h-4 overflow-hidden border border-neutral-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${exportProgress * 100}%` }}
            />
          </div>
          <p className="mt-4 font-mono text-lg">{Math.round(exportProgress * 100)}%</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 pr-32">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            {t("editor.title")}
          </h1>
          <p className="text-neutral-400 mt-2">
            {t("editor.subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap gap-3 justify-end">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 h-[42px]">
              <Mic size={16} className="text-emerald-500" />
              <span className="text-sm font-medium text-neutral-400">Ovoz:</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
              >
                {availableVoices.map(voice => (
                  <option key={voice} value={voice} className="bg-neutral-900 text-white">
                    {voice}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 h-[42px]">
              <Timer size={16} className="text-emerald-500" />
              <label htmlFor="timer-duration" className="text-sm font-medium text-neutral-400">{t("editor.timerDuration")}</label>
              <input
                id="timer-duration"
                type="number"
                min={1}
                max={30}
                value={quiz.timerDuration || 5}
                onChange={(e) => setQuiz({ ...quiz, timerDuration: parseInt(e.target.value) || 5 })}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none w-12 text-center"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end max-w-lg">

            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImportJSON}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting || isGeneratingAI}
              className="flex items-center gap-2 bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
            >
              <Upload size={18} />
              Yuklash
            </button>
            <button
              onClick={handleExportJSON}
              disabled={isExporting || isGeneratingAI}
              className="flex items-center gap-2 bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
            >
              <Save size={18} />
              Saqlash
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || isGeneratingAI}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold transition-colors shadow-lg relative overflow-hidden ml-2"
            >
              {isExporting ? (
                <>
                  <div className="absolute inset-0 bg-emerald-600/20" style={{ width: `${exportProgress * 100}%` }} />
                  <Loader2 size={20} className="animate-spin relative z-10" />
                  <span className="relative z-10">{t("editor.preparing")} {Math.round(exportProgress * 100)}%</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  {t("editor.download")}
                </>
              )}
            </button>
            <button
              onClick={onPlay}
              disabled={isExporting || isGeneratingAI}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Play size={20} fill="currentColor" />
              {t("editor.play")}
            </button>
          </div>
        </div>
      </div>

      {/* AI Generation Section */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-semibold text-indigo-100">{t("editor.aiTitle")}</h2>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder={t("editor.aiPlaceholder")}
            className="flex-1 bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 transition-all placeholder:text-indigo-200/30"
            onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
          />
          <button
            onClick={handleAIGenerate}
            disabled={isGeneratingAI || !aiTopic}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-900/20"
          >
            {isGeneratingAI ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {isGeneratingAI ? (generatingAudioId ? t("editor.aiGeneratingAudio") : t("editor.aiGeneratingQuestions")) : t("editor.aiGenerate")}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {quiz.questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl hover-glow transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-800 text-neutral-400 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  {qIndex + 1}
                </div>
                <h3 className="text-xl font-semibold">{t("editor.question")}</h3>
              </div>
              <button
                onClick={() => removeQuestion(qIndex)}
                className="text-neutral-500 hover:text-red-400 transition-colors p-2 hover:bg-red-400/10 rounded-lg"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  {t("editor.questionText")}
                </label>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, { ...q, text: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder={t("editor.questionPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-3">
                  {t("editor.optionsText")}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctOptionIndex === optIndex}
                          onChange={() =>
                            updateQuestion(qIndex, {
                              ...q,
                              correctOptionIndex: optIndex,
                            })
                          }
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[optIndex] = e.target.value;
                          updateQuestion(qIndex, { ...q, options: newOpts });
                        }}
                        className={`w-full bg-neutral-950 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-all ${q.correctOptionIndex === optIndex
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-neutral-800 focus:border-neutral-600"
                          }`}
                        placeholder={`${t("editor.optionPlaceholder")} ${optIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  {t("editor.bgImageText")}
                </label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                        size={18}
                      />
                      <input
                        type="text"
                        value={q.backgroundImage}
                        onChange={(e) =>
                          updateQuestion(qIndex, {
                            ...q,
                            backgroundImage: e.target.value,
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                    <label
                      title="Kompyuterdan rasm yuklash"
                      className="flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-4 rounded-xl cursor-pointer transition-colors border border-neutral-700 shrink-0"
                    >
                      <Upload size={18} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              updateQuestion(qIndex, { ...q, backgroundImage: base64 });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {q.backgroundImage && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                      <img
                        src={q.backgroundImage}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-neutral-800/50">
                <button
                  onClick={() => handleGenerateAudio(qIndex, q)}
                  disabled={generatingAudioId === q.id}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors bg-emerald-400/10 hover:bg-emerald-400/20 px-4 py-2 rounded-lg"
                >
                  {generatingAudioId === q.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Volume2 size={16} />
                  )}
                  {q.audioBase64 ? t("editor.audioUpdate") : t("editor.audioGenerate")}
                </button>
                {q.audioBase64 && (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t("editor.audioReady")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full py-6 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-900/50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={24} />
          {t("editor.addQuestion")}
        </button>
      </div>
    </div>
  );
}
