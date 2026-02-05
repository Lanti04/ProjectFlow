import { useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import Navbar from "../components/Navbar";
import { Trash2, RotateCcw, AlertCircle } from "lucide-react";

export default function TrashPage({ token, logout }) {
  const [trash, setTrash] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  // Fetch trash data
  const fetchTrash = async () => {
    if (!token) return logout();
    try {
      const res = await axios.get("http://localhost:3001/api/trash", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrash(res.data);
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [token]);

  // Restore task
  const restoreTask = async (taskId) => {
    try {
      await axios.post(
        `http://localhost:3001/api/tasks/${taskId}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTrash();
    } catch (err) {
      alert("Failed to restore task");
    }
  };

  // Restore project
  const restoreProject = async (projectId) => {
    try {
      await axios.post(
        `http://localhost:3001/api/projects/${projectId}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTrash();
    } catch (err) {
      alert("Failed to restore project");
    }
  };

  // Permanently delete task
  const permanentlyDeleteTask = async (taskId) => {
    if (!confirm("Permanently delete this task? This cannot be undone!")) return;
    try {
      await axios.delete(`http://localhost:3001/api/tasks/${taskId}/permanent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTrash();
    } catch (err) {
      alert("Failed to permanently delete task");
    }
  };

  // Permanently delete project
  const permanentlyDeleteProject = async (projectId) => {
    if (
      !confirm(
        "Permanently delete this project and all its tasks? This cannot be undone!"
      )
    )
      return;
    try {
      await axios.delete(
        `http://localhost:3001/api/projects/${projectId}/permanent`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTrash();
    } catch (err) {
      alert("Failed to permanently delete project");
    }
  };

  /* ---------------- Loading State ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
        <Navbar logout={logout} />
        <div className="ml-[270px] flex flex-col items-center justify-center min-h-screen text-white">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-pink-500 animate-spin mb-6" />
          <p className="text-lg tracking-wide text-white/70">Loading trash…</p>
        </div>
      </div>
    );
  }

  const hasItems = trash.projects.length > 0 || trash.tasks.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      <Navbar logout={logout} />

      <main className="ml-[270px] p-10 max-w-7xl mx-auto">
        {/* ---------------- Header ---------------- */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-red-500/40 rounded-xl" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                <Trash2 className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                Trash Bin
              </h1>
              <p className="text-sm text-white/60">
                Deleted items are permanently removed after 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* ---------------- Empty State ---------------- */}
        {!hasItems ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 shadow-xl p-16 text-center">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/30 blur-3xl rounded-full" />
            <div className="absolute top-24 -right-24 w-64 h-64 bg-cyan-500/30 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">All Clear 🎉</h2>
              <p className="text-white/70">
                Your trash bin is empty. Nothing to restore or delete.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* ---------------- Deleted Projects ---------------- */}
            {trash.projects.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold tracking-wide">
                    Deleted Projects
                  </h2>
                  <span className="text-sm text-white/50">
                    {trash.projects.length} item
                    {trash.projects.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {trash.projects.map((project) => (
                    <div
                      key={project.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg hover:shadow-xl transition"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition" />

                      <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">
                            {project.title}
                          </h3>
                          <p className="text-sm text-white/60 mb-2 line-clamp-2">
                            {project.description || "No description"}
                          </p>
                          <p className="text-xs text-white/40">
                            Deleted on{" "}
                            {format(parseISO(project.deleted_at), "PPP")}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreProject(project.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-semibold shadow hover:scale-[1.03] active:scale-[0.97] transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restore
                          </button>
                          <button
                            onClick={() =>
                              permanentlyDeleteProject(project.id)
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold shadow hover:scale-[1.03] active:scale-[0.97] transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ---------------- Deleted Tasks ---------------- */}
            {trash.tasks.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold tracking-wide">
                    Deleted Tasks
                  </h2>
                  <span className="text-sm text-white/50">
                    {trash.tasks.length} item
                    {trash.tasks.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {trash.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg hover:shadow-xl transition"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition" />

                      <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold mb-2">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {task.project_title || "Unknown Project"}
                            </span>
                          </div>
                          <p className="text-xs text-white/40">
                            Deleted on{" "}
                            {format(parseISO(task.deleted_at), "PPP")}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreTask(task.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-semibold shadow hover:scale-[1.03] active:scale-[0.97] transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restore
                          </button>
                          <button
                            onClick={() => permanentlyDeleteTask(task.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold shadow hover:scale-[1.03] active:scale-[0.97] transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
