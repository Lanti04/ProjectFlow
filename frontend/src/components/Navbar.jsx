import {
  Home,
  FolderPlus,
  PlusCircle,
  Sparkles,
  LogOut,
  Trash2,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ onOpenProjectModal, onOpenTaskModal, logout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItem = (label, icon, path, gradient) => {
    const active = location.pathname === path;
    return (
      <button
        onClick={() => navigate(path)}
        className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all overflow-hidden
          ${active ? 'text-white shadow-lg' : 'text-gray-300 hover:text-white'}
        `}
      >
        {/* Glow */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl transition ${
            gradient
          } ${active ? 'opacity-100' : ''}`}
        />

        {/* Surface */}
        <div
          className={`absolute inset-0 rounded-xl ${
            active ? gradient : 'bg-white/5 group-hover:bg-white/10'
          } transition`}
        />

        <div className="relative z-10 flex items-center gap-3">
          {icon}
          <span className="font-semibold tracking-wide">{label}</span>
        </div>

        {active && (
          <ChevronRight className="relative z-10 ml-auto w-4 h-4 text-white/80" />
        )}
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-[270px] bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950 text-white border-r border-white/10 shadow-[0_0_40px_rgba(99,102,241,0.4)] flex flex-col">
      {/* ===== Logo ===== */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">
              ProjectFlow
            </h1>
          </div>
        </div>
    

      {/* ===== Main Nav ===== */}
      <nav className="flex-1 px-4 py-5 space-y-3">
        {navItem(
          'Dashboard',
          <Home className="w-5 h-5" />,
          '/',
          'bg-gradient-to-r from-indigo-500 to-purple-600'
        )}

        {/* Primary CTA */}
        <button
          onClick={onOpenProjectModal}
          className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-white shadow-xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 blur-lg opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600" />
          <FolderPlus className="relative z-10 w-5 h-5" />
          <span className="relative z-10">New Project</span>
          <ChevronRight className="relative z-10 ml-auto w-4 h-4 text-white/80" />
        </button>

        {/* ✅ FIXED: Quick Task opens modal instead of navigating */}
        <button
          onClick={onOpenTaskModal}
          className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all overflow-hidden text-gray-300 hover:text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-0 group-hover:opacity-100 blur-xl transition" />
          <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 rounded-xl transition" />
          <PlusCircle className="relative z-10 w-5 h-5" />
          <span className="relative z-10 font-semibold tracking-wide">Quick Task</span>
        </button>

        {navItem(
          'Calendar',
          <Calendar className="w-5 h-5" />,
          '/calendar',
          'bg-gradient-to-r from-emerald-500 to-cyan-600'
        )}

        {/* ===== Upgrade Card ===== */}
        <div className="relative mt-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-white/10 p-4 shadow-inner backdrop-blur">
          <div className="flex items-center gap-2 mb-2 font-semibold text-pink-300">
            <Sparkles className="w-4 h-4" />
            AI Pro
          </div>
          <p className="text-xs text-white/70 mb-3">
            Unlock smart planning, insights & unlimited Grok chats.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-2.5 text-sm font-bold text-white shadow-lg hover:scale-[1.03] active:scale-[0.97] transition"
          >
            Upgrade Now
          </button>
        </div>
      </nav>

      {/* ===== Bottom Zone ===== */}
      <div className="px-4 py-4 space-y-2 border-t border-white/10">
        <button
          onClick={() => navigate('/trash')}
          className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-white transition overflow-hidden"
        >
          <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 blur-xl transition" />
          <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 rounded-xl transition" />
          <Trash2 className="relative z-10 w-5 h-5" />
          <span className="relative z-10 font-semibold">Trash</span>
        </button>

        <button
          onClick={logout}
          className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white transition overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 blur-xl transition" />
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition" />
          <LogOut className="relative z-10 w-5 h-5" />
          <span className="relative z-10 font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
}
