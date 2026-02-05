import { useEffect, useState } from "react";
import axios from "axios";
import { format, isToday, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import { Trash2, CheckCircle, Circle, Share2, Focus } from "lucide-react";
import AIChatPanel from "../components/AIChatPannel";
import PomodoroTimer from "../components/PomodoroTimer";
import FlashcardGenerator from "../components/FlashcardGenerator";
import TagSelector from "../components/TagSelector";
import ShareModal from "../components/ShareModal";
import FocusMode2 from "../components/FocusMode2";

// ========== DASHBOARD COMPONENT ==========
// Main page showing user's projects and tasks
// Handles all CRUD operations and real-time updates
export default function Dashboard({ token, logout }) {
  // ========== STATE MANAGEMENT ==========
  const [data, setData] = useState({ projects: [], tasks: [] }); 
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [shareModal, setShareModal] = useState(null); // { projectId, projectTitle }
  const [focusMode2Active, setFocusMode2Active] = useState(false);
  const [selectedProjectForFocus, setSelectedProjectForFocus] = useState(null);

  // ========== MODAL STATES ==========
  // Controls visibility and content of project/task creation forms
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    due_date: "",
    project_id: "",
    tags: [],
    difficulty: null, // easy, medium, hard
  });

  // ========== API CALLS & DATA FETCHING ==========
  const fetchData = async () => {
    if (!token) return logout();
    try {
      const res = await axios.get("http://localhost:3001/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
      // Update premium status from backend response (updated after payment)
      setIsPremium(res.data.user?.is_premium || false);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch data when token changes (user logs in)
  useEffect(() => {
    fetchData();
  }, [token]);

  // ========== USER INTERACTIONS & FEEDBACK ==========
  // Sound effect for task completion
  const playSound = () => {
    const audio = new Audio(
      "https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3"
    );
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  // Toggle task completion status with celebration effects
  const toggleTask = async (taskId) => {
    try {
      await axios.patch(
        `http://localhost:3001/api/tasks/${taskId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Celebrate task completion with confetti & sound
      confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
      playSound();

      await axios.post(
        "http://localhost:3001/api/user/update-streak",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchData();
    } catch (err) {
      alert("Failed to update task");
    }
  };

  // ========== PREMIUM STATUS TRACKING ==========
  // isPremium is now updated from fetchData() when data loads
  // No need to decode from JWT token anymore

  // Delete a task with confirmation
  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task forever?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  // Delete entire project (cascades to delete all associated tasks)
  const deleteProject = async (projectId) => {
    if (!confirm("Delete project and ALL its tasks?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      alert("Failed to delete project");
    }
  };

  // ========== FORM HANDLERS ==========
  // Handle both creating new and editing existing projects
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(
          `http://localhost:3001/api/projects/${editingProject.id}`,
          projectForm,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("http://localhost:3001/api/projects", projectForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({ title: "", description: "", deadline: "" });
      fetchData();
    } catch (err) {
      alert("Failed to save project");
    }
  };

  // Create new task and assign to selected project
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      // Build tag string including difficulty
      let tagString = '';
      if (taskForm.difficulty) {
        tagString = taskForm.difficulty.charAt(0).toUpperCase() + taskForm.difficulty.slice(1);
      }
      
      await axios.post(
        "http://localhost:3001/api/tasks",
        {
          project_id: taskForm.project_id,
          title: taskForm.title,
          due_date: taskForm.due_date || null,
          tag: tagString || null,
          difficulty: taskForm.difficulty, 
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowTaskModal(false);
      setTaskForm({ 
        title: "", 
        due_date: "", 
        project_id: "",
        tags: [],
        difficulty: null,
      });
      fetchData();
    } catch (err) {
      alert("Failed to create task");
    }
  };

  // ========== DERIVED DATA & CALCULATIONS ==========
  // Filter tasks due today for the "Today's Mission" section
  const todayTasks = data.tasks.filter(
    (t) => t.due_date && isToday(parseISO(t.due_date))
  );
  // Calculate completion statistics
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter(
    (t) => t.status === "completed"
  ).length;

  if (loading)
    return (
      <div className="ml-64 flex items-center justify-center min-h-screen text-6xl font-bold">
        Loading...
      </div>
    );

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navbar with quick action buttons */}
      <Navbar
        onOpenProjectModal={() => {
          setEditingProject(null);
          setProjectForm({ title: "", description: "", deadline: "" });
          setShowProjectModal(true);
        }}
        onOpenTaskModal={() => setShowTaskModal(true)}
        logout={logout}
      />

      <div className="ml-64 p-10">
        {/* ========== HEADER SECTION ========== */}
        <div className="mb-16">
          {/* Top Row: Welcome & Focus Mode */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-black text-gray-900 mb-2">Welcome back, Legend! 🎉</h1>
              <p className="text-xl text-gray-600">Let's make today productive</p>
            </div>
            
            {/* Focus Mode Toggle Button */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                focusMode
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
              title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {focusMode ? '🚀 Exit Focus' : '🎯 Focus Mode'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Streak Counter */}
            <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold opacity-90">Study Streak</span>
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-4xl font-black">{data.user?.study_streak || 0}</p>
              <p className="text-xs opacity-75 mt-2">Keep it going!</p>
            </div>

            {/* Today's Tasks */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold opacity-90">Today's Tasks</span>
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-4xl font-black">{todayTasks.length}</p>
              <p className="text-xs opacity-75 mt-2">Tasks to complete</p>
            </div>

            {/* Completed */}
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold opacity-90">Completed</span>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-4xl font-black">{completedTasks}/{totalTasks}</p>
              <p className="text-xs opacity-75 mt-2">
                {totalTasks > 0
                  ? `${Math.round((completedTasks / totalTasks) * 100)}% done`
                  : 'No tasks yet'}
              </p>
            </div>

            {/* Projects */}
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold opacity-90">Projects</span>
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-4xl font-black">{data.projects.length}</p>
              <p className="text-xs opacity-75 mt-2">Active projects</p>
            </div>
          </div>
        </div>

        {/* ========== TODAY'S TASKS SECTION ========== */}
        {/* High-priority: Tasks due TODAY with toggle & delete actions */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Today's Mission</h2>
            <p className="text-lg text-gray-600">Focus on what matters today 🎯</p>
          </div>
        </div>
        {/* All tasks completed state */}
        {todayTasks.length === 0 ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl p-20 text-center border-2 border-green-200">
            <div className="mb-6">
              <CheckCircle className="w-32 h-32 text-green-500 mx-auto" />
            </div>
            <p className="text-7xl font-black text-green-600 mb-4">ALL DONE!</p>
            <p className="text-3xl text-gray-700">You've completed all your tasks for today. Great work!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Task cards with completion toggle & delete */}
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  task.status === "completed" 
                    ? "border-green-200 bg-green-50/30" 
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                {/* Task Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="mt-1 flex-shrink-0 hover:scale-110 transition-transform duration-200"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="w-7 h-7 text-green-500" />
                        ) : (
                          <Circle className="w-7 h-7 text-gray-400 hover:text-indigo-600 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-xl font-bold mb-2 ${
                            task.status === "completed"
                              ? "line-through text-gray-400"
                              : "text-gray-800"
                          }`}
                        >
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {task.project_title}
                          </span>
                          {task.tag && (
                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              {task.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShareModal({ projectId: task.project_id, projectTitle: task.project_title })}
                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg"
                        title="Share project"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProjectForFocus(task.project_id);
                          setFocusMode2Active(true);
                        }}
                        className="text-purple-500 hover:text-purple-700 p-2 hover:bg-purple-50 rounded-lg"
                        title="Focus Mode"
                      >
                        <Focus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Section - Two Column Layout */}
                <div className="p-6 grid grid-cols-2 gap-6">
                  {/* Left Column: Flashcard Generator */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <FlashcardGenerator
                      taskTitle={task.title}
                      taskDescription={
                        task.description || "No description"
                      }
                      token={token}
                    />
                  </div>

                  {/* Right Column: POMODORO TIMER */}
                  <div>
                    <PomodoroTimer
                      taskId={task.id}
                      token={token}
                      onComplete={() => toggleTask(task.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== PROJECTS SECTION ========== */}
        {/*All projects in grid layout - hidden in focus mode */}
        {!focusMode && (
          <>
            <h2 className="text-4xl font-black text-gray-900 mb-10">Your Empire</h2>
            {/* Project cards with progress bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {data.projects.map((p, i) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl shadow-2xl p-12 hover:shadow-4xl hover:scale-105 transition-all duration-500 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-4xl font-black">{p.title}</h3>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setShareModal({ projectId: p.id, projectTitle: p.title })}
                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg"
                        title="Share project"
                      >
                        <Share2 className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProjectForFocus(p.id);
                          setFocusMode2Active(true);
                        }}
                        className="text-purple-500 hover:text-purple-700 p-2 hover:bg-purple-50 rounded-lg"
                        title="Focus Mode"
                      >
                        <Focus className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => deleteProject(p.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xl text-gray-600 mb-10">
                    {p.description || "No description"}
                  </p>
                  <div className="text-3xl font-bold text-gray-700 mb-6">
                    {p.progress}% Complete
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-14 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-14 rounded-full flex items-center justify-center text-white font-black text-3xl transition-all duration-1000 shadow-2xl"
                      style={{ width: `${p.progress}%` }}
                    >
                      {p.progress > 15 && `${p.progress}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ========== MODALS ========== */}
      {/* PROJECT CREATION/EDITING MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-12 w-full max-w-lg shadow-4xl">
            <h2 className="text-4xl font-bold mb-10">
              {editingProject ? "Edit" : "New"} Project
            </h2>
            {/* Form fields: title, description, deadline */}
            <form onSubmit={handleProjectSubmit}>
              <input
                placeholder="Title"
                value={projectForm.title}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, title: e.target.value })
                }
                required
                className="w-full p-5 border-2 rounded-2xl mb-6 text-xl"
              />
              <textarea
                placeholder="Description"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                className="w-full p-5 border-2 rounded-2xl mb-6 h-32 text-xl"
              />
              <input
                type="date"
                value={projectForm.deadline}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, deadline: e.target.value })
                }
                className="w-full p-5 border-2 rounded-2xl mb-10 text-xl"
              />
              <div className="flex gap-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl text-2xl font-bold"
                >
                  {editingProject ? "Update" : "Create"} Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                    setProjectForm({
                      title: "",
                      description: "",
                      deadline: "",
                    });
                  }}
                  className="flex-1 bg-gray-200 py-5 rounded-2xl text-2xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK CREATION MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-12 w-full max-w-lg shadow-4xl">
            <h2 className="text-4xl font-bold mb-10">Quick Task</h2>
            {/* Form fields: title, project select, due date */}
            <form onSubmit={handleTaskSubmit}>
              <input
                placeholder="Task title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                required
                className="w-full p-5 border-2 rounded-2xl mb-6 text-xl"
              />
              <select
                value={taskForm.project_id}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, project_id: e.target.value })
                }
                required
                className="w-full p-5 border-2 rounded-2xl mb-6 text-xl"
              >
                <option value="">Choose project</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-600 block mb-2">Difficulty:</label>
                <div className="flex gap-2 mb-4">
                  {['easy', 'medium', 'hard'].map(diff => {
                    const colors = {
                      easy: '#10b981',
                      medium: '#f59e0b',
                      hard: '#ef4444'
                    };
                    const isSelected = taskForm.difficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setTaskForm({ 
                          ...taskForm, 
                          difficulty: isSelected ? null : diff 
                        })}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          isSelected
                            ? 'ring-2 ring-offset-1 scale-105'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: colors[diff] + '20',
                          color: colors[diff],
                          borderColor: colors[diff],
                          border: isSelected ? `2px solid ${colors[diff]}` : 'none'
                        }}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, due_date: e.target.value })
                }
                className="w-full p-5 border-2 rounded-2xl mb-10 text-xl"
              />
              <div className="flex gap-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-5 rounded-2xl text-2xl font-bold"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 bg-gray-200 py-5 rounded-2xl text-2xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI CHAT PANEL */}
      <AIChatPanel token={token} isPremium={isPremium} />

      {/* ========== SHARE MODAL ========== */}
      {shareModal && (
        <ShareModal
          projectId={shareModal.projectId}
          projectTitle={shareModal.projectTitle}
          token={token}
          onClose={() => setShareModal(null)}
        />
      )}

      {/* ========== FOCUS MODE 2.0 ========== */}
      {focusMode2Active && (
        <FocusMode2
          token={token}
          projectId={selectedProjectForFocus}
          onClose={() => setFocusMode2Active(false)}
          onStreakUpdate={fetchData}
        />
      )}
    </div>
  );
}
