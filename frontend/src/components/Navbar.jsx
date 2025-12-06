import { Home, FolderPlus, PlusCircle, Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenProjectModal, onOpenTaskModal, logout }) {
  const navigate = useNavigate();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ProjectFlow
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
          </li>

          <li>
            <button
              onClick={onOpenProjectModal}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              <FolderPlus className="w-5 h-5" />
              <span className="font-medium">New Project</span>
            </button>
          </li>

          <li>
            <button
              onClick={onOpenTaskModal}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">Quick Task</span>
            </button>
          </li>

          <li className="mt-8">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Upgrade to AI Pro</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}