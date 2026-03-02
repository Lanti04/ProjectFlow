import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, isToday, parseISO, isPast, differenceInDays } from "date-fns";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import { 
  Trash2, 
  CheckCircle, 
  Circle, 
  Share2, 
  Focus, 
  Edit2, 
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  X,
  ChevronDown,
  MoreVertical,
  Filter,
  Play,
  Folder
} from "lucide-react";
import AIChatPanel from "../components/AIChatPannel";
import PomodoroTimer from "../components/PomodoroTimer";
import FlashcardGenerator from "../components/FlashcardGenerator";
import ShareModal from "../components/ShareModal";
import FocusMode2 from "../components/FocusMode2";

// ========== HELPERS ==========
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const getUserFirstName = (user) => {
  if (!user) return "";
  // Try name field first
  if (user.name) return user.name.split(" ")[0];
  // Fall back to email prefix: "lanti@gmail.com" → "Lanti"
  if (user.email) {
    const local = user.email.split("@")[0];
    const clean = local.replace(/[._\-0-9]+/g, " ").trim().split(" ")[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  return "";
};

// ========== DASHBOARD COMPONENT ==========
export default function Dashboard({ token, logout }) {
  // ========== STATE MANAGEMENT ==========
  const [data, setData] = useState({ projects: [], tasks: [] }); 
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [shareModal, setShareModal] = useState(null);
  const [focusMode2Active, setFocusMode2Active] = useState(false);
  const [selectedProjectForFocus, setSelectedProjectForFocus] = useState(null);
  const [focusSessionActive, setFocusSessionActive] = useState(false);
  const [focusSessionTask, setFocusSessionTask] = useState(null);
  
  // Filter states
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [taskFilter, setTaskFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectSort, setProjectSort] = useState("name");
  
  // UI states
  const [openMenuId, setOpenMenuId] = useState(null);
  const filterRef = useRef(null);

  // ========== MODAL STATES ==========
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ title: "", description: "", deadline: "" });
  const [taskForm, setTaskForm] = useState({
    title: "", due_date: "", project_id: "", difficulty: null, priority: "medium",
  });

  // ========== API CALLS ==========
  const fetchData = async () => {
    if (!token) return logout();
    try {
      const res = await axios.get("http://localhost:3001/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
      setIsPremium(res.data.user?.is_premium || false);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterPanel(false);
      }
      if (!e.target.closest('[data-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========== USER INTERACTIONS ==========
  const playSound = () => {
    const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const toggleTask = async (taskId) => {
    try {
      await axios.patch(`http://localhost:3001/api/tasks/${taskId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.65 } });
      playSound();
      await axios.post("http://localhost:3001/api/user/update-streak", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) { alert("Failed to update task"); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) { alert("Failed to delete task"); }
  };

  const deleteProject = async (projectId) => {
    if (!confirm("Delete project and all tasks?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) { alert("Failed to delete project"); }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description || "",
      deadline: project.deadline || "",
    });
    setShowProjectModal(true);
  };

  // ========== FORM HANDLERS ==========
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(`http://localhost:3001/api/projects/${editingProject.id}`, projectForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("http://localhost:3001/api/projects", projectForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({ title: "", description: "", deadline: "" });
      fetchData();
    } catch (err) { alert("Failed to save project"); }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/api/tasks", {
        project_id: taskForm.project_id,
        title: taskForm.title,
        due_date: taskForm.due_date || null,
        difficulty: taskForm.difficulty,
        priority: taskForm.priority,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowTaskModal(false);
      setTaskForm({ title: "", due_date: "", project_id: "", difficulty: null, priority: "medium" });
      fetchData();
    } catch (err) { alert("Failed to create task"); }
  };

  // ========== DERIVED DATA ==========
  const todayTasks = data.tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));

  const getFilteredTasks = () => {
    let filtered = todayTasks;
    switch (taskFilter) {
      case "pending": filtered = filtered.filter(t => t.status !== "completed"); break;
      case "completed": filtered = filtered.filter(t => t.status === "completed"); break;
      case "overdue": filtered = filtered.filter(t =>
        t.due_date && isPast(parseISO(t.due_date)) && t.status !== "completed"); break;
      default: break;
    }
    if (difficultyFilter !== "all") filtered = filtered.filter(t => t.difficulty === difficultyFilter);
    if (priorityFilter !== "all") filtered = filtered.filter(t => t.priority === priorityFilter);
    return filtered;
  };

  const getSortedProjects = () => {
    const sorted = [...data.projects];
    switch (projectSort) {
      case "progress": return sorted.sort((a, b) => b.progress - a.progress);
      case "deadline": return sorted.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
      default: return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
  };

  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter(t => t.status === "completed").length;
  const overdueTasks = data.tasks.filter(t =>
    t.due_date && isPast(parseISO(t.due_date)) && t.status !== "completed"
  ).length;

  const getTaskUrgency = (dueDate) => {
    if (!dueDate) return null;
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return "overdue";
    if (days === 0) return "today";
    if (days <= 3) return "urgent";
    return "normal";
  };

  const filteredTasks = getFilteredTasks();
  const sortedProjects = getSortedProjects();
  const hasActiveFilters = taskFilter !== 'all' || difficultyFilter !== 'all' || priorityFilter !== 'all';
  const userName = getUserFirstName(data.user);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-base text-gray-600 font-semibold">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50/40">
      <Navbar
        onOpenProjectModal={() => {
          setEditingProject(null);
          setProjectForm({ title: "", description: "", deadline: "" });
          setShowProjectModal(true);
        }}
        onOpenTaskModal={() => setShowTaskModal(true)}
        logout={logout}
      />

      <div className="ml-0 md:ml-[270px] p-5 md:p-8 max-w-[1400px]">

        {/* ========== HEADER ========== */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-1">
            {getGreeting()}{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="text-base text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {/* ========== 4 STAT CARDS ========== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

          {/* 1 — Streak */}
          <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Study Streak</span>
              <span className="text-3xl group-hover:scale-110 transition-transform">🔥</span>
            </div>
            <p className="text-4xl font-black mb-1">{data.user?.study_streak || 0}</p>
            <p className="text-xs opacity-75 font-medium">days in a row</p>
          </div>

          {/* 2 — Today's Tasks */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Today</span>
              <CalendarIcon className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-4xl font-black mb-1">{todayTasks.length}</p>
            <p className="text-xs opacity-75 font-medium">
              {todayTasks.filter(t => t.status !== "completed").length} remaining
            </p>
            {todayTasks.length > 0 && (
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-3">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${((todayTasks.length - todayTasks.filter(t => t.status !== "completed").length) / todayTasks.length) * 100}%`
                  }}
                />
              </div>
            )}
          </div>

          {/* 3 — Completed */}
          <div className="bg-gradient-to-br from-emerald-400 to-green-600 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Completed</span>
              <CheckCircle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-4xl font-black mb-1">
              {completedTasks}
              <span className="text-2xl opacity-60">/{totalTasks}</span>
            </p>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-3">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 4 — Overdue or Projects */}
          <div className={`rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] ${
            overdueTasks > 0
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
              : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                {overdueTasks > 0 ? 'Overdue' : 'Projects'}
              </span>
              {overdueTasks > 0
                ? <AlertCircle className="w-5 h-5 opacity-80 animate-pulse" />
                : <Folder className="w-5 h-5 opacity-80" />
              }
            </div>
            <p className="text-4xl font-black mb-1">
              {overdueTasks > 0 ? overdueTasks : data.projects.length}
            </p>
            <p className="text-xs opacity-75 font-medium">
              {overdueTasks > 0 ? 'need attention!' : 'active projects'}
            </p>
          </div>
        </div>

        {/* ========== TODAY'S TASKS ========== */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-0.5">Today's Mission</h2>
              <p className="text-sm text-gray-500">Focus on what matters most 🎯</p>
            </div>

            {/* Filter Button */}
            {todayTasks.length > 0 && (
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    hasActiveFilters
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  {hasActiveFilters && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/25 rounded text-xs font-black">
                      {[taskFilter, difficultyFilter, priorityFilter].filter(f => f !== 'all').length}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
                </button>

                {showFilterPanel && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-10">
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Status</label>
                      <div className="flex gap-1.5">
                        {['all', 'pending', 'completed', 'overdue'].map(status => (
                          <button key={status} onClick={() => setTaskFilter(status)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              taskFilter === status
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Difficulty</label>
                      <div className="flex gap-1.5">
                        {['all', 'easy', 'medium', 'hard'].map(diff => (
                          <button key={diff} onClick={() => setDifficultyFilter(diff)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              difficultyFilter === diff
                                ? diff === 'easy' ? 'bg-green-100 text-green-700 border border-green-200'
                                  : diff === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : diff === 'hard' ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Priority</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['all', 'low', 'medium', 'high', 'critical'].map(priority => (
                          <button key={priority} onClick={() => setPriorityFilter(priority)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              priorityFilter === priority
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setTaskFilter('all'); setDifficultyFilter('all'); setPriorityFilter('all'); }}
                        className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-14 text-center border-2 border-green-200">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-2xl font-black text-green-700 mb-2">
                {hasActiveFilters ? "No tasks match!" : "ALL DONE! 🎉"}
              </p>
              <p className="text-gray-500 text-base">
                {hasActiveFilters ? "Try adjusting your filters to see more tasks." : "You've conquered today's mission. Absolute legend!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const urgency = getTaskUrgency(task.due_date);
                const isMenuOpen = openMenuId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`group bg-white rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
                      task.status === "completed"
                        ? "border-gray-100 opacity-60"
                        : urgency === "overdue"
                        ? "border-red-200 bg-red-50/40"
                        : urgency === "urgent"
                        ? "border-orange-200 bg-orange-50/30"
                        : "border-gray-100 hover:border-indigo-200"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          {task.status === "completed" ? (
                            <CheckCircle className="w-6 h-6 text-indigo-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300 hover:text-indigo-500 transition-colors" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title + urgency badges */}
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className={`text-base font-bold flex-1 ${
                              task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"
                            }`}>
                              {task.title}
                            </h3>
                            {urgency === "overdue" && task.status !== "completed" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                <AlertCircle className="w-3 h-3" /> Overdue
                              </span>
                            )}
                            {urgency === "urgent" && task.status !== "completed" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">
                                <Clock className="w-3 h-3" /> Due soon
                              </span>
                            )}
                          </div>

                          {/* Tag pills */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold">
                              📁 {task.project_title}
                            </span>
                            {task.due_date && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                                <CalendarIcon className="w-3 h-3" />
                                {format(parseISO(task.due_date), 'MMM d')}
                              </span>
                            )}
                            {task.difficulty && (
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                task.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                task.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                              </span>
                            )}
                            {task.priority && task.priority !== 'medium' && (
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Three-dot menu */}
                        <div className="relative flex-shrink-0" data-menu>
                          <button
                            onClick={() => setOpenMenuId(isMenuOpen ? null : task.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                              <button
                                onClick={() => { setFocusSessionTask(task); setFocusSessionActive(true); setOpenMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-medium"
                              >
                                <Play className="w-4 h-4" /> Start focus session
                              </button>
                              <button
                                onClick={() => { setShareModal({ projectId: task.project_id, projectTitle: task.project_title }); setOpenMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                              >
                                <Share2 className="w-4 h-4" /> Share project
                              </button>
                              <button
                                onClick={() => { setSelectedProjectForFocus(task.project_id); setFocusMode2Active(true); setOpenMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                              >
                                <Focus className="w-4 h-4" /> Project focus
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => { deleteTask(task.id); setOpenMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========== PROJECTS ========== */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-0.5">Your Projects</h2>
              <p className="text-sm text-gray-500">Manage and track your work 📁</p>
            </div>

            {data.projects.length > 0 && (
              <select
                value={projectSort}
                onChange={(e) => setProjectSort(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="deadline">Sort by Deadline</option>
              </select>
            )}
          </div>

          {data.projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-xl font-bold text-gray-700 mb-2">No projects yet</p>
              <p className="text-gray-500 mb-6">Create your first project to get started!</p>
              <button
                onClick={() => { setEditingProject(null); setProjectForm({ title: "", description: "", deadline: "" }); setShowProjectModal(true); }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedProjects.map((p) => (
                <div
                  key={p.id}
                  className="group bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-black text-gray-900 flex-1 pr-2">{p.title}</h3>
                    <div className="relative flex-shrink-0" data-menu>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === `project-${p.id}` ? null : `project-${p.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === `project-${p.id}` && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                          <button onClick={() => { handleEditProject(p); setOpenMenuId(null); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium">
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <button onClick={() => { setShareModal({ projectId: p.id, projectTitle: p.title }); setOpenMenuId(null); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium">
                            <Share2 className="w-4 h-4" /> Share
                          </button>
                          <button onClick={() => { setSelectedProjectForFocus(p.id); setFocusMode2Active(true); setOpenMenuId(null); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium">
                            <Focus className="w-4 h-4" /> Focus
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button onClick={() => { deleteProject(p.id); setOpenMenuId(null); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">{p.description}</p>
                  )}

                  {p.deadline && (
                    <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-400 font-medium">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Due {format(parseISO(p.deadline), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-gray-800">{p.progress}%</span>
                    <span className="text-xs font-semibold text-gray-400">
                      {p.progress === 100 ? '🎉 Complete!' : 'In Progress'}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        p.progress === 100
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProject ? "Edit Project" : "New Project"}
              </h2>
              <button
                onClick={() => { setShowProjectModal(false); setEditingProject(null); setProjectForm({ title: "", description: "", deadline: "" }); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                <input placeholder="e.g. Website Redesign" value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea placeholder="What's this project about?" value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl h-20 focus:border-indigo-500 focus:outline-none transition resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deadline</label>
                <input type="date" value={projectForm.deadline}
                  onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition shadow-lg text-sm">
                  {editingProject ? "Update" : "Create"} Project
                </button>
                <button type="button"
                  onClick={() => { setShowProjectModal(false); setEditingProject(null); setProjectForm({ title: "", description: "", deadline: "" }); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quick Task</h2>
              <button onClick={() => setShowTaskModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                <input placeholder="What needs to be done?" value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project *</label>
                <select value={taskForm.project_id}
                  onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm"
                >
                  <option value="">Choose a project</option>
                  {data.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'critical'].map(priority => (
                    <button key={priority} type="button"
                      onClick={() => setTaskForm({ ...taskForm, priority })}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                        taskForm.priority === priority
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map(diff => (
                    <button key={diff} type="button"
                      onClick={() => setTaskForm({ ...taskForm, difficulty: taskForm.difficulty === diff ? null : diff })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                        taskForm.difficulty === diff
                          ? diff === 'easy' ? 'bg-green-100 text-green-700 border-green-300'
                            : diff === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                <input type="date" value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition shadow-lg text-sm">
                  Add Task
                </button>
                <button type="button" onClick={() => setShowTaskModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOCUS SESSION MODAL (Flashcards + Pomodoro) */}
      {focusSessionActive && focusSessionTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">Focus Session 🎯</h2>
                <p className="text-sm text-gray-500 mt-0.5">{focusSessionTask.title}</p>
              </div>
              <button
                onClick={() => { setFocusSessionActive(false); setFocusSessionTask(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <FlashcardGenerator
                  taskTitle={focusSessionTask.title}
                  taskDescription={focusSessionTask.description || "No description"}
                  token={token}
                />
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <PomodoroTimer
                  taskId={focusSessionTask.id}
                  token={token}
                  onComplete={() => {
                    toggleTask(focusSessionTask.id);
                    setFocusSessionActive(false);
                    setFocusSessionTask(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <AIChatPanel token={token} isPremium={isPremium} />

      {shareModal && (
        <ShareModal
          projectId={shareModal.projectId}
          projectTitle={shareModal.projectTitle}
          token={token}
          onClose={() => setShareModal(null)}
        />
      )}

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