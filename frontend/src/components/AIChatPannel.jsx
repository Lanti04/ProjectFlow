// src/components/AIChatPanel.jsx — REAL GROK
import { useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import axios from 'axios';

export default function AIChatPanel({ token, isPremium }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hey! I’m Grok, your AI assistant. Ask me about your tasks, progress, or motivation — I have access to your data!' }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false); 

  const sendMessage = async () => { 
    if (!input.trim()) return;
    if (!isPremium) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Upgrade to Premium for unlimited Grok chats!' }]);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3001/api/ai/chat', {
        message: input
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Grok is thinking deeply... Try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-full shadow-2xl hover:scale-110 transition-all z-50"
      >
        <Sparkles className="w-10 h-10" />
      </button>
    );
  }

  if (!isPremium) {
  return (
    <div className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8" /> Grok AI
        </h3>
        <div className="flex items-center gap-4">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">LOCKED</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <p className="mb-6">Unlock unlimited Grok-powered insights!</p>
      <button
        onClick={() => window.location.href = '/pricing'}
        className="w-full bg-white text-purple-600 py-4 rounded-2xl font-bold text-xl hover:scale-105 transition"
      >
        Upgrade for $0.99/mo
      </button>
    </div>
  );
}

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-3xl shadow-3xl flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8" /> Grok AI
        </h3>
        <button
        onClick={() => setIsOpen(false)}
        className="hover:bg-white/20 p-2 rounded-full transition"
      >
        <X className="w-6 h-6" />
      </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}> 
            <div className={`max-w-xs px-5 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start">
          <div className="max-w-xs px-5 py-3 rounded-2xl bg-gray-100 text-gray-500">Grok is thinking...</div>
        </div>}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Grok about your tasks..."
            className="flex-1 px-5 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl hover:scale-110 transition disabled:opacity-50"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}