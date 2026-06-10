import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import TaskForm from './TaskForm';
import { Trash2 } from 'lucide-react'; // Icon for delete

// Base URLs from environment
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_URL = `${API_BASE}/api/Documents`;
const HUB_URL = `${API_BASE}/taskhub`;

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
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = createApiClient(token); 

  // --- Core Data Fetch ---
  const fetchDocuments = async () => {
    // ... (rest of the fetch logic remains the same)
    try {
      setLoading(true);
      const response = await apiClient.get(API_URL); 
      setDocuments(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); // Sort by newest first
    } catch (err) {
      console.error('Error fetching tasks:', err.response || err);
      if (err.response && err.response.status === 401) {
          setError('Session expired. Please log in again.');
      } else {
          setError('Failed to fetch documents. Ensure the .NET API is running!');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Logic: PUT (Toggle) ---
  const toggleDocument = async (doc) => {
    const updatedDoc = {
      id: doc.id,
      title: doc.title,
      content: doc.content || doc.description,
    };

    try {
      await apiClient.put(`${API_URL}/${doc.id}`, updatedDoc);
    } catch (err) {
      console.error('Error updating document:', err);
    }
  };

  // --- CRUD Logic: DELETE ---
  const deleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
        return; 
    }
    try {
      await apiClient.delete(`${API_URL}/${docId}`);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  // --- useEffect 1: Initial Data Load ---
  useEffect(() => {
    if (token) {
        fetchDocuments();
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

        connection.on('DocumentReceived', (doc, action) => {
          console.log(`SignalR: Received ${action} for Document ${doc.id}. Auto-fetching new data.`);
          fetchDocuments(); 
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
  
  if (loading) return <p className="text-gray-700 dark:text-gray-300 p-4">Loading documents...</p>;
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
        <TaskForm onDocumentCreated={fetchDocuments} theme={theme} />
      </div>
      
      {/* Document List Display */}
      <h2 className={`text-2xl font-bold mb-6 ${headingColor} border-b border-gray-300 dark:border-gray-700 pb-2`}>
        My Documents ({documents.length})
      </h2>
      
      <div className="space-y-4">
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents found. Create a new document above!</p>
        ) : (
          documents.map((doc) => (
            <div 
              key={doc.id} 
              className={`flex items-center justify-between p-4 rounded-lg shadow-sm transition duration-300 ease-in-out 
                ${cardBg} border border-gray-200 dark:border-gray-700
              `}
            >
              {/* Document Details */}
              <div className="flex items-center space-x-3 w-full">
                {/* Document Icon (placeholder for now) */}
                <div 
                  className="w-5 h-5 rounded-md border-2 border-gray-400 bg-gray-100 dark:bg-gray-700" 
                ></div>
                
                {/* Title and Content Preview */}
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-semibold text-lg truncate ${headingColor}`}>
                    {doc.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate">
                    {doc.content || doc.description || 'Empty document'}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-4 ml-4">
                {/* Delete Button (DELETE) */}
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 transition duration-150"
                  aria-label={`Delete document ${doc.title}`}
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