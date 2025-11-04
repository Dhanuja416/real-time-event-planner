import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import TaskForm from './TaskForm';
import { Trash2 } from 'lucide-react'; // Icon for delete

// Base URLs
const API_URL = 'https://localhost:7072/api/Tasks';
const HUB_URL = 'https://localhost:7072/taskhub';

// Create an Axios instance that includes the token for every request
const createApiClient = (token) => {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

const TaskList = ({ token, theme }) => { // 🎯 Receives theme
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = createApiClient(token); 

  // --- Core Data Fetch ---
  const fetchTasks = async () => {
    // ... (rest of the fetch logic remains the same)
    try {
      setLoading(true);
      const response = await apiClient.get(API_URL); 
      setTasks(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); // Sort by newest first
    } catch (err) {
      console.error('Error fetching tasks:', err.response || err);
      if (err.response && err.response.status === 401) {
          setError('Session expired. Please log in again.');
      } else {
          setError('Failed to fetch tasks. Ensure the .NET API is running!');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Logic: PUT (Toggle) ---
  const toggleTask = async (task) => {
    const updatedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      isComplete: !task.isComplete, 
      dueDate: task.dueDate || null,
    };

    try {
      await apiClient.put(`${API_URL}/${task.id}`, updatedTask);
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // --- CRUD Logic: DELETE ---
  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
        return; 
    }
    try {
      await apiClient.delete(`${API_URL}/${taskId}`);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // --- useEffect 1: Initial Data Load ---
  useEffect(() => {
    if (token) {
        fetchTasks();
    }
  }, [token]);

  // --- useEffect 2: SignalR Connection and Listener ---
  useEffect(() => {
    let connection = null;
    if (!token) return;

    const startSignalR = async () => {
      try {
        connection = new signalR.HubConnectionBuilder()
          .withUrl(HUB_URL, { accessTokenFactory: () => token })
          .withAutomaticReconnect()
          .build();

        connection.on('TaskReceived', (task, action) => {
          console.log(`SignalR: Received ${action} for Task ${task.id}. Auto-fetching new data.`);
          fetchTasks(); 
        });

        await connection.start();
        console.log('SignalR Connected.');

      } catch (err) {
        console.error('SignalR Connection Error:', err);
      }
    };

    startSignalR();

    return () => {
      if (connection) {
        connection.stop();
        console.log('SignalR Disconnected.');
      }
    };
  }, [token]);

  // --- Rendering Logic ---
  
  if (loading) return <p className="text-gray-700 dark:text-gray-300 p-4">Loading tasks...</p>;
  if (error) return <p className="text-red-600 dark:text-red-400 p-4 font-semibold">{error}</p>;

  // Conditional classes based on the theme
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const headingColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className={`text-3xl font-bold mb-6 ${headingColor}`}>Dashboard</h1>
      
      {/* Task Form Component (Light/Dark Card) */}
      <div className={`p-6 rounded-xl shadow-xl mb-10 ${cardBg} border border-gray-200 dark:border-gray-700`}>
        <TaskForm onTaskCreated={fetchTasks} theme={theme} />
      </div>
      
      {/* Task List Display */}
      <h2 className={`text-2xl font-bold mb-6 ${headingColor} border-b border-gray-300 dark:border-gray-700 pb-2`}>
        Project Tasks ({tasks.length})
      </h2>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found. Create a new task above!</p>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center justify-between p-4 rounded-lg shadow-sm transition duration-300 ease-in-out 
                ${cardBg} border border-gray-200 dark:border-gray-700
              `}
            >
              {/* Task Details & Checkbox */}
              <div className="flex items-center space-x-3 w-full">
                {/* Checkbox (Toggle PUT) */}
                <input 
                  type="checkbox"
                  checked={task.isComplete}
                  onChange={() => toggleTask(task)} 
                  className={`w-5 h-5 rounded-md border-2 cursor-pointer 
                    ${task.isComplete ? 'text-emerald-500 border-emerald-500 focus:ring-emerald-500' : 'text-blue-500 border-gray-400 focus:ring-blue-500'}
                    ${inputBg}
                  `}
                />
                
                {/* Title and Description */}
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-semibold text-lg truncate 
                    ${task.isComplete ? 'text-emerald-600 dark:text-emerald-400 line-through' : headingColor}
                  `}>
                    {task.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate">{task.description}</p>
                </div>
              </div>
              
              {/* Status and Actions */}
              <div className="flex items-center space-x-4 ml-4">
                 {/* Status Badge */}
                <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap
                  ${task.isComplete ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}
                `}>
                  {task.isComplete ? 'Completed' : 'Pending'}
                </span>

                {/* Delete Button (DELETE) */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 transition duration-150"
                  aria-label={`Delete task ${task.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;