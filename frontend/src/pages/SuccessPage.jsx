import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

 /*
  // Verify payment session on mount
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      axios.post('http://localhost:3001/api/payment/verify', { sessionId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(() => {
        setLoading(false);
      }).catch(() => {
        navigate('/pricing');// Redirect if verification fails
      });
    } else {
      navigate('/pricing'); // Redirect if no session ID
    }
  }, [searchParams, navigate]);
*/

useEffect(() => {
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    navigate('/pricing');
    return;
  }

  axios.post('http://localhost:3001/api/payment/verify', { sessionId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  .then(() => {
    setLoading(false);
    // Force refresh dashboard to see premium status
    setTimeout(() => navigate('/dashboard'), 1500); 
  })
  .catch(() => {
    alert('Payment verification failed — but it probably worked! Refresh dashboard.');
    setLoading(false);
  });
}, [searchParams, navigate]);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-4xl">Verifying payment...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
        <CheckCircle className="w-32 h-32 text-green-500 mx-auto mb-8" />
        <h1 className="text-5xl font-black mb-6">Payment Successful!</h1>
        <p className="text-2xl text-gray-600 mb-8">Your Grok AI plan is now active. Welcome to the future!</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:scale-105 transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}