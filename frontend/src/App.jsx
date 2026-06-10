import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DocumentList from './Components/DocumentList';
import AuthForm from './Components/AuthForm';
import VerifyEmail from './Components/VerifyEmail';
import ForgotPassword from './Components/ForgotPassword';
import ResetPassword from './Components/ResetPassword';
import DocumentEditor from './Components/DocumentEditor';
import NotificationBell from './Components/NotificationBell';
import * as signalR from '@microsoft/signalr';
import './App.css'; 
import { Sun, Moon, LogOut } from 'lucide-react'; // Using lucide-react for icons

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [theme, setTheme] = useState('light'); // Initial theme state
  const [hubConnection, setHubConnection] = useState(null);

  useEffect(() => {
    if (!token) {
      setHubConnection(null);
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072'}/documenthub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('App: Connected to notification socket.');
        setHubConnection(connection);
      })
      .catch(err => console.error('App: Failed to connect to notification socket:', err));

    return () => {
      connection.stop();
    };
  }, [token]);

  useEffect(() => {
    // Apply the theme class to the document body
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const headerClasses = theme === 'dark' ? 'bg-gray-900 shadow-xl' : 'bg-white shadow-lg';
  const backgroundClasses = theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-800';

  return (
    <Router>
      <Routes>
        {/* Public Routes - Auth Pages */}
        <Route 
          path="/" 
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className={`min-h-screen ${backgroundClasses}`}>
                <header className={`border-b ${headerClasses} border-gray-200 dark:border-gray-800`}>
                  <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">REAP Planner</div>
                    
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150"
                      aria-label="Toggle theme"
                    >
                      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                  </div>
                </header>

                <main className="container mx-auto py-8">
                  <div className="flex justify-center items-start pt-20">
                    <div className={`rounded-xl shadow-2xl w-full max-w-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                      <AuthForm onAuthSuccess={handleLogin} theme={theme} />
                    </div>
                  </div>
                </main>
              </div>
            )
          } 
        />

        <Route path="/verify-email" element={<VerifyEmail theme={theme} />} />
        <Route path="/forgot-password" element={<ForgotPassword theme={theme} />} />
        <Route path="/reset-password" element={<ResetPassword theme={theme} />} />

        {/* Protected Route - Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            token ? (
              <div className={`min-h-screen ${backgroundClasses}`}>
                <header className={`border-b ${headerClasses} border-gray-200 dark:border-gray-800`}>
                  <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">REAP Planner</div>
                    
                    <div className="flex items-center space-x-4">
                      <NotificationBell token={token} hubConnection={hubConnection} theme={theme} />
                      <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150"
                        aria-label="Toggle theme"
                      >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                      </button>

                      <button 
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 transition duration-150 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </header>

                <main className="container mx-auto py-8">
                  <DocumentList token={token} theme={theme} />
                </main>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Protected Route - Document Editor */}
        <Route 
          path="/documents/:id" 
          element={
            token ? (
              <div className={`min-h-screen ${backgroundClasses}`}>
                <header className={`border-b ${headerClasses} border-gray-200 dark:border-gray-800`}>
                  <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">REAP Editor</div>
                    
                    <div className="flex items-center space-x-4">
                      <NotificationBell token={token} hubConnection={hubConnection} theme={theme} />
                      <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150"
                        aria-label="Toggle theme"
                      >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                      </button>

                      <button 
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 transition duration-150 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </header>

                <main className="container mx-auto py-8">
                  <DocumentEditor theme={theme} />
                </main>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;