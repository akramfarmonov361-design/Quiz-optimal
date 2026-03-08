import { useState } from "react";
import { Editor } from "./components/Editor";
import { Player } from "./components/Player";
import { Quiz } from "./types";

const defaultQuiz: Quiz = {
  title: "Tarix Testi",
  questions: [
    {
      id: "1",
      text: "Amir Temur davlatiga qaysi yilda asos solingan?",
      options: ["1360-yil", "1370-yil", "1380-yil"],
      correctOptionIndex: 1,
      backgroundImage:
        "https://images.unsplash.com/photo-1541359927273-d76820fc43f9?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "2",
      text: "Mirzo Ulug'bek Samarqandda qanday inshoot qurdirgan?",
      options: ["Registon madrasasi", "Rasadxona", "Bibixonim masjidi"],
      correctOptionIndex: 1,
      backgroundImage:
        "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "3",
      text: "'Tib qonunlari' asari muallifi kim?",
      options: ["Abu Rayhon Beruniy", "Al-Xorazmiy", "Ibn Sino"],
      correctOptionIndex: 2,
      backgroundImage:
        "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=1000&auto=format&fit=crop",
    },
  ],
};

export default function App() {
  const [quiz, setQuiz] = useState<Quiz>(defaultQuiz);
  const [mode, setMode] = useState<"editor" | "player">("editor");

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-emerald-500/30">
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
