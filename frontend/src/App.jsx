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

  const headerClasses = theme === 'dark' ? 'bg-cocoa-glass border-b border-gold-light/10 backdrop-blur-md shadow-2xl' : 'bg-cream-glass border-b border-cream-glass-border backdrop-blur-md shadow-lg';
  const backgroundClasses = 'min-h-screen text-sand-light transition-all duration-300';

  return (
    <Router>
      <div className="relative min-h-screen z-0">
        <div className="bg-drift" />
        <Routes>
          {/* Public Routes - Auth Pages */}
          <Route 
            path="/" 
            element={
              token ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className={backgroundClasses}>
                  <header className={headerClasses}>
                    <div className="max-w-7xl mx-auto py-4.5 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                      <div className="text-2xl font-serif font-bold text-luxury-gradient tracking-wide">REAP</div>
                      
                      <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl border border-gold-light/10 text-sand-light hover:text-gold-light hover:bg-gold-glass/5 transition duration-150"
                        aria-label="Toggle theme"
                      >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                      </button>
                    </div>
                  </header>

                  <main className="container mx-auto py-8 px-4">
                    <div className="flex justify-center items-start pt-16 md:pt-24">
                      <div className="w-full max-w-lg rounded-2xl glass-panel shadow-3xl overflow-hidden hover-lift-gold">
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
                <div className={backgroundClasses}>
                  <header className={headerClasses}>
                    <div className="max-w-7xl mx-auto py-4.5 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                      <div className="text-2xl font-serif font-bold text-luxury-gradient tracking-wide">REAP Dashboard</div>
                      
                      <div className="flex items-center space-x-4">
                        <NotificationBell token={token} hubConnection={hubConnection} theme={theme} />
                        <button
                          onClick={toggleTheme}
                          className="p-2.5 rounded-xl border border-gold-light/10 text-sand-light hover:text-gold-light hover:bg-gold-glass/5 transition duration-150"
                          aria-label="Toggle theme"
                        >
                          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        <button 
                          onClick={handleLogout}
                          className="px-4 py-2 text-xs font-serif uppercase tracking-widest text-red-400 border border-red-500/20 rounded-xl hover:bg-red-950/10 transition duration-150 flex items-center space-x-2"
                        >
                          <LogOut size={14} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </header>

                  <main className="container mx-auto py-8 px-4">
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
                <div className={backgroundClasses}>
                  <header className={headerClasses}>
                    <div className="max-w-7xl mx-auto py-4.5 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                      <div className="text-2xl font-serif font-bold text-luxury-gradient tracking-wide">REAP Canvas</div>
                      
                      <div className="flex items-center space-x-4">
                        <NotificationBell token={token} hubConnection={hubConnection} theme={theme} />
                        <button
                          onClick={toggleTheme}
                          className="p-2.5 rounded-xl border border-gold-light/10 text-sand-light hover:text-gold-light hover:bg-gold-glass/5 transition duration-150"
                          aria-label="Toggle theme"
                        >
                          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        <button 
                          onClick={handleLogout}
                          className="px-4 py-2 text-xs font-serif uppercase tracking-widest text-red-400 border border-red-500/20 rounded-xl hover:bg-red-950/10 transition duration-150 flex items-center space-x-2"
                        >
                          <LogOut size={14} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </header>

                  <main className="container mx-auto py-8 px-4">
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
      </div>
    </Router>
  );
}

export default App;