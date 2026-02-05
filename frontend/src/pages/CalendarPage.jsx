import { useEffect, useState } from "react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, Circle } from "lucide-react";

export default function CalendarPage({ token, logout }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch all data
  const fetchData = async () => {
    if (!token) return logout();
    try {
      const res = await axios.get("http://localhost:3001/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.tasks || []);
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Toggle task completion
  const toggleTask = async (taskId) => {
    try {
      await axios.patch(
        `http://localhost:3001/api/tasks/${taskId}/toggle`,
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

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get tasks for a specific day
  const getTasksForDay = (day) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      return isSameDay(parseISO(task.due_date), day);
    });
  };

  // Get projects for a specific day (deadline)
  const getProjectsForDay = (day) => {
    return projects.filter((project) => {
      if (!project.deadline) return false;
      return isSameDay(parseISO(project.deadline), day);
    });
  };

  if (loading)
    return (
      <div className="ml-64 flex items-center justify-center min-h-screen text-6xl font-bold">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar logout={logout} />

      <div className="ml-64 p-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Calendar className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-6xl font-black text-gray-800">Calendar</h1>
          <a
            href={`http://localhost:3001/api/calendar.ics?token=${localStorage.getItem('token')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
          >
            Sync with Calendar
          </a>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-3 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-4xl font-bold text-gray-800">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-3 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-bold text-gray-600 py-3 text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const dayProjects = getProjectsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-32 p-2 rounded-lg cursor-pointer transition-all ${
                    isCurrentMonth
                      ? "bg-white border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg"
                      : "bg-gray-50 border-2 border-gray-100"
                  } ${
                    isToday
                      ? "border-indigo-600 border-2 shadow-lg"
                      : ""
                  } ${
                    selectedDate && isSameDay(day, selectedDate)
                      ? "ring-2 ring-indigo-500 ring-offset-2"
                      : ""
                  }`}
                >
                  {/* Day number */}
                  <div className={`text-sm font-bold mb-1 ${
                    isCurrentMonth ? "text-gray-800" : "text-gray-400"
                  } ${isToday ? "text-indigo-600" : ""}`}>
                    {format(day, "d")}
                  </div>

                  {/* Tasks and Projects for this day */}
                  <div className="space-y-1 text-xs overflow-hidden">
                    {/* Projects */}
                    {dayProjects.map((project) => (
                      <div
                        key={`p-${project.id}`}
                        className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold truncate"
                        title={project.title}
                      >
                        📁 {project.title}
                      </div>
                    ))}

                    {/* Tasks */}
                    {dayTasks.map((task) => (
                      <div
                        key={`t-${task.id}`}
                        className={`px-2 py-1 rounded truncate font-semibold ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700 line-through"
                            : "bg-blue-100 text-blue-700"
                        }`}
                        title={task.title}
                      >
                        ✓ {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-8">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>

            {/* Projects on this date */}
            {getProjectsForDay(selectedDate).length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-700 mb-4">Projects</h4>
                <div className="space-y-4">
                  {getProjectsForDay(selectedDate).map((project) => (
                    <div
                      key={project.id}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xl font-bold text-gray-800">
                          {project.title}
                        </h5>
                        <span className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          {project.progress}% Complete
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{project.description || "No description"}</p>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks on this date */}
            {getTasksForDay(selectedDate).length > 0 && (
              <div>
                <h4 className="text-xl font-bold text-gray-700 mb-4">Tasks</h4>
                <div className="space-y-3">
                  {getTasksForDay(selectedDate).map((task) => (
                    <div
                      key={task.id}
                      className={`rounded-xl p-4 border-2 transition-all ${
                        task.status === "completed"
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          {task.status === "completed" ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 hover:text-indigo-600" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h5 className={`font-bold ${
                            task.status === "completed"
                              ? "line-through text-gray-400"
                              : "text-gray-800"
                          }`}>
                            {task.title}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Project: {task.project_title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No items message */}
            {getTasksForDay(selectedDate).length === 0 &&
              getProjectsForDay(selectedDate).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-2xl text-gray-500">
                    No tasks or projects on this date
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
