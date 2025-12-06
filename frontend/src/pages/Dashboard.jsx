// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { format, isToday, parseISO } from 'date-fns';
import confetti from 'canvas-confetti';

export default function Dashboard({ token, logout }) {
  const [data, setData] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const todayTasks = data.tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar
        onOpenProjectModal={() => setShowProjectModal(true)}
        onOpenTaskModal={() => setShowTaskModal(true)}
        logout={logout}
      />

      {/* Main content — offset by navbar width */}
      <div className="ml-64 p-8">
        <h1 className="text-5xl font-bold mb-4">Welcome back, Legend</h1>
        <p className="text-xl text-gray-600 mb-12">Here’s what you’re conquering today</p>

        {loading ? (
          <div className="text-3xl">Loading...</div>
        ) : (
          <>
            {/* Today Section */}
            <h2 className="text-3xl font-bold mb-6">Today</h2>
            {todayTasks.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-2xl p-20 text-center">
                <p className="text-7xl font-bold text-green-500 mb-4">All done!</p>
                <p className="text-3xl text-gray-600">Go touch grass</p>
              </div>
            ) : (
              <div className="space-y-6">
                {todayTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-3xl shadow-xl p-8 flex justify-between items-center hover:shadow-2xl transition">
                    <div>
                      <h3 className="text-2xl font-bold">{task.title}</h3>
                      <p className="text-gray-600">{task.project_title}</p>
                    </div>
                    <button
                      onClick={() => confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })}
                      className="w-16 h-16 rounded-full border-4 border-indigo-600 hover:bg-indigo-600 transition"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Projects Grid */}
            <h2 className="text-3xl font-bold mt-16 mb-8">Your Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.projects.map(p => (
                <div key={p.id} className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition">
                  <h3 className="text-2xl font-bold mb-2">{p.title}</h3>
                  <p className="text-gray-600 mb-6">{p.description}</p>
                  <div className="text-sm text-gray-500 mb-3">Progress: {p.progress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-6 rounded-full transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-96">
            <h2 className="text-2xl font-bold mb-6">New Project</h2>
            <input placeholder="Project Title" className="w-full p-3 border rounded-xl mb-4" />
            <textarea placeholder="Description (optional)" className="w-full p-3 border rounded-xl mb-4 h-24" />
            <div className="flex gap-3">
              <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl">Create</button>
              <button onClick={() => setShowProjectModal(false)} className="flex-1 bg-gray-200 py-3 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}