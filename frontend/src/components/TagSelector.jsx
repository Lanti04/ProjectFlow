// ========== TAG SELECTOR COMPONENT ==========
// Reusable tag selector with color support
import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import axios from 'axios';

export default function TagSelector({ token, onTagsChange, initialTags = [] }) {
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [showCreateTag, setShowCreateTag] = useState(false);

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/tags', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTags(res.data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, [token]);

  // Notify parent of tag changes
  useEffect(() => {
    onTagsChange?.(selectedTags);
  }, [selectedTags]);

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await axios.post(
        'http://localhost:3001/api/tags',
        { name: newTagName, color: newTagColor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTags([...tags, res.data]);
      setSelectedTags([...selectedTags, res.data.id]);
      setNewTagName('');
      setShowCreateTag(false);
    } catch (err) {
      console.error('Failed to create tag:', err);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const difficultyTags = [
    { name: 'Easy', color: '#10b981' },
    { name: 'Medium', color: '#f59e0b' },
    { name: 'Hard', color: '#ef4444' }
  ];

  return (
    <div className="space-y-4">
      {/* Difficulty Quick Select */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Difficulty:</label>
        <div className="flex gap-2">
          {difficultyTags.map(difficulty => {
            const isSelected = selectedTags.includes(difficulty.name);
            return (
              <button
                key={difficulty.name}
                onClick={() => {
                  // Remove other difficulty tags first
                  const filtered = selectedTags.filter(tag => 
                    !difficultyTags.map(d => d.name).includes(tag)
                  );
                  // Toggle the selected difficulty
                  if (isSelected) {
                    setSelectedTags(filtered);
                  } else {
                    setSelectedTags([...filtered, difficulty.name]);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  isSelected
                    ? 'ring-2 ring-offset-1 scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: difficulty.color + '20',
                  color: difficulty.color,
                  borderColor: difficulty.color,
                  border: isSelected ? `2px solid ${difficulty.color}` : 'none'
                }}
              >
                {difficulty.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Tags */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Custom Tags:</label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                selectedTags.includes(tag.id)
                  ? 'ring-2 ring-offset-1'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: tag.color + '20',
                color: tag.color,
                borderColor: tag.color,
                border: selectedTags.includes(tag.id) ? `2px solid ${tag.color}` : 'none'
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
        
        {!showCreateTag ? (
          <button
            onClick={() => setShowCreateTag(true)}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
          >
            <Plus className="w-4 h-4" /> New Tag
          </button>
        ) : (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-10 h-8 border rounded"
            />
            <button onClick={createTag} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">
              Create
            </button>
            <button onClick={() => setShowCreateTag(false)} className="text-xs px-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
