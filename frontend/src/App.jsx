import React, { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import AuthForm from './components/AuthForm';
import './App.css'; 
import { Sun, Moon, LogOut } from 'lucide-react'; // Using lucide-react for icons

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [theme, setTheme] = useState('light'); // Initial theme state

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
    // Apply theme classes to the main wrapper
    <div className={`min-h-screen ${backgroundClasses}`}>
      <header className={`border-b ${headerClasses} border-gray-200 dark:border-gray-800`}>
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">REAP Planner</div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {token && (
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 transition duration-150 flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {token ? (
          // Authenticated View
          <TaskList token={token} theme={theme} />
        ) : (
          // Unauthenticated View
          <div className="flex justify-center items-start pt-20">
            {/* Pass theme to AuthForm for styling */}
            <div className={`rounded-xl shadow-2xl w-full max-w-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <AuthForm onAuthSuccess={handleLogin} theme={theme} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;