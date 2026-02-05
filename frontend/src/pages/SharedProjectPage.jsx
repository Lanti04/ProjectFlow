// ========== SHARED PROJECT VIEWER ==========
// Guest view for shared projects (no auth required)
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, User, CheckCircle, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function SharedProjectViewer() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedProject = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          axios.get(`http://localhost:3001/api/projects/shared/${token}`),
          axios.get(`http://localhost:3001/api/projects/shared/${token}/tasks`)
        ]);
        setProject(projRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedProject();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-3xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-3xl text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-12">
      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-5xl font-black text-gray-800 mb-4">{project.title}</h1>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5" />
              <span>Shared by {project.owner_name}</span>
            </div>
            <span className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold">
              {project.progress}% Complete
            </span>
          </div>

          {project.description && (
            <p className="text-gray-600 text-lg mb-6">{project.description}</p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>

          {project.deadline && (
            <div className="flex items-center gap-2 text-gray-600 mt-6">
              <Calendar className="w-5 h-5" />
              <span>Deadline: {format(parseISO(project.deadline), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Tasks ({tasks.length})</h2>

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks in this project</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    task.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-bold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </p>
                    {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {format(parseISO(task.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 mt-12">
          View shared from <span className="font-bold">ProjectFlow</span>
        </p>
      </div>
    </div>
  );
}
