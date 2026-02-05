// ========== SHARE PROJECT MODAL ==========
// Generate & copy shareable link; supports email sharing placeholder
import { useState } from 'react';
import { Copy, Mail, X } from 'lucide-react';
import axios from 'axios';

export default function ShareModal({ projectId, projectTitle, token, onClose }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:3001/api/projects/${projectId}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShareUrl(res.data.share_url);
    } catch (err) {
      alert('Failed to generate share link');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = `Check out my project: ${projectTitle}`;
    const body = `I'd like to share my ProjectFlow project with you!\n\n${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const revokeLink = async () => {
    try {
      await axios.delete(
        `http://localhost:3001/api/projects/${projectId}/share`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShareUrl('');
      alert('Share link revoked');
    } catch (err) {
      alert('Failed to revoke link');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Share Project</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">Share "{projectTitle}" with others</p>

        {!shareUrl ? (
          <button
            onClick={generateShareLink}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Share Link'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm font-mono text-gray-700 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-200 rounded transition"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {copied && <p className="text-xs text-green-600">✓ Copied to clipboard</p>}

            <button
              onClick={shareViaEmail}
              className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-3 rounded-lg font-semibold hover:bg-blue-200"
            >
              <Mail className="w-5 h-5" /> Share via Email
            </button>

            <button
              onClick={revokeLink}
              className="w-full text-red-600 py-2 rounded-lg font-semibold hover:bg-red-50"
            >
              Revoke Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
