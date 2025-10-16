import TaskList from './Components/TaskList';
import './App.css'; 
// Tailwind is assumed to be configured via the Vite index.html setup

function App() {
  return (
    // Tailwind: Sets the dark theme, centers content, and provides responsive padding
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      
      <main className="max-w-6xl mx-auto">
        {/* TaskList component contains the form and list logic */}
        <TaskList />
      </main>
    </div>
  );
}

export default App;
