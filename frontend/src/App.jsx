import React, { useState, useEffect } from 'react';
import TaskList from './Components/TaskList';
import AuthForm from './Components/AuthForm';
import './App.css'; 

function App() {
  // Check localStorage for an existing token on load
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-2xl font-extrabold text-blue-400">REAP Planner</div>
          {token && (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-400 bg-gray-700 rounded-lg hover:bg-gray-600 transition duration-150"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto py-8">
        {token ? (
          // Authenticated View
          <TaskList token={token} />
        ) : (
          // Unauthenticated View
          <div className="flex justify-center items-start pt-20">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
              <AuthForm onAuthSuccess={handleLogin} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;