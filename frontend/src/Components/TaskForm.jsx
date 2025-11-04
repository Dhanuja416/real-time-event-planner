import React, { useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

const API_URL = 'https://localhost:7072/api/Tasks';

const createApiClient = (token) => {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

const TaskForm = ({ onTaskCreated, theme }) => { // 🎯 Receives theme
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get the token from localStorage for this component's request
  const token = localStorage.getItem('jwtToken');
  const apiClient = createApiClient(token);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError(null);

    const newTask = {
      title,
      description,
      // DueDate omitted for brevity
    };

    try {
      await apiClient.post(API_URL, newTask);
      
      setTitle('');
      setDescription('');
      onTaskCreated(); 
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Authentication or API error.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150";
  const headerColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className={`text-xl font-semibold ${headerColor}`}>Quick Add Task</h3>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div className="flex space-x-3">
        <input
          type="text"
          placeholder="Task Title (required)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
          className={inputClasses}
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          className={`${inputClasses} flex-1 resize-none h-auto`}
        />
        
        <button type="submit" disabled={!title || loading}
          className="flex items-center justify-center py-3 px-6 rounded-lg bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/50 hover:bg-blue-700 transition duration-150 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Adding...' : <Plus size={20} />}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;