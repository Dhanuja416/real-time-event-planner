import React, { useState } from 'react';
import axios from 'axios';

// Base URL must match your running .NET API port!
const API_URL = 'https://localhost:7072/api/Tasks';

const TaskForm = ({ onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    setError(null);

    // DTO object matches the CreateTaskDto on the .NET side
    const newTask = {
      title,
      description,
      // DueDate omitted for simplicity in form
    };

    try {
      // Send the POST request
      await axios.post(API_URL, newTask);
      
      // Clear form and trigger list refresh
      setTitle('');
      setDescription('');
      onTaskCreated(); 
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Check if the .NET API is running and CORS is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl mb-10 border border-indigo-700">
      <h3 className="text-2xl font-bold mb-4 text-indigo-300">Add New Task</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Task Title (e.g., Implement SignalR Client)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <textarea
          placeholder="Detailed Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 h-24 resize-none"
        />
        {error && <p className="text-red-400 font-medium">{error}</p>}
        <button 
          type="submit" 
          disabled={!title || loading}
          className={`w-full py-3 rounded-lg font-semibold transition duration-200 ${
            !title || loading 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/50'
          }`}
        >
          {loading ? 'Submitting...' : 'Create New Task'}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
