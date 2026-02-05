import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

export default function PomodoroTimer({ taskId, token, onComplete }) { 
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  const WORK_TIME = 25 * 60; // 25 minutes in seconds
  const BREAK_TIME = 5 * 60; // 5 minutes in seconds
  const totalSeconds = isBreak ? BREAK_TIME : WORK_TIME;
  const currentTotalSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - currentTotalSeconds) / totalSeconds) * 100;

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

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
      isBreak 
        ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 border-orange-200 shadow-lg' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-indigo-200 shadow-lg'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isBreak ? 'bg-orange-100' : 'bg-indigo-100'
          }`}>
            <Bell className={`w-5 h-5 ${
              isBreak ? 'text-orange-600' : 'text-indigo-600'
            }`} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Focus Timer</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
          isBreak 
            ? 'bg-orange-200 text-orange-800' 
            : 'bg-indigo-200 text-indigo-800'
        }`}>
          {isBreak ? '☕ Break' : '🎯 Work'}
        </span>
      </div>

      {/* Timer Display and Controls */}
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Circular Progress */}
        <div className="relative">
          <svg className="transform -rotate-90" width="140" height="140">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              className={isBreak ? 'text-orange-100' : 'text-indigo-100'}
            />
            {/* Progress circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                isBreak ? 'text-orange-500' : 'text-indigo-600'
              }`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-black tracking-tight ${
              isBreak ? 'text-orange-600' : 'text-indigo-600'
            }`}>
              {formatTime()}
            </div>
          </div>
        </div>

        {/* Motivational Text */}
        <p className={`text-center font-semibold text-sm ${
          isBreak 
            ? 'text-orange-700' 
            : 'text-indigo-700'
        }`}>
          {isBreak ? '✨ Recharge!' : '💪 Stay focused!'}
        </p>

        {/* Controls */}
        <div className="w-full space-y-3">
          {/* Primary Action Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-white ${
              isRunning
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                : isBreak
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={() => {
              setIsRunning(false);
              setMinutes(isBreak ? 5 : 25);
              setSeconds(0);
            }}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-sm"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}