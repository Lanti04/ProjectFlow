import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ArrowRight, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-8 pt-16 pb-20">
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-full">
              <p className="text-white font-bold text-sm">🚀 PREMIUM PLANS</p>
            </div>
          </div>
          
          <h1 className="text-6xl font-black text-gray-900 mb-6">
            Unlock AI Superpowers
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Choose the perfect plan to boost your productivity with advanced AI features. 
            All plans include secure payment with card, PayPal, Apple Pay, or Google Pay.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-20">
          {/* LITE PLAN */}
          <div className="bg-white rounded-3xl shadow-xl p-10 hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-purple-200 group">
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Lite</h2>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900">$0.99</span>
                <span className="text-gray-600 text-lg">/month</span>
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-4 mb-12">
              {[
                { text: 'Unlimited Grok chat', icon: '💬' },
                { text: 'Task summaries', icon: '📝' },
                { text: 'Exam countdowns', icon: '⏱️' },
                { text: 'Daily insights', icon: '💡' },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-4 text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade('lite')}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group/btn"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* PRO PLAN - Featured */}
          <div className="relative">
            {/* Badge */}
            <div className="absolute -top-5 right-8 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                <Zap className="w-4 h-4" />
                MOST POPULAR
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden hover:shadow-3xl transition-all duration-300 border-2 border-purple-400 group">
              {/* Background decoration */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-5xl font-black mb-2">Pro</h2>
                <p className="text-purple-100 mb-8">Everything you need to excel</p>
                <div className="flex items-baseline gap-2 mb-12">
                  <span className="text-6xl font-black">$1.99</span>
                  <span className="text-purple-100 text-lg">/month</span>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-12">
                  {[
                    { text: 'Everything in Lite', icon: '⭐' },
                    { text: 'Priority AI responses', icon: '⚡' },
                    { text: 'PDF & document export', icon: '📄' },
                    { text: 'Custom themes & UI', icon: '🎨' },
                    { text: 'Early access to features', icon: '🚀' },
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-4 text-white">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={loading}
                  className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group/btn transform group-hover:scale-105"
                >
                  <span>Upgrade Now</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-purple-100 text-sm mt-4">
                  Cancel anytime. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ / Info Section */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-12 border-2 border-gray-100">
          <h3 className="text-3xl font-black text-gray-900 mb-8 text-center">Why upgrade?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="font-bold text-gray-900 mb-2">Lightning Fast</h4>
              <p className="text-gray-600">Priority AI processing for instant responses</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <h4 className="font-bold text-gray-900 mb-2">Secure & Private</h4>
              <p className="text-gray-600">Enterprise-grade encryption for your data</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h4 className="font-bold text-gray-900 mb-2">Premium Support</h4>
              <p className="text-gray-600">Get help when you need it, 24/7</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-semibold hover:gap-3"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}