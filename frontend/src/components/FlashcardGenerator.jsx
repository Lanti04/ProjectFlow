import { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function FlashcardGenerator({
  taskTitle,
  taskDescription,
  token,
}) {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const generateFlashcards = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/ai/chat",
        {
          message: `Generate 8 flashcards from this study task. Title: "${taskTitle}". Description: "${taskDescription}". Format as JSON array: [{"question": "...", "answer": "..."}, ...] Only return the JSON, no extra text.`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const jsonMatch = res.data.reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const cards = JSON.parse(jsonMatch[0]);
        setFlashcards(cards);
        setCurrentCard(0);
        setFlipped(false);
      } else {
        setFlashcards([{ question: "Example Q", answer: "Example A" }]);
      }
    } catch (err) {
      setFlashcards([{ question: "Study hard!", answer: "You've got this!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentCard(Math.max(0, currentCard - 1));
    setFlipped(false);
  };

  const handleNext = () => {
    setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1));
    setFlipped(false);
  };

  /* ================= EMPTY STATE ================= */
  if (flashcards.length === 0) {
    return (
      <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-indigo-600/10 border border-purple-200/40 p-5 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-sm" />
        <div className="relative space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-800">
            Generate AI study cards
          </p>
          <p className="text-xs text-gray-600">
            Turn this task into quick memory boosters
          </p>

          <button
            onClick={generateFlashcards}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:opacity-95 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          >
            <Zap className="w-5 h-5" />
            {loading ? (
              <div className="flex items-center gap-2">
                <span>Generating</span>
                <div className="animate-spin">✨</div>
              </div>
            ) : (
              "Generate Flashcards"
            )}
          </button>
        </div>
      </div>
    );
  }

  const card = flashcards[currentCard];

  return (
    <div className="w-full space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black text-gray-800">
            Flashcards
          </span>
        </div>

        <span className="text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 px-2.5 py-1 rounded-full shadow">
          {currentCard + 1} / {flashcards.length}
        </span>
      </div>

      {/* ================= PROGRESS BAR ================= */}
      <div className="relative w-full h-2 rounded-full bg-gray-200 overflow-hidden shadow-inner">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* ================= CARD ================= */}
      <div className="relative h-52 perspective">
        <div
          onClick={() => setFlipped(!flipped)}
          className="relative w-full h-full cursor-pointer transition-transform duration-500 transform-gpu"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front — Question */}
          <div
            className="absolute inset-0 rounded-2xl p-5 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/40 shadow-md hover:shadow-lg transition"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="mb-2 text-[10px] font-black tracking-widest uppercase text-indigo-600">
              Question
            </div>
            <p className="text-sm font-bold text-gray-800 text-center leading-snug">
              {card.question}
            </p>
            <div className="mt-4 text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              Tap to flip
            </div>
          </div>

          {/* Back — Answer */}
          <div
            className="absolute inset-0 rounded-2xl p-5 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-200/40 shadow-md hover:shadow-lg transition"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="mb-2 text-[10px] font-black tracking-widest uppercase text-emerald-600">
              Answer
            </div>
            <p className="text-sm font-bold text-gray-800 text-center leading-snug">
              {card.answer}
            </p>
            <div className="mt-4 text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              Tap to flip
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS ================= */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentCard === 0}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-gray-700 transition shadow-sm hover:shadow-md text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => setFlipped(!flipped)}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-95 transition shadow-md hover:shadow-lg transform hover:scale-[1.03] text-xs"
        >
          <RotateCw className="w-4 h-4" />
          Flip
        </button>

        <button
          onClick={handleNext}
          disabled={currentCard === flashcards.length - 1}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-gray-700 transition shadow-sm hover:shadow-md text-xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ================= REGENERATE ================= */}
      <button
        onClick={() => {
          setFlashcards([]);
          setCurrentCard(0);
          setFlipped(false);
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-semibold transition shadow-sm hover:shadow-md text-xs"
      >
        <RefreshCw className="w-4 h-4" />
        Regenerate
      </button>
    </div>
  );
}
