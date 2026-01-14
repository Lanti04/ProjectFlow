import { useState } from 'react';
import axios from 'axios';
import { Sparkles, RotateCw } from 'lucide-react';

export default function FlashcardGenerator({ taskTitle, taskDescription, token }) {
    // flashcards: array of { question, answer } objects
    const [flashcards, setFlashcards] = useState([]);
    // loading: whether the generation request is in progress
    const [loading, setLoading] = useState(false);
    // currentCard: index of the currently displayed card
    const [currentCard, setCurrentCard] = useState(0);
    // flipped: whether the current card is showing the answer
    const [flipped, setFlipped] = useState(false);

    // generateFlashcards: calls backend AI API to generate a JSON array of flashcards
    const generateFlashcards = async () => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/ai/chat', {
                message: `Generate 8 flashcards from this study task. Title: "${taskTitle}". Description: "${taskDescription}". Format as JSON array: [{"question": "...", "answer": "..."}, ...] Only return the JSON, no extra text.`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // The backend returns text containing a JSON array. Extract the first JSON array-like substring.
            const jsonMatch = res.data.reply.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                // Parse the extracted JSON and store as flashcards
                const cards = JSON.parse(jsonMatch[0]);
                setFlashcards(cards);
            } else {
                // If parsing fails, provide a tiny default example so the UI can render
                setFlashcards([{ question: "Example Q", answer: "Example A" }]);
            }
        } catch (err) {
            // On network/error, show a friendly fallback card
            setFlashcards([{ question: "Study hard!", answer: "You've got this!" }]);
        } finally {
            setLoading(false);
        }
    };

    // If there are no flashcards yet, show a single call-to-action button to generate them.
    if (flashcards.length === 0) {
        return (
            <button
                onClick={generateFlashcards}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-xl hover:scale-105 transition shadow-xl flex items-center gap-3"
            >
                <Sparkles className="w-6 h-6" />
                {loading ? 'Generating...' : 'Generate Flashcards'}
            </button>
        );
    }

    // current card object to render
    const card = flashcards[currentCard];

    return (
        <div className="space-y-6">
            {/* Header showing card index */}
            <div className="text-center">
                <p className="text-xl text-gray-600 mb-2">Card {currentCard + 1} / {flashcards.length}</p>
            </div>

            {/* Card area: click to flip between question and answer */}
            <div 
                onClick={() => setFlipped(!flipped)}
                className="bg-white rounded-3xl shadow-2xl p-12 min-h-80 flex items-center justify-center cursor-pointer hover:shadow-3xl transition"
            >
                <p className="text-4xl font-bold text-center">
                    {flipped ? card.answer : card.question}
                </p>
            </div>

            {/* Controls: previous, flip (reset flip state), next */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
                    className="bg-gray-200 px-6 py-3 rounded-2xl font-bold"
                    disabled={currentCard === 0}
                >
                    Previous
                </button>

                {/* The Flip button here resets flipped to false; user can also click the card itself */}
                <button
                    onClick={() => setFlipped(false)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
                >
                    <RotateCw className="w-5 h-5" /> Flip
                </button>

                <button
                    onClick={() => setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1))}
                    className="bg-gray-200 px-6 py-3 rounded-2xl font-bold"
                    disabled={currentCard === flashcards.length - 1}
                >
                    Next
                </button>
            </div>

            {/* Regenerate button: clears current cards so user can create a fresh set */}
            <button
                onClick={() => {
                    setFlashcards([]);
                    setCurrentCard(0);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-xl"
            >
                Generate New Flashcards
            </button>
        </div>
    );
}