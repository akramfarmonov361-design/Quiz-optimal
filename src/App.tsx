import { useState, useEffect } from "react";
import { Editor } from "./components/Editor";
import { Player } from "./components/Player";
import { Quiz } from "./types";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function App() {
  const { t, i18n } = useTranslation();

  const defaultQuiz: Quiz = {
    title: t("app.title"),
    questions: [
      {
        id: "1",
        text: t("app.question1"),
        options: ["1360-yil", "1370-yil", "1380-yil"],
        correctOptionIndex: 1,
        backgroundImage:
          "https://images.unsplash.com/photo-1541359927273-d76820fc43f9?q=80&w=1000&auto=format&fit=crop",
      },
      {
        id: "2",
        text: t("app.question2"),
        options: ["Registon madrasasi", "Rasadxona", "Bibixonim masjidi"],
        correctOptionIndex: 1,
        backgroundImage:
          "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?q=80&w=1000&auto=format&fit=crop",
      },
      {
        id: "3",
        text: t("app.question3"),
        options: ["Abu Rayhon Beruniy", "Al-Xorazmiy", "Ibn Sino"],
        correctOptionIndex: 2,
        backgroundImage:
          "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    timerDuration: 5,
  };

  const [quiz, setQuiz] = useState<Quiz>(defaultQuiz);
  const [mode, setMode] = useState<"editor" | "player">("editor");

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Update default quiz when language changes to reflect the new translation
  useEffect(() => {
    setQuiz((prev) => ({
      ...prev,
      title: prev.title === t("app.title", { lng: prev.title === "Tarix Testi" ? "uz" : "en" }) ? t("app.title") : prev.title
    }));
  }, [i18n.language, t]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-emerald-500/30 font-inter">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#262626',
            color: '#fff',
            border: '1px solid #404040'
          }
        }}
      />
      <div className="flex justify-end p-4 absolute top-0 right-0 z-50">
        <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-1 gap-1">
          <button
            onClick={() => changeLanguage("uz")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${i18n.language === 'uz' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            UZ
          </button>
          <button
            onClick={() => changeLanguage("ru")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${i18n.language === 'ru' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            RU
          </button>
          <button
            onClick={() => changeLanguage("en")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${i18n.language === 'en' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
          >
            EN
          </button>
        </div>
      </div>
      {mode === "editor" ? (
        <Editor
          quiz={quiz}
          setQuiz={setQuiz}
          onPlay={() => setMode("player")}
        />
      ) : (
        <Player quiz={quiz} onExit={() => setMode("editor")} />
      )}
    </div>
  );
}
