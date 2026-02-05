// src/components/AIChatPanel.jsx — COLORFUL UI VERSION
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Lock } from 'lucide-react';
import axios from 'axios';

export default function AIChatPanel({ token, isPremium }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content:
        "Hey! I’m Grok — your AI copilot. Ask about tasks, progress, or motivation 🚀",
    },
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!isPremium) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Upgrade to Premium to unlock unlimited Grok chats ✨' },
      ]);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:3001/api/ai/chat',
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Hmm — something went wrong. Try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ---------------- Collapsed Button ---------------- */
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full p-5 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 shadow-[0_0_30px_rgba(99,102,241,0.7)] hover:scale-110 active:scale-95 transition-all"
      >
        <Sparkles className="w-7 h-7 text-white drop-shadow-lg" />
      </button>
    );
  }

  /* ---------------- Locked State ---------------- */
  if (!isPremium) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-[380px] rounded-[28px] bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 p-[2px] shadow-[0_0_40px_rgba(168,85,247,0.6)]">
        <div className="rounded-[26px] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 text-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 font-bold text-lg tracking-wide">
              <Sparkles className="w-6 h-6 text-pink-400" />
              GROK AI
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-white/10 p-5 mb-6">
            <div className="flex items-center gap-2 mb-2 font-semibold text-pink-300">
              <Lock className="w-5 h-5" /> Premium Mode
            </div>
            <p className="text-sm text-white/80">
              Unlimited chats, deep insights, and AI productivity boosts.
            </p>
          </div>

          <button
            onClick={() => (window.location.href = '/pricing')}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 font-bold text-white shadow-lg hover:scale-[1.04] active:scale-[0.97] transition"
          >
            Upgrade — $0.99/mo
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Main Chat Panel ---------------- */
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] rounded-[28px] bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 p-[2px] shadow-[0_0_40px_rgba(99,102,241,0.6)]">
      <div className="relative flex flex-col h-full rounded-[26px] overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
        {/* Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-500/30 blur-3xl rounded-full" />
        <div className="absolute top-32 -right-24 w-64 h-64 bg-indigo-500/30 blur-3xl rounded-full" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3 font-bold tracking-wide text-white">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            GROK AI
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 space-y-4 text-sm">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-md'
                    : 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-white/10 text-white rounded-bl-md backdrop-blur'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 text-white/60 animate-pulse backdrop-blur">
                Grok is thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="relative z-10 p-4 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border-t border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 rounded-xl bg-black/30 px-3 py-2 border border-white/10 focus-within:ring-2 focus-within:ring-pink-500 transition">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Grok anything..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg hover:scale-110 active:scale-95 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
