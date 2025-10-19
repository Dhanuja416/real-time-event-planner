import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import TaskForm from './TaskForm';

// Base URLs
const API_URL = 'https://localhost:7072/api/Tasks';
const HUB_URL = 'https://localhost:7072/taskhub';

// Create an Axios instance that includes the token for every request
const createApiClient = (token) => {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`, // Attach the JWT token
      'Content-Type': 'application/json'
    }
  });
};

const TaskList = ({ token }) => { // 🎯 Now receives the token as a prop
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = createApiClient(token); // Create an instance with the current token

  // --- Core Data Fetch ---
  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Use the authenticated apiClient instance
      const response = await apiClient.get(API_URL); 
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err.response || err);
      // Handle 401 specifically
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
      // Use the authenticated apiClient instance
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
      // Use the authenticated apiClient instance
      await apiClient.delete(`${API_URL}/${taskId}`);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // --- useEffect 1: Initial Data Load ---
  useEffect(() => {
    // Only fetch if a token exists
    if (token) {
        fetchTasks();
    }
  }, [token]); // Re-run when the token changes

  // --- useEffect 2: SignalR Connection and Listener ---
  useEffect(() => {
    let connection = null;
    
    // SignalR only works if a token is present
    if (!token) return;

    const startSignalR = async () => {
      try {
        // Pass the token to the SignalR connection via a query parameter
        connection = new signalR.HubConnectionBuilder()
          .withUrl(HUB_URL, { accessTokenFactory: () => token }) // Pass token here
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
  }, [token]); // Re-run when the token changes

  // --- Rendering Logic ---

  if (loading) return <p className="text-gray-400 p-4">Loading tasks...</p>;
  if (error) return <p className="text-red-500 p-4">Error: {error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Task Form Component */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl mb-10">
        <TaskForm onTaskCreated={fetchTasks} /> 
      </div>
      
      {/* Task List Display */}
      <h2 className="text-2xl font-bold mb-6 text-gray-200 border-b border-gray-700 pb-2">
        Project Tasks ({tasks.length})
      </h2>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found. Create a new task above!</p>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center justify-between p-4 rounded-lg shadow-md transition duration-300 ease-in-out 
                ${task.isComplete ? 'bg-green-900/40 border-l-4 border-green-500' : 'bg-gray-800 border-l-4 border-blue-500'}
              `}
            >
              {/* Task Details & Checkbox */}
              <div className="flex items-center space-x-3 w-full">
                {/* Checkbox (Toggle PUT) */}
                <input 
                  type="checkbox"
                  checked={task.isComplete}
                  onChange={() => toggleTask(task)} // Calls PUT API
                  className={`w-5 h-5 rounded transition duration-300 ease-in-out 
                    ${task.isComplete ? 'text-green-500 focus:ring-green-500' : 'text-blue-500 focus:ring-blue-500'}
                  `}
                />
                
                {/* Title and Description */}
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-semibold text-lg truncate 
                    ${task.isComplete ? 'text-green-300 line-through' : 'text-blue-300'}
                  `}>
                    {task.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">{task.description}</p>
                </div>
              </div>
              
              {/* Status and Actions */}
              <div className="flex items-center space-x-4 ml-4">
                 {/* Status Badge */}
                <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap
                  ${task.isComplete ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}
                `}>
                  {task.isComplete ? 'Completed' : 'Pending'}
                </span>

                {/* Date and Delete Button */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
                      {new Date(task.createdAt).toLocaleDateString()}
                  </span>

                  {/* Delete Button (DELETE) */}
                  <button
                    onClick={() => deleteTask(task.id)} // Calls DELETE API
                    className="text-gray-500 hover:text-red-500 transition duration-150 p-1 rounded-full hover:bg-gray-700"
                    aria-label={`Delete task ${task.title}`}
                  >
                    🗑️ 
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;