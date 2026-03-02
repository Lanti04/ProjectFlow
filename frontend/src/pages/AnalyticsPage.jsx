import axios from "axios";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Calendar,
  Activity,
} from "lucide-react";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

// Register components
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

export default function AnalyticsPage({ setToken }) {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState("week"); // week | month | all

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:3001/api/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAnalytics(res.data);
      } catch (err) {
        console.error("Analytics error:", err);
      }
    };

    fetchAnalytics();
  }, []);

  if (!analytics) {
    return (
      <div className="flex">
        <Navbar setToken={setToken} />
        <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p className="text-white text-lg">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const completionRate = Math.round(
    (analytics.completedTasks / Math.max(analytics.totalTasks, 1)) * 100
  );

  const remainingTasks =
    analytics.totalTasks - analytics.completedTasks - analytics.overdueTasks;

  /* ================= PIE CHART (TASK STATUS) ================= */
  const pieData = {
    labels: ["Completed", "Overdue", "In Progress"],
    datasets: [
      {
        data: [
          analytics.completedTasks,
          analytics.overdueTasks,
          remainingTasks,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(99, 102, 241, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(99, 102, 241, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: "600",
          },
          color: "#fff",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
      },
    },
  };

  /* ================= BAR CHART (DEADLINES) ================= */
  const barData = {
    labels: analytics.upcomingDeadlines.map((task) => {
      const title = task.title;
      return title.length > 15 ? title.substring(0, 15) + "..." : title;
    }),
    datasets: [
      {
        label: "Days Remaining",
        data: analytics.upcomingDeadlines.map((task) => {
          const today = new Date();
          const due = new Date(task.due_date);
          const diff = (due - today) / (1000 * 60 * 60 * 24);
          return Math.max(Math.ceil(diff), 0);
        }),
        backgroundColor: analytics.upcomingDeadlines.map((task) => {
          const today = new Date();
          const due = new Date(task.due_date);
          const diff = (due - today) / (1000 * 60 * 60 * 24);
          const daysLeft = Math.max(Math.ceil(diff), 0);

          if (daysLeft <= 1) return "rgba(239, 68, 68, 0.8)";
          if (daysLeft <= 3) return "rgba(251, 146, 60, 0.8)";
          return "rgba(99, 102, 241, 0.8)";
        }),
        borderColor: analytics.upcomingDeadlines.map((task) => {
          const today = new Date();
          const due = new Date(task.due_date);
          const diff = (due - today) / (1000 * 60 * 60 * 24);
          const daysLeft = Math.max(Math.ceil(diff), 0);

          if (daysLeft <= 1) return "rgba(239, 68, 68, 1)";
          if (daysLeft <= 3) return "rgba(251, 146, 60, 1)";
          return "rgba(99, 102, 241, 1)";
        }),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        callbacks: {
          title: (context) => {
            return analytics.upcomingDeadlines[context[0].dataIndex].title;
          },
          label: (context) => {
            const days = context.parsed.y;
            return `${days} ${days === 1 ? "day" : "days"} remaining`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#fff",
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      x: {
        ticks: {
          color: "#fff",
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  /* ================= STAT CARDS ================= */
  const StatCard = ({ icon: Icon, label, value, subtext, gradient, trend }) => (
    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:border-white/30 transition-all duration-300">
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`}
        style={{ filter: "blur(40px)" }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </div>
          )}
        </div>

        <h3 className="text-white/60 text-sm font-medium mb-1">{label}</h3>
        <p className="text-white text-3xl font-bold mb-1">{value}</p>
        {subtext && <p className="text-white/50 text-xs">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex">
      <Navbar setToken={setToken} />

      <main className="flex-1 ml-[270px] p-8 min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
        {/* ================= HEADER ================= */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-indigo-400" />
            <h1 className="text-4xl font-extrabold text-white">
              Analytics Dashboard
            </h1>
          </div>
          <p className="text-white/60 text-lg">
            Track your productivity and project insights
          </p>
        </div>

        {/* ================= TIME RANGE SELECTOR ================= */}
        <div className="mb-8 flex gap-3">
          {["week", "month", "all"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                timeRange === range
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* ================= STAT CARDS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Target}
            label="Total Tasks"
            value={analytics.totalTasks}
            subtext="All time"
            gradient="from-indigo-500 to-purple-600"
          />

          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={analytics.completedTasks}
            subtext={`${completionRate}% completion rate`}
            gradient="from-green-500 to-emerald-600"
            trend={completionRate >= 50 ? `${completionRate}%` : null}
          />

          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={analytics.overdueTasks}
            subtext="Need attention"
            gradient="from-red-500 to-rose-600"
          />

          <StatCard
            icon={Clock}
            label="In Progress"
            value={remainingTasks}
            subtext="Active tasks"
            gradient="from-cyan-500 to-blue-600"
          />
        </div>

        {/* ================= CHARTS GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* PIE CHART */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Task Distribution</h2>
            </div>

            <div className="h-[300px] flex items-center justify-center">
              <div className="w-full max-w-[280px]">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
            </div>

            <div className="h-[300px]">
              {analytics.upcomingDeadlines.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Calendar className="w-16 h-16 text-white/30 mb-3" />
                  <p className="text-white/60 text-lg font-medium">
                    No upcoming deadlines
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <Bar data={barData} options={barOptions} />
              )}
            </div>
          </div>
        </div>

        {/* ================= INSIGHTS SECTION ================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Quick Insights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Productivity Score</p>
              <p className="text-white text-2xl font-bold">{completionRate}%</p>
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Tasks Remaining</p>
              <p className="text-white text-2xl font-bold">{remainingTasks}</p>
              <p className="text-white/50 text-xs mt-2">
                {remainingTasks > 5
                  ? "Consider prioritizing"
                  : "Keep up the momentum!"}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Overdue Items</p>
              <p className="text-white text-2xl font-bold">
                {analytics.overdueTasks}
              </p>
              <p className="text-white/50 text-xs mt-2">
                {analytics.overdueTasks > 0
                  ? "Address these first"
                  : "All on track!"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}