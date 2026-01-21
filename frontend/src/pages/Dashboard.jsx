import { useEffect, useState } from "react";
import axios from "axios";
import { format, isToday, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import { Trash2, CheckCircle, Circle } from "lucide-react";
import AIChatPanel from "../components/AIChatPannel";
import PomodoroTimer from "../components/PomodoroTimer";
import FlashcardGenerator from "../components/FlashcardGenerator";

// ========== DASHBOARD COMPONENT ==========
// Main page showing user's projects and tasks
// Handles all CRUD operations and real-time updates
export default function Dashboard({ token, logout }) {
  // ========== STATE MANAGEMENT ==========
  const [data, setData] = useState({ projects: [], tasks: [] }); 
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

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
      await axios.post(
        "http://localhost:3001/api/tasks",
        {
          project_id: taskForm.project_id,
          title: taskForm.title,
          due_date: taskForm.due_date || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowTaskModal(false);
      setTaskForm({ title: "", due_date: "", project_id: "" });
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
        <div className="flex justify-between items-start mb-16">
          {/* Left side — Welcome message */}
          <div>
            <h1 className="text-7xl font-black mb-4">Welcome back, Legend</h1>
            <p className="text-3xl text-gray-700">
              You have{" "}
              <span className="font-bold text-indigo-600">
                {todayTasks.length}
              </span>{" "}
              tasks today
            </p>
            <p className="text-3xl mt-4">
              Total:{" "}
              <span className="font-bold text-green-600">{completedTasks}</span>{" "}
              / {totalTasks} completed
            </p>
          </div>

          {/* Right side — Streak + Focus Mode (stacked vertically) */}
          <div className="flex flex-col items-end gap-8">
            {/* STREAK COUNTER */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-6 rounded-3xl shadow-2xl text-center">
              <p className="text-xl font-bold">Study Streak</p>
              <p className="text-6xl font-black">
                {data.user?.study_streak || 0} 🔥
              </p>
            </div>

            {/* FOCUS MODE BUTTON */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-xl font-bold hover:scale-105 transition shadow-2xl"
            >
              {focusMode ? "Exit" : "Enter"} Focus Mode
            </button>
          </div>
        </div>

        {/* ========== TODAY'S TASKS SECTION ========== */}
        {/* High-priority: Tasks due TODAY with toggle & delete actions */}
        <h2 className="text-5xl font-black mb-10">Today's Mission</h2>
        {/* All tasks completed state */}
        {todayTasks.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-40 text-center">
            <p className="text-9xl font-black text-green-600 mb-8">ALL DONE!</p>
            <p className="text-5xl text-gray-700">Go touch grass</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Task cards with completion toggle & delete */}
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl transition"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <button onClick={() => toggleTask(task.id)}>
                      {task.status === "completed" ? (
                        <CheckCircle className="w-14 h-14 text-green-500" />
                      ) : (
                        <Circle className="w-14 h-14 text-gray-400 hover:text-indigo-600 transition" />
                      )}
                    </button>
                    <div>
                      <h3
                        className={`text-3xl font-bold ${
                          task.status === "completed"
                            ? "line-through text-gray-400"
                            : ""
                        }`}
                      >
                        {task.title}

                        <div className="mt-8">
                          <FlashcardGenerator
                            taskTitle={task.title}
                            taskDescription={
                              task.description || "No description"
                            }
                            token={token}
                          />
                        </div>
                      </h3>
                      <p className="text-xl text-gray-600">
                        {task.project_title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-10 h-10" />
                  </button>
                </div>

                {/* POMODORO TIMER — APPEARS UNDER EVERY TASK */}
                <PomodoroTimer
                  taskId={task.id}
                  token={token}
                  onComplete={() => toggleTask(task.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ========== PROJECTS SECTION ========== */}
        {/*All projects in grid layout - hidden in focus mode */}
        {!focusMode && (
          <>
            <h2 className="text-5xl font-black mt-32 mb-16">Your Empire</h2>
            {/* Project cards with progress bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {data.projects.map((p, i) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl shadow-2xl p-12 hover:shadow-4xl hover:scale-105 transition-all duration-500 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-4xl font-black">{p.title}</h3>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-8 h-8" />
                    </button>
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
    </div>
  );
}
