// src/components/PomodoroTimer.jsx
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

export default function PomodoroTimer({ taskId, token, onComplete }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (isRunning && minutes === 0 && seconds === 0) {
      setIsRunning(false);
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
      new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-tone-1057.mp3').play();
      alert(isBreak ? 'Break over! Back to work!' : 'Pomodoro complete! Great job!');
      if (!isBreak && onComplete) onComplete(); // mark task done
      setIsBreak(!isBreak);
      setMinutes(isBreak ? 25 : 5); // switch to break or work
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds, isBreak, onComplete]);

  const formatTime = () => `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
      <h3 className="text-2xl font-bold mb-6">Pomodoro Timer</h3>
      <div className="text-8xl font-black mb-8 text-indigo-600">{formatTime()}</div>
      <p className="text-xl mb-6">{isBreak ? 'Take a break!' : 'Focus time!'}</p>
      <div className="flex justify-center gap-6">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-full hover:scale-110 transition shadow-xl"
        >
          {isRunning ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12" />}
        </button>
        <button
          onClick={() => {
            setIsRunning(false);
            setMinutes(isBreak ? 5 : 25);
            setSeconds(0);
          }}
          className="bg-gray-200 p-6 rounded-full hover:scale-110 transition shadow-xl"
        >
          <RotateCcw className="w-12 h-12" />
        </button>
      </div>
    </div>
  );
}