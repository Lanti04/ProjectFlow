import { useNavigate } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';

export default function PricingPage() { 
  const navigate = useNavigate(); 
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/payment/create-checkout-session', { 
        plan
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      });
      window.location.href = res.data.url; // Redirect to Stripe Checkout
    } catch (err) {
      alert('Upgrade failed — try again');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-7xl font-black mb-6">Unlock Grok AI Superpowers</h1>
          <p className="text-3xl text-gray-700">Pay securely with card, PayPal, Apple Pay, or Google Pay.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* LITE PLAN */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 hover:shadow-3xl transition-all hover:scale-105">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-4">Grok Lite</h2>
              <p className="text-8xl font-black">$0.99<span className="text-3xl font-normal text-gray-600">/month</span></p>
            </div>
            <ul className="space-y-6 mb-12">
              {['Unlimited Grok chat', 'Task summaries', 'Exam countdowns', 'Daily insights'].map((f, i) => (
                <li key={i} className="flex items-center gap-4 text-xl">
                  <Check className="w-8 h-8 text-green-500" /> 
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('lite')}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 rounded-2xl text-2xl font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Choose Lite'}
            </button>
          </div>

          {/* PRO PLAN */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-3xl p-12 text-white relative overflow-hidden hover:scale-105 transition-all">
            <div className="absolute top-0 right-0 bg-yellow-400 text-black px-8 py-3 rounded-bl-3xl font-bold text-xl">
              BEST VALUE
            </div>
            <div className="text-center mb-10 mt-8">
              <h2 className="text-5xl font-black mb-4">Grok Pro</h2>
              <p className="text-9xl font-black">$1.99<span className="text-4xl font-normal opacity-90">/month</span></p>
            </div>
            <ul className="space-y-6 mb-12">
              {['Everything in Lite', 'Priority Grok responses', 'PDF export', 'Custom themes', 'Future features first'].map((f, i) => (
                <li key={i} className="flex items-center gap-4 text-2xl">
                  <Sparkles className="w-10 h-10 text-yellow-300" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading}
              className="w-full bg-white text-indigo-600 py-6 rounded-2xl text-3xl font-black hover:scale-105 transition disabled:opacity-50 shadow-2xl"
            >
              {loading ? 'Processing...' : 'Go Pro Now'}
            </button>
          </div>
        </div>

        <div className="text-center mt-20">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-2xl text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}