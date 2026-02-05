// ========== FOCUS MODE 2.0 COMPONENT ==========
// Fullscreen focus session with timer, task logging, and streak celebration
import { useState, useEffect } from 'react';
import { Play, Square, X, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

export default function FocusMode2({ token, projectId, onClose, onStreakUpdate }) {
  const [sessionId, setSessionId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(25); // default pomodoro
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Auto-end session when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && sessionStarted) {
      completeSession();
    }
  }, [timeLeft, sessionStarted]);

  const startSession = async () => {
    try {
      const res = await axios.post(
        'http://localhost:3001/api/focus/start',
        { projectId, durationMinutes: duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionId(res.data.session_id);
      setIsRunning(true);
      setSessionStarted(true);
    } catch (err) {
      alert('Failed to start session');
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;
    setIsRunning(false);

    try {
      await axios.post(
        `http://localhost:3001/api/focus/${sessionId}/end`,
        { tasksCompleted },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Celebration
      confetti({ particleCount: 200, spread: 100 });
      onStreakUpdate?.();
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-center max-w-md text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black">Focus Mode</h1>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="text-8xl font-black mb-8 font-mono">
          {formatTime(timeLeft)}
        </div>

        {/* Duration Selector (before start) */}
        {!sessionStarted && (
          <div className="space-y-6 mb-8">
            <div className="flex justify-center gap-4">
              {[15, 25, 45, 60].map(min => (
                <button
                  key={min}
                  onClick={() => {
                    setDuration(min);
                    setTimeLeft(min * 60);
                  }}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    duration === min ? 'bg-white text-indigo-600' : 'bg-white/20'
                  }`}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tasks Counter */}
        <div className="bg-white/20 rounded-lg px-6 py-4 mb-8">
          <p className="text-sm opacity-90">Tasks Completed</p>
          <p className="text-5xl font-black">{tasksCompleted}</p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          {!sessionStarted ? (
            <button
              onClick={startSession}
              className="flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg"
            >
              <Play className="w-5 h-5" /> Start
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-4 rounded-xl font-bold"
              >
                {isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => {
                  setTasksCompleted(t => t + 1);
                }}
                className="flex items-center gap-2 bg-green-400 text-indigo-600 px-6 py-4 rounded-xl font-bold hover:bg-green-300"
              >
                <CheckCircle className="w-5 h-5" /> Task Done
              </button>
              <button
                onClick={completeSession}
                className="bg-red-400 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-300"
              >
                End Session
              </button>
            </>
          )}
        </div>

        <p className="text-sm opacity-75 mt-8">No distractions. Just focus. 🚀</p>
      </div>
    </div>
  );
}
