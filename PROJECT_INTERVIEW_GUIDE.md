# REAP: Real-Time Event Planner - Interview Guide 🚀

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design](#architecture--design)
4. [React Basics Used](#react-basics-used)
5. [React Hooks - Detailed Examples](#react-hooks---detailed-examples)
6. [Props - Detailed Examples](#props---detailed-examples)
7. [Key Features Implementation](#key-features-implementation)
8. [Database & Backend](#database--backend)
9. [Interview Talking Points](#interview-talking-points)
10. [Common Questions & Answers](#common-questions--answers)

---

## 🎯 Project Overview

### What is REAP (Real-Time Event Planner)?

**REAP** is a full-stack task management application that allows multiple users to collaborate in real-time. When one user creates, updates, or deletes a task, all other connected users see the changes instantly without refreshing their browsers.

### Problem It Solves
Traditional task management apps require manual refresh to see updates from other users. REAP solves this by implementing **WebSocket technology (SignalR)** for real-time bidirectional communication between server and clients.

### Key Capabilities
- ✅ **User Authentication**: Secure JWT-based login/registration
- ✅ **CRUD Operations**: Create, Read, Update, Delete tasks
- ✅ **Real-Time Sync**: Instant updates across all connected users
- ✅ **Dark Mode**: Toggle between light and dark themes
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Task Status**: Mark tasks as complete/incomplete
- ✅ **Persistent Storage**: PostgreSQL database

### Use Cases
- Team project management
- Event planning coordination
- Shared to-do lists
- Real-time collaboration scenarios

---

## 🛠️ Technology Stack

### Frontend (React)
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI library for building interactive interfaces |
| **Vite** | 7.1.7 | Fast build tool and dev server |
| **Tailwind CSS** | 4.1.15 | Utility-first CSS framework for styling |
| **Axios** | 1.12.2 | HTTP client for API requests |
| **SignalR** | 9.0.6 | WebSocket library for real-time communication |
| **Lucide React** | 0.546.0 | Icon library for UI elements |

### Backend (.NET)
| Technology | Version | Purpose |
|------------|---------|---------|
| **.NET Core** | 9.0 | Backend framework |
| **ASP.NET Core Identity** | - | User authentication & authorization |
| **Entity Framework Core** | - | ORM for database operations |
| **PostgreSQL** | - | Relational database |
| **SignalR** | - | Real-time WebSocket server |
| **JWT Bearer** | - | Token-based authentication |

---

## 🏗️ Architecture & Design

### Overall Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   App.jsx   │  │ AuthForm.jsx │  │ TaskList.jsx │       │
│  │  (Container)│  │   (Login)    │  │  (Dashboard) │       │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP REST API (Axios)
                      │ WebSocket (SignalR)
┌─────────────────────▼───────────────────────────────────────┐
│                .NET Core Backend (ASP.NET)                   │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐      │
│  │AuthController│  │TasksController│  │  TaskHub    │      │
│  │  (JWT Auth)  │  │  (CRUD APIs)  │  │ (SignalR)   │      │
│  └──────┬───────┘  └───────┬───────┘  └──────┬──────┘      │
│         │                   │                  │             │
│         └───────────────────┴──────────────────┘             │
└─────────────────────┬───────────────────────────────────────┘
                      │ Entity Framework Core
┌─────────────────────▼───────────────────────────────────────┐
│               PostgreSQL Database                            │
│  - AspNetUsers (Identity tables)                             │
│  - TaskItems (Task data)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
```
App.jsx (Root Component)
│
├─ AuthForm.jsx (Login/Register)
│  └─ Props: onAuthSuccess, theme
│
└─ TaskList.jsx (Main Dashboard)
   ├─ Props: token, theme
   │
   └─ TaskForm.jsx (Create Task)
      └─ Props: onTaskCreated, theme
```

### Data Flow
1. **Authentication Flow**:
   - User enters credentials → AuthForm → API call → Receives JWT token → Stored in localStorage → App updates state → Shows TaskList

2. **Task Creation Flow**:
   - User fills form → TaskForm → POST request → Server saves to DB → SignalR broadcasts → All clients receive update → Re-fetch tasks → UI updates

3. **Real-Time Update Flow**:
   - User A creates task → Server broadcasts via SignalR → User B's browser receives event → Auto-fetches updated task list → UI refreshes automatically

---

## 📚 React Basics Used

### 1. **JSX (JavaScript XML)**
JSX allows you to write HTML-like code in JavaScript files.

**Example from App.jsx:**
```jsx
return (
  <div className={`min-h-screen ${backgroundClasses}`}>
    <header className={`border-b ${headerClasses}`}>
      <div className="text-2xl font-extrabold">REAP Planner</div>
      {token && (
        <button onClick={handleLogout}>
          <span>Logout</span>
        </button>
      )}
    </header>
  </div>
);
```

**Key Points:**
- JSX looks like HTML but is actually JavaScript
- Use `className` instead of `class`
- JavaScript expressions go inside `{}`
- Can embed variables, functions, and components

---

### 2. **Components**
React apps are built using reusable components. Each component is a JavaScript function that returns JSX.

**Example - Functional Component:**
```jsx
const TaskForm = ({ onTaskCreated, theme }) => {
  const [title, setTitle] = useState('');
  
  return (
    <form>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button type="submit">Add Task</button>
    </form>
  );
};

export default TaskForm;
```

**Our Project Has 4 Main Components:**
1. **App.jsx** - Root component managing authentication and theme
2. **AuthForm.jsx** - Handles user login and registration
3. **TaskList.jsx** - Displays all tasks and manages real-time updates
4. **TaskForm.jsx** - Form for creating new tasks

---

### 3. **Props (Properties)**
Props allow data to flow from parent to child components.

**Example from App.jsx (Parent):**
```jsx
// Parent passes data down
<TaskList token={token} theme={theme} />
```

**Example from TaskList.jsx (Child):**
```jsx
// Child receives and uses the data
const TaskList = ({ token, theme }) => {
  console.log(token); // Can use the token here
  console.log(theme); // Can use the theme here
  // ...
};
```

**More Details in Props Section Below** ⬇️

---

### 4. **State Management**
State is data that can change over time. When state changes, React re-renders the component.

**Example from App.jsx:**
```jsx
const [token, setToken] = useState(null);
const [theme, setTheme] = useState('light');

// Update state
setToken('new-jwt-token');
setTheme('dark');
```

**More Details in Hooks Section Below** ⬇️

---

### 5. **Event Handling**
React handles user interactions through event handlers.

**Common Events in Our Project:**

**onClick - Button Clicks:**
```jsx
// Theme toggle
<button onClick={toggleTheme}>
  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
</button>

// Logout
<button onClick={handleLogout}>
  <LogOut size={16} />
  <span>Logout</span>
</button>

// Delete task
<button onClick={() => deleteTask(task.id)}>
  <Trash2 size={16} />
</button>
```

**onChange - Input Changes:**
```jsx
<input 
  type="email" 
  value={email} 
  onChange={(e) => setEmail(e.target.value)} 
/>

<input 
  type="checkbox"
  checked={task.isComplete}
  onChange={() => toggleTask(task)} 
/>
```

**onSubmit - Form Submission:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault(); // Prevents page reload
  // Form processing logic...
};

<form onSubmit={handleSubmit}>
  {/* form fields */}
</form>
```

---

### 6. **Conditional Rendering**
Show different UI based on conditions.

**Example 1 - Ternary Operator (condition ? true : false):**
```jsx
// Show TaskList if logged in, otherwise show AuthForm
{token ? (
  <TaskList token={token} theme={theme} />
) : (
  <AuthForm onAuthSuccess={handleLogin} theme={theme} />
)}

// Theme icon toggle
{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}

// Button text
{loading ? 'Processing...' : 'Submit'}
```

**Example 2 - Logical AND (condition && element):**
```jsx
// Only show logout button if user is logged in
{token && (
  <button onClick={handleLogout}>
    Logout
  </button>
)}

// Only show error if it exists
{error && <p className="text-red-500">{error}</p>}
```

**Example 3 - Early Return:**
```jsx
// In TaskList.jsx
if (loading) return <p>Loading tasks...</p>;
if (error) return <p>{error}</p>;

// If neither condition is true, continue to main render
return (
  <div>
    {/* Task list UI */}
  </div>
);
```

---

### 7. **Lists and Keys**
Rendering arrays of data using `.map()`.

**Example from TaskList.jsx:**
```jsx
{tasks.length === 0 ? (
  <p>No tasks found. Create a new task above!</p>
) : (
  tasks.map((task) => (
    <div key={task.id}>  {/* ← Unique key is REQUIRED */}
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <span>{task.isComplete ? 'Completed' : 'Pending'}</span>
    </div>
  ))
)}
```

**Why Keys are Important:**
- Helps React identify which items changed, were added, or removed
- Must be unique among siblings
- Use stable IDs (like `task.id`), not array index

---

### 8. **Imports and Exports**

**Importing:**
```jsx
// React and hooks
import React, { useState, useEffect } from 'react';

// Components
import TaskList from './components/TaskList';
import AuthForm from './components/AuthForm';

// Libraries
import axios from 'axios';
import * as signalR from '@microsoft/signalr';

// Icons
import { Sun, Moon, LogOut, Trash2, Plus } from 'lucide-react';

// Styles
import './App.css';
```

**Exporting:**
```jsx
// Default export (one per file)
export default App;

// Named export (multiple per file)
export const API_URL = 'https://localhost:7072/api/Tasks';
```

---

## 🎣 React Hooks - Detailed Examples

Hooks are special functions that let you "hook into" React features. They only work in functional components.

---

### 1. **useState Hook** - Managing Component State

#### What is useState?
`useState` adds state (data that can change) to functional components. When state changes, React re-renders the component.

#### Syntax
```jsx
const [stateVariable, setStateFunction] = useState(initialValue);
```

#### Real Examples from Our Project:

---

#### **Example 1: Authentication Token (App.jsx)**
```jsx
const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
```

**What it does:**
- Creates a state variable called `token`
- Initial value: checks localStorage for saved token, or `null`
- `setToken` function updates the token
- When token changes, component re-renders

**How it's used:**
```jsx
// Login success - Update token
const handleLogin = (newToken) => {
  setToken(newToken);
};

// Logout - Clear token
const handleLogout = () => {
  localStorage.removeItem('jwtToken');
  setToken(null);
};

// Conditional rendering based on token
{token ? <TaskList /> : <AuthForm />}
```

**Interview Explanation:**
"In App.jsx, I use useState to manage the authentication token. When a user logs in, the token is stored in both state and localStorage. The token state determines whether to show the login form or the task dashboard. When the user logs out, we clear both the localStorage and state, which triggers a re-render showing the login form again."

---

#### **Example 2: Theme Toggle (App.jsx)**
```jsx
const [theme, setTheme] = useState('light');

const toggleTheme = () => {
  setTheme(prev => prev === 'light' ? 'dark' : 'light');
};
```

**What it does:**
- Manages current theme ('light' or 'dark')
- `prev =>` is an updater function that receives previous state
- Toggles between light and dark mode

**Why use `prev =>`?**
- Ensures you're working with the most recent state
- Important when state updates are based on previous state

**How it's used:**
```jsx
// Apply theme classes
const backgroundClasses = theme === 'dark' 
  ? 'bg-gray-950 text-gray-100' 
  : 'bg-gray-50 text-gray-800';

// Toggle button
<button onClick={toggleTheme}>
  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
</button>

// Pass to child components
<TaskList theme={theme} />
```

**Interview Explanation:**
"I implemented a dark mode feature using useState. The theme state controls styling across all components. When the user clicks the theme toggle button, it updates the state using a functional updater to ensure we're working with the latest value. The theme is then passed down to child components via props."

---

#### **Example 3: Form Inputs (AuthForm.jsx)**
```jsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isLogin, setIsLogin] = useState(true);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState(null);
```

**What each state does:**
- `email`: Stores email input value
- `password`: Stores password input value
- `isLogin`: Toggles between login and register modes
- `loading`: Shows loading state during API calls
- `message`: Displays success/error messages

**How they're used:**
```jsx
// Controlled input - email
<input 
  type="email" 
  value={email}                              // ← State controls value
  onChange={(e) => setEmail(e.target.value)} // ← User input updates state
  required 
/>

// Toggle between login/register
<button onClick={() => setIsLogin(!isLogin)}>
  {isLogin ? "Don't have an account? Register" : "Already have an account? Log In"}
</button>

// Loading state
<button type="submit" disabled={loading}>
  {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register'}
</button>

// Message display
{message && (
  <div className={messageClasses}>
    {message}
  </div>
)}
```

**Interview Explanation:**
"In the AuthForm component, I use multiple useState hooks to manage form state. Email and password are controlled inputs, meaning React state is the single source of truth for their values. The isLogin state toggles between login and register modes. During API calls, loading state is set to true to disable the button and show loading text. The message state displays success or error feedback to users."

---

#### **Example 4: Task List State (TaskList.jsx)**
```jsx
const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**What each state does:**
- `tasks`: Array of task objects from API
- `loading`: Shows loading spinner while fetching
- `error`: Stores error messages

**How they're used:**
```jsx
// Fetch tasks from API
const fetchTasks = async () => {
  try {
    setLoading(true);
    const response = await apiClient.get(API_URL);
    setTasks(response.data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
  } catch (err) {
    setError('Failed to fetch tasks.');
  } finally {
    setLoading(false); // Always runs, even if error occurs
  }
};

// Conditional rendering based on state
if (loading) return <p>Loading tasks...</p>;
if (error) return <p>{error}</p>;

// Render tasks
return (
  <div>
    {tasks.map(task => (
      <div key={task.id}>{task.title}</div>
    ))}
  </div>
);
```

**Interview Explanation:**
"TaskList uses three pieces of state: tasks array, loading boolean, and error string. When the component mounts, it fetches tasks from the API. During the fetch, loading is true, showing a loading message. If successful, tasks are updated with sorted data. If it fails, error state is set with a message. This pattern provides clear feedback to users at every stage."

---

#### **Example 5: Task Form State (TaskForm.jsx)**
```jsx
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**Complete form submission flow:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault(); 
  setLoading(true);
  setError(null);

  const newTask = {
    title,
    description,
  };

  try {
    await apiClient.post(API_URL, newTask);
    
    // Clear form on success
    setTitle('');
    setDescription('');
    
    // Notify parent to refresh task list
    onTaskCreated(); 
  } catch (err) {
    setError('Failed to create task.');
  } finally {
    setLoading(false);
  }
};
```

**Interview Explanation:**
"The TaskForm manages title and description as controlled inputs. When the form is submitted, loading state is set to true, disabling the button. After a successful API call, the form is cleared by resetting state to empty strings. If it fails, an error message is displayed. The onTaskCreated callback notifies the parent component to refresh the task list."

---

### 2. **useEffect Hook** - Side Effects and Lifecycle

#### What is useEffect?
`useEffect` lets you perform side effects in components. Side effects include:
- Fetching data from APIs
- Setting up subscriptions (like WebSocket)
- Manually changing the DOM
- Setting up timers

#### Syntax
```jsx
useEffect(() => {
  // Code to run (effect)
  
  return () => {
    // Cleanup code (optional)
  };
}, [dependencies]); // When to run the effect
```

#### Dependency Array Explained:
| Dependency | When Effect Runs |
|------------|------------------|
| `[]` | **Once** on component mount |
| `[state]` | On mount + **whenever `state` changes** |
| `[a, b]` | On mount + **whenever `a` OR `b` changes** |
| No array | **After every render** (rarely used) |

---

#### **Example 1: Theme Application (App.jsx)**
```jsx
useEffect(() => {
  // Apply the theme class to the document body
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]); // ← Runs when `theme` changes
```

**What it does:**
- Watches the `theme` state
- When `theme` changes, adds/removes 'dark' class from `<html>` element
- This enables dark mode styling across entire page

**Breakdown:**
```jsx
useEffect(() => {
  // If theme is 'dark', add 'dark' class
  // If theme is 'light', remove 'dark' class
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]); // Dependencies: re-run when theme changes
```

**Interview Explanation:**
"I use useEffect to apply the theme to the entire document. When the user toggles the theme, the state changes, triggering this effect. It adds or removes the 'dark' class from the HTML element, which Tailwind CSS uses to apply dark mode styles throughout the app."

---

#### **Example 2: Fetch Tasks on Mount (TaskList.jsx)**
```jsx
useEffect(() => {
  if (token) {
    fetchTasks();
  }
}, [token]); // ← Runs on mount and when token changes
```

**What it does:**
- Runs when component first mounts
- Runs again if `token` changes (e.g., user logs out and logs back in)
- Fetches tasks only if user is authenticated

**Why `[token]` dependency?**
- Ensures tasks are fetched when user logs in
- Re-fetches if token changes (though rare in this app)
- Doesn't fetch if token is null (user not logged in)

**Complete context:**
```jsx
// Fetch function
const fetchTasks = async () => {
  try {
    setLoading(true);
    const response = await apiClient.get(API_URL);
    setTasks(response.data);
  } catch (err) {
    setError('Failed to fetch tasks.');
  } finally {
    setLoading(false);
  }
};

// Effect to trigger fetch
useEffect(() => {
  if (token) {
    fetchTasks();
  }
}, [token]);
```

**Interview Explanation:**
"This useEffect fetches tasks when the component mounts and whenever the authentication token changes. The dependency array contains token, so if a user logs out and logs back in with a different account, it will automatically fetch that user's tasks. I check if token exists before fetching to avoid unnecessary API calls when the user isn't authenticated."

---

#### **Example 3: SignalR Real-Time Connection (TaskList.jsx)**
This is the most complex useEffect in our project!

```jsx
useEffect(() => {
  let connection = null;
  if (!token) return; // Don't connect if not authenticated

  const startSignalR = async () => {
    try {
      // 1. Build WebSocket connection
      connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();

      // 2. Listen for task updates from server
      connection.on('TaskReceived', (task, action) => {
        console.log(`SignalR: Received ${action} for Task ${task.id}`);
        fetchTasks(); // Re-fetch to show updated data
      });

      // 3. Start the connection
      await connection.start();
      console.log('SignalR Connected.');
    } catch (err) {
      console.error('SignalR Connection Error:', err);
    }
  };

  startSignalR();

  // 4. CLEANUP FUNCTION - Very Important!
  return () => {
    if (connection) {
      connection.stop();
      console.log('SignalR Disconnected.');
    }
  };
}, [token]); // Re-establish connection if token changes
```

**What it does - Step by Step:**

**Step 1: Connection Setup**
```jsx
connection = new signalR.HubConnectionBuilder()
  .withUrl(HUB_URL, { accessTokenFactory: () => token })
  .withAutomaticReconnect()
  .build();
```
- Creates WebSocket connection to server
- Sends JWT token for authentication
- Auto-reconnects if connection drops

**Step 2: Event Listener**
```jsx
connection.on('TaskReceived', (task, action) => {
  console.log(`SignalR: Received ${action} for Task ${task.id}`);
  fetchTasks(); // Re-fetch to show updated data
});
```
- Listens for 'TaskReceived' events from server
- When any user creates/updates/deletes a task, server broadcasts this event
- All connected clients receive it and re-fetch tasks

**Step 3: Start Connection**
```jsx
await connection.start();
```
- Actually establishes the WebSocket connection

**Step 4: Cleanup Function (CRITICAL!)**
```jsx
return () => {
  if (connection) {
    connection.stop();
    console.log('SignalR Disconnected.');
  }
};
```
- Runs when component unmounts or before effect re-runs
- Closes WebSocket connection
- Prevents memory leaks

**When does this run?**
- **On mount**: Sets up connection
- **On token change**: Disconnects old connection, sets up new one
- **On unmount**: Cleanup disconnects connection

**Interview Explanation:**
"This is the heart of the real-time functionality. I use useEffect to establish a SignalR WebSocket connection when the component mounts. The connection listens for 'TaskReceived' events from the server. When any user performs a CRUD operation, the .NET backend broadcasts an event, and all connected clients receive it and automatically refresh their task lists. The cleanup function is crucial—it disconnects the WebSocket when the component unmounts or token changes, preventing memory leaks. The dependency array includes token so the connection is re-established with the correct authentication if the user logs in or out."

---

### **Why useEffect is Important**

**Without useEffect:**
```jsx
// ❌ This would run on EVERY render
const fetchTasks = async () => {
  const response = await apiClient.get(API_URL);
  setTasks(response.data); // This updates state...
  // ...which triggers re-render...
  // ...which calls fetchTasks again...
  // INFINITE LOOP! 🔄
};
```

**With useEffect:**
```jsx
// ✅ This runs only when we want it to
useEffect(() => {
  fetchTasks();
}, []); // Empty array = run once on mount
```

---

## 🎁 Props - Detailed Examples

### What are Props?
Props (short for "properties") are how components talk to each other. They allow data to flow from parent to child components.

### Key Rules:
1. **Props are read-only** - Child components cannot modify props
2. **Data flows one way** - Parent → Child (not Child → Parent)
3. **To send data up** - Pass callback functions as props

---

### **Example 1: Passing Data Down (App.jsx → TaskList)**

**Parent Component (App.jsx):**
```jsx
function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [theme, setTheme] = useState('light');

  return (
    <div>
      {token ? (
        // Pass token and theme to TaskList
        <TaskList token={token} theme={theme} />
      ) : (
        // Pass theme and callback to AuthForm
        <AuthForm onAuthSuccess={handleLogin} theme={theme} />
      )}
    </div>
  );
}
```

**Child Component (TaskList.jsx):**
```jsx
const TaskList = ({ token, theme }) => {
  // Now we can use token and theme here!
  
  // Use token for API calls
  const apiClient = createApiClient(token);
  
  // Use theme for styling
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const headingColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  
  return (
    <div className={cardBg}>
      <h1 className={headingColor}>Dashboard</h1>
      {/* Rest of component */}
    </div>
  );
};
```

**What happens:**
1. App.jsx (parent) creates `token` and `theme` state
2. Passes them to TaskList: `<TaskList token={token} theme={theme} />`
3. TaskList (child) receives them: `({ token, theme })`
4. TaskList uses them for API calls and styling

**Interview Explanation:**
"I use props to pass authentication tokens and theme preferences down the component tree. The App component manages these as state, and passes them to TaskList. TaskList then uses the token to make authenticated API requests and the theme to apply appropriate styling classes. This keeps the authentication logic centralized in the App component."

---

### **Example 2: Callback Functions (Child → Parent Communication)**

When a child needs to send data to its parent, we pass a function as a prop.

**Parent Component (App.jsx):**
```jsx
function App() {
  const [token, setToken] = useState(null);

  // This function will be called by AuthForm
  const handleLogin = (newToken) => {
    setToken(newToken); // Update parent's state
  };

  return (
    <div>
      {token ? (
        <TaskList token={token} />
      ) : (
        // Pass the function as a prop
        <AuthForm onAuthSuccess={handleLogin} />
      )}
    </div>
  );
}
```

**Child Component (AuthForm.jsx):**
```jsx
const AuthForm = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Make API call
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });
      
      const token = response.data.token;
      localStorage.setItem('jwtToken', token);
      
      // Call parent's function to update its state!
      onAuthSuccess(token);
      
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

**Flow:**
1. App defines `handleLogin` function
2. App passes it to AuthForm as `onAuthSuccess` prop
3. AuthForm calls `onAuthSuccess(token)` after successful login
4. This triggers `handleLogin` in App
5. App updates its state with `setToken(newToken)`
6. State change causes re-render, showing TaskList instead of AuthForm

**Interview Explanation:**
"To handle child-to-parent communication, I pass callback functions as props. When a user successfully logs in, AuthForm needs to notify App component. So App passes its `handleLogin` function to AuthForm as the `onAuthSuccess` prop. After successful authentication, AuthForm calls this function with the JWT token. This updates App's state, causing a re-render that shows the task dashboard instead of the login form. This pattern maintains unidirectional data flow while allowing child components to trigger state changes in parents."

---

### **Example 3: Props Drilling (App → TaskList → TaskForm)**

Sometimes props need to pass through multiple levels.

**Level 1: App.jsx**
```jsx
function App() {
  const [theme, setTheme] = useState('light');
  
  return (
    <TaskList theme={theme} /> // Pass to TaskList
  );
}
```

**Level 2: TaskList.jsx**
```jsx
const TaskList = ({ theme }) => {
  // Receive theme and pass it down further
  
  return (
    <div>
      <h1>Dashboard</h1>
      <TaskForm onTaskCreated={fetchTasks} theme={theme} /> {/* Pass to TaskForm */}
    </div>
  );
};
```

**Level 3: TaskForm.jsx**
```jsx
const TaskForm = ({ onTaskCreated, theme }) => {
  // Finally use it here
  const headerColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const inputClasses = theme === 'dark' ? 'bg-gray-700' : 'bg-white';
  
  return (
    <form>
      <h3 className={headerColor}>Quick Add Task</h3>
      <input className={inputClasses} />
    </form>
  );
};
```

**This is called "Prop Drilling":**
- `theme` travels: App → TaskList → TaskForm
- Each component passes it down
- Only TaskForm actually uses it

**Interview Note:**
"For larger apps, this can become cumbersome. Solutions include React Context API or state management libraries like Redux or Zustand. For our app's size, prop drilling is acceptable and keeps things simple."

---

### **Example 4: Multiple Props Types**

**Parent (TaskList.jsx):**
```jsx
<TaskForm 
  onTaskCreated={fetchTasks}  // Function prop
  theme={theme}               // String prop
  token={token}               // String prop
  isEditing={false}           // Boolean prop
  maxTasks={100}              // Number prop
/>
```

**Child (TaskForm.jsx):**
```jsx
const TaskForm = ({ 
  onTaskCreated,  // Function
  theme,          // String
  token,          // String
  isEditing,      // Boolean
  maxTasks        // Number
}) => {
  // Use all props
};
```

**Props can be any data type:**
- Strings, numbers, booleans
- Functions (callbacks)
- Objects, arrays
- Even other React components!

---

### **Props vs State - Key Differences**

| Aspect | Props | State |
|--------|-------|-------|
| **Where it lives** | Passed from parent | Lives in component |
| **Can be changed?** | ❌ Read-only | ✅ Yes, with setState |
| **Who controls it?** | Parent component | The component itself |
| **Think of it as** | Function parameters | Component memory |

**Example showing the difference:**

```jsx
// Parent Component
const Parent = () => {
  const [count, setCount] = useState(0); // STATE in Parent
  
  return (
    <Child count={count} />  // Passed as PROP to Child
  );
};

// Child Component
const Child = ({ count }) => {
  // count is a PROP here (read-only)
  // Cannot do: count = 5; ❌
  
  // But can have own STATE:
  const [localData, setLocalData] = useState(''); // STATE in Child
  
  return <div>{count}</div>;
};
```

---

## 🔑 Key Features Implementation

### 1. **JWT Authentication System**

**Flow Diagram:**
```
User enters credentials
        ↓
React sends POST to /api/Auth/login
        ↓
.NET validates credentials
        ↓
If valid: Generates JWT token
        ↓
Returns token to React
        ↓
React stores in localStorage + state
        ↓
All future API calls include token in header
```

**Backend (AuthController.cs):**
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto model)
{
    var user = await _userManager.FindByEmailAsync(model.Email);
    
    if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
    {
        var token = GetToken(user); // Generate JWT
        
        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            expiration = token.ValidTo
        });
    }
    return Unauthorized();
}
```

**Frontend (AuthForm.jsx):**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password
    });
    
    const token = response.data.token;
    localStorage.setItem('jwtToken', token); // Persist token
    onAuthSuccess(token); // Update parent state
    
  } catch (error) {
    setMessage('Login failed');
  }
};
```

**Making Authenticated Requests:**
```jsx
const createApiClient = (token) => {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Use it
const apiClient = createApiClient(token);
const response = await apiClient.get(API_URL);
```

---

### 2. **Real-Time Updates with SignalR**

**How It Works:**

```
User A creates task
        ↓
React POST to /api/Tasks
        ↓
.NET saves to database
        ↓
.NET broadcasts via SignalR Hub
        ↓
SignalR sends event to ALL connected clients
        ↓
User B's React receives event
        ↓
User B's TaskList re-fetches tasks
        ↓
User B sees new task instantly!
```

---

### **🔍 EXACT CODE LOCATIONS - Task Creation & Real-Time Broadcast**

Let me show you **exactly** where each step happens in the frontend code:

---

#### **Step 1: User Fills TaskForm and Submits**

**File:** `frontend/src/Components/TaskForm.jsx`

**Line 55-62: Form JSX with controlled inputs**
```jsx
<form onSubmit={handleSubmit} className="space-y-4">
  <input
    type="text"
    placeholder="Task Title (required)"
    value={title}                              // ← Controlled by useState
    onChange={(e) => setTitle(e.target.value)} // ← Updates state on typing
    required
  />
```

**When user clicks submit button, it triggers:**

---

#### **Step 2: React POST to /api/Tasks with JWT Token**

**File:** `frontend/src/Components/TaskForm.jsx`

**Line 9-15: Create authenticated API client**
```jsx
const createApiClient = (token) => {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,  // ← JWT token added here!
      'Content-Type': 'application/json'
    }
  });
};
```

**Line 22-24: Get token and create client**
```jsx
const token = localStorage.getItem('jwtToken'); // ← Retrieve JWT from storage
const apiClient = createApiClient(token);       // ← Create authenticated Axios instance
```

**Line 26-47: handleSubmit function - THE POST REQUEST**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();           // ← Prevent page reload
  setLoading(true);            // ← Show loading state
  setError(null);

  const newTask = {            // ← Package form data
    title,
    description,
  };

  try {
    // 🔥 THIS IS WHERE THE POST REQUEST HAPPENS!
    await apiClient.post(API_URL, newTask);  // ← Line 37
    // POST to https://localhost:7072/api/Tasks
    // With Authorization: Bearer <token> header
    
    // Clear form after success
    setTitle('');              // ← Line 39
    setDescription('');        // ← Line 40
    
    onTaskCreated();           // ← Line 41 - Notify parent (see Step 7)
  } catch (err) {
    console.error('Error creating task:', err);
    setError('Failed to create task.');
  } finally {
    setLoading(false);         // ← Hide loading state
  }
};
```

**🎯 Key Line: Line 37** - `await apiClient.post(API_URL, newTask);`
- This sends POST request to backend
- Includes JWT token in Authorization header
- Backend validates token, saves task, broadcasts via SignalR

---

#### **Step 3-5: Backend Processing** (Not in Frontend)
- TasksController validates JWT token
- Entity Framework saves to PostgreSQL
- TaskHub broadcasts "TaskReceived" event

---

#### **Step 6: All Connected Clients Receive Event via SignalR**

**File:** `frontend/src/Components/TaskList.jsx`

**Line 8: SignalR Hub URL**
```jsx
const HUB_URL = 'https://localhost:7072/taskhub'; // ← WebSocket endpoint
```

**Line 77-105: useEffect - SignalR Connection Setup**
```jsx
// --- useEffect 2: SignalR Connection and Listener ---
useEffect(() => {
  let connection = null;
  if (!token) return; // Don't connect without authentication

  const startSignalR = async () => {
    try {
      // BUILD CONNECTION
      connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, { 
          accessTokenFactory: () => token  // ← Line 88: Send JWT for auth
        })
        .withAutomaticReconnect()          // ← Auto-reconnect if disconnected
        .build();

      // 🔥 THIS IS WHERE WE LISTEN FOR BROADCASTS!
      connection.on('TaskReceived', (task, action) => {  // ← Line 93
        console.log(`SignalR: Received ${action} for Task ${task.id}`);
        fetchTasks();  // ← Line 95 (See Step 7)
      });

      // START CONNECTION
      await connection.start();  // ← Line 98: Establish WebSocket
      console.log('SignalR Connected.');

    } catch (err) {
      console.error('SignalR Connection Error:', err);
    }
  };

  startSignalR();

  // CLEANUP
  return () => {
    if (connection) {
      connection.stop();  // ← Line 109: Disconnect on unmount
      console.log('SignalR Disconnected.');
    }
  };
}, [token]); // ← Re-run if token changes
```

**🎯 Key Line: Line 93** - `connection.on('TaskReceived', (task, action) => {...})`
- This listens for 'TaskReceived' events from server
- When ANY user creates/updates/deletes a task, ALL connected clients receive this event
- The event includes the task data and action type ('created', 'updated', 'deleted')

---

#### **Step 7: Each Client's TaskList.jsx Calls fetchTasks()**

**File:** `frontend/src/Components/TaskList.jsx`

**Line 95: Inside SignalR event handler**
```jsx
connection.on('TaskReceived', (task, action) => {
  console.log(`SignalR: Received ${action} for Task ${task.id}`);
  fetchTasks();  // 🔥 THIS TRIGGERS THE REFRESH!
});
```

**Line 24-41: fetchTasks function - FETCHES UPDATED DATA**
```jsx
const fetchTasks = async () => {
  try {
    setLoading(true);
    
    // 🔥 GET REQUEST TO FETCH ALL TASKS
    const response = await apiClient.get(API_URL);  // ← Line 27
    // GET from https://localhost:7072/api/Tasks
    
    // Sort by newest first and update state
    setTasks(response.data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ));  // ← Line 28-30: Update tasks state
    
  } catch (err) {
    console.error('Error fetching tasks:', err);
    setError('Failed to fetch tasks.');
  } finally {
    setLoading(false);
  }
};
```

**🎯 Key Line: Line 27** - `const response = await apiClient.get(API_URL);`
- Fetches latest tasks from API
- Line 28-30: Updates `tasks` state with sorted data

---

#### **Step 8: All Users See New Task Instantly!**

**File:** `frontend/src/Components/TaskList.jsx`

**Line 30: State Update Triggers Re-render**
```jsx
setTasks(response.data.sort(...));  // ← State update = re-render
```

**Line 120-156: Tasks are rendered in UI**
```jsx
<div className="space-y-4">
  {tasks.length === 0 ? (
    <p>No tasks found. Create a new task above!</p>
  ) : (
    tasks.map((task) => (  // ← Line 124: Map through tasks array
      <div key={task.id}>
        <h3>{task.title}</h3>              // ← Line 142: Show title
        <p>{task.description}</p>          // ← Line 146: Show description
        <span>
          {task.isComplete ? 'Completed' : 'Pending'}  // ← Line 153: Show status
        </span>
      </div>
    ))
  )}
</div>
```

**🎯 What happens:**
1. `setTasks()` updates state (Line 30)
2. React detects state change
3. Component re-renders
4. `tasks.map()` loops through updated array (Line 124)
5. Each task is displayed in UI (Lines 142-153)
6. **User sees new task without page refresh!**

---

#### **🔄 BONUS: How TaskForm Notifies TaskList**

**File:** `frontend/src/Components/TaskForm.jsx`

**Line 41: After successful task creation**
```jsx
await apiClient.post(API_URL, newTask);
setTitle('');
setDescription('');
onTaskCreated();  // 🔥 Calls parent's function!
```

**File:** `frontend/src/Components/TaskList.jsx`

**Line 116: TaskForm receives fetchTasks as prop**
```jsx
<TaskForm onTaskCreated={fetchTasks} theme={theme} />
```

**What this does:**
- TaskList passes its `fetchTasks` function to TaskForm as `onTaskCreated` prop
- When task is created, TaskForm calls `onTaskCreated()`
- This triggers `fetchTasks()` in TaskList
- TaskList refreshes its own task list immediately
- This provides instant feedback even before SignalR broadcasts
- Other users will receive update via SignalR

---

### **📊 Complete Flow Summary with Line Numbers**

| Step | File | Lines | What Happens |
|------|------|-------|--------------|
| 1 | TaskForm.jsx | 55-62 | User types into controlled form inputs |
| 2a | TaskForm.jsx | 9-15 | `createApiClient()` adds JWT to headers |
| 2b | TaskForm.jsx | 37 | POST request sent to `/api/Tasks` |
| 3-5 | Backend | - | Server validates, saves, broadcasts |
| 6a | TaskList.jsx | 83-98 | SignalR connection built and started |
| 6b | TaskList.jsx | 93-95 | Listen for 'TaskReceived' event |
| 7 | TaskList.jsx | 95 | `fetchTasks()` called when event received |
| 8a | TaskList.jsx | 27 | GET request fetches all tasks |
| 8b | TaskList.jsx | 28-30 | `setTasks()` updates state |
| 8c | TaskList.jsx | 124-156 | UI re-renders with new data |

---

### **🎤 Interview Explanation**

**"Walk me through how a task is created and synchronized in real-time"**

**Answer:**
"When a user fills out the TaskForm and clicks submit, the `handleSubmit` function on line 26 is triggered. Line 37 makes a POST request using Axios to `/api/Tasks`, with the JWT token automatically included in the Authorization header via the `createApiClient` function on lines 9-15.

The backend validates the token, saves the task to PostgreSQL, and broadcasts a 'TaskReceived' event through SignalR. 

On the frontend, every TaskList component has an active SignalR connection established in a useEffect hook on lines 77-113. Line 93 listens for 'TaskReceived' events. When the event is received, line 95 calls `fetchTasks()`, which makes a GET request on line 27 to retrieve all tasks. Line 28-30 updates the tasks state with `setTasks()`, triggering a re-render. The `tasks.map()` on line 124 loops through the updated array and displays each task in the UI on lines 142-153.

The key is that ALL connected clients have this SignalR listener, so when one user creates a task, every other user's browser receives the event and automatically refreshes their task list. This happens without any page reload or manual refresh button."

**Backend (TasksController.cs):**
```csharp
[HttpPost]
public async Task<ActionResult<TaskItem>> PostTaskItem(CreateTaskDto taskDto)
{
    var taskItem = new TaskItem
    {
        Title = taskDto.Title,
        Description = taskDto.Description,
        IsComplete = false,
        CreatedAt = DateTime.UtcNow
    };

    _context.TaskItems.Add(taskItem);
    await _context.SaveChangesAsync();

    // 🔥 BROADCAST TO ALL CLIENTS!
    await _hubContext.Clients.All.SendAsync("TaskReceived", taskItem, "created");

    return CreatedAtAction(nameof(GetTaskItems), new { id = taskItem.Id }, taskItem);
}
```

**Frontend (TaskList.jsx):**
```jsx
useEffect(() => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build();

  // 🔥 LISTEN FOR BROADCASTS!
  connection.on('TaskReceived', (task, action) => {
    console.log(`Received ${action} for Task ${task.id}`);
    fetchTasks(); // Refresh list
  });

  connection.start();

  return () => connection.stop(); // Cleanup
}, [token]);
```

---

### 3. **Dark Mode Implementation**

**State Management (App.jsx):**
```jsx
const [theme, setTheme] = useState('light');

// Toggle function
const toggleTheme = () => {
  setTheme(prev => prev === 'light' ? 'dark' : 'light');
};

// Apply to DOM
useEffect(() => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]);
```

**UI Toggle Button:**
```jsx
<button onClick={toggleTheme}>
  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
</button>
```

**Conditional Styling:**
```jsx
// In App.jsx
const backgroundClasses = theme === 'dark' 
  ? 'bg-gray-950 text-gray-100' 
  : 'bg-gray-50 text-gray-800';

// In TaskList.jsx
const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';

// In TaskForm.jsx
const inputClasses = `w-full p-3 rounded-lg 
  ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'}
`;
```

**Tailwind Dark Mode:**
```jsx
// Tailwind applies dark: classes when 'dark' class is on html element
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-800 dark:text-gray-100">Title</h1>
</div>
```

---

### 4. **CRUD Operations**

#### **Create Task (TaskForm.jsx)**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const newTask = { title, description };

  try {
    await apiClient.post(API_URL, newTask);
    setTitle('');
    setDescription('');
    onTaskCreated(); // Refresh parent's task list
  } catch (err) {
    setError('Failed to create task.');
  } finally {
    setLoading(false);
  }
};
```

#### **Read Tasks (TaskList.jsx)**
```jsx
const fetchTasks = async () => {
  try {
    const response = await apiClient.get(API_URL);
    setTasks(response.data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
  } catch (err) {
    setError('Failed to fetch tasks.');
  }
};
```

#### **Update Task (TaskList.jsx)**
```jsx
const toggleTask = async (task) => {
  const updatedTask = {
    ...task,
    isComplete: !task.isComplete
  };

  try {
    await apiClient.put(`${API_URL}/${task.id}`, updatedTask);
    // SignalR will broadcast and trigger refresh
  } catch (err) {
    console.error('Error toggling task:', err);
  }
};
```

#### **Delete Task (TaskList.jsx)**
```jsx
const deleteTask = async (taskId) => {
  if (!window.confirm("Are you sure?")) return;
  
  try {
    await apiClient.delete(`${API_URL}/${taskId}`);
    // SignalR will broadcast and trigger refresh
  } catch (err) {
    console.error('Error deleting task:', err);
  }
};
```

---

## 💾 Database & Backend

### Database Schema

**TaskItems Table:**
```sql
CREATE TABLE TaskItems (
    Id SERIAL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    IsComplete BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DueDate TIMESTAMP NULL
);
```

**Identity Tables (ASP.NET Identity):**
- AspNetUsers - User accounts
- AspNetRoles - User roles
- AspNetUserTokens - JWT tokens
- And more...

### Entity Framework Model (TaskItem.cs)
```csharp
public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsComplete { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
}
```

### API Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/Auth/register` | Create new user | ❌ |
| POST | `/api/Auth/login` | Login & get JWT | ❌ |
| GET | `/api/Tasks` | Get all tasks | ✅ |
| POST | `/api/Tasks` | Create task | ✅ |
| PUT | `/api/Tasks/{id}` | Update task | ✅ |
| DELETE | `/api/Tasks/{id}` | Delete task | ✅ |

**WebSocket:**
- `/taskhub` - SignalR hub for real-time updates

---

## 🎤 Interview Talking Points

### **Project Overview (30 seconds)**
"I built REAP, a real-time collaborative task management application. It features user authentication with JWT tokens, full CRUD operations on tasks, and real-time synchronization using SignalR WebSockets. When one user creates, updates, or deletes a task, all other connected users see the changes instantly without refreshing. I used React 19 for the frontend with Tailwind CSS for styling, and ASP.NET Core 9 for the backend with PostgreSQL database."

### **Technical Highlights**
1. **Real-Time Collaboration**: "Implemented WebSocket communication using SignalR to broadcast task changes to all connected clients instantly."

2. **State Management**: "Used React Hooks (useState, useEffect) to manage component state, including authentication tokens, theme preferences, and task data."

3. **Component Architecture**: "Built a component-based architecture with clear separation of concerns - App for layout and auth state, AuthForm for login/register, TaskList for data fetching and real-time updates, and TaskForm for task creation."

4. **Authentication**: "Implemented JWT-based authentication with ASP.NET Identity. Tokens are stored in localStorage and included in API request headers."

5. **User Experience**: "Added loading states, error handling, and a dark mode toggle for better UX. All forms use controlled components for predictable state management."

### **Challenges Overcome**
1. **SignalR Cleanup**: "Initially had memory leaks from WebSocket connections. Fixed by implementing proper cleanup functions in useEffect."

2. **State Synchronization**: "Ensured task list updates correctly after CRUD operations by calling fetchTasks after SignalR events."

3. **Authentication Flow**: "Implemented persistent authentication by storing tokens in localStorage and checking on app load."

### **What You Learned**
- "Deepened understanding of React Hooks, especially useEffect for side effects and cleanup."
- "Learned WebSocket technology and real-time communication patterns."
- "Gained experience with JWT authentication and secure API design."
- "Practiced building RESTful APIs with .NET Core and Entity Framework."

### **Future Improvements**
- "Add task assignment to specific users"
- "Implement task categories and filters"
- "Add real-time notifications"
- "Implement optimistic updates for better UX"
- "Add unit and integration tests"

---

## ❓ Common Questions & Answers

### **1. Explain the data flow in your application**
**Answer:** "Data flows unidirectionally from parent to child via props. When a child needs to update parent state, it calls a callback function passed as a prop. For example, when AuthForm successfully logs in a user, it calls the onAuthSuccess prop function, which updates the token state in App component. This triggers a re-render showing TaskList instead of AuthForm. For task data, TaskList fetches from the API and stores in state, then passes the theme prop down to TaskForm. SignalR adds another layer where server pushes updates to all clients, but the React data flow remains unidirectional."

### **2. Why use useEffect for API calls?**
**Answer:** "useEffect is necessary because API calls are side effects that should happen at specific times, not on every render. Without useEffect, calling fetchTasks directly in the component body would create an infinite loop: fetch updates state, state change triggers re-render, re-render calls fetch again, and so on. By using useEffect with an empty dependency array, the fetch happens only once when the component mounts."

### **3. How does real-time sync work?**
**Answer:** "When a user performs a CRUD operation, the React frontend makes a REST API call to the .NET backend. After the database is updated, the backend uses SignalR's IHubContext to broadcast an event to all connected clients via the TaskHub. On the frontend, each TaskList component has a SignalR connection that listens for 'TaskReceived' events. When received, it triggers fetchTasks to get the latest data. This way, all users see updates in real-time without polling or manual refresh."

### **4. What are the advantages of using props?**
**Answer:** "Props make components reusable and maintainable. TaskForm doesn't know or care whether it's being used for event planning or a to-do list—it just accepts props and renders accordingly. Props also enforce unidirectional data flow, making the app easier to debug because you can trace data from parent to child. Finally, props enable component composition, where complex UIs are built from simple, reusable pieces."

### **5. Why use controlled components for forms?**
**Answer:** "Controlled components make React state the single source of truth for form data. This gives us full control to validate input in real-time, disable buttons based on form state, clear fields after submission, and prevent invalid submissions. In AuthForm, I can show error messages, disable the submit button while loading, and clear the password field after submission—all because the input values are controlled by React state."

### **6. How do you handle authentication?**
**Answer:** "I use JWT bearer token authentication. When a user logs in via AuthForm, the backend validates credentials using ASP.NET Identity and returns a JWT token. This token is stored in localStorage for persistence and in App component's state for immediate use. All subsequent API calls include this token in the Authorization header using an Axios instance I created with createApiClient. The backend validates this token on protected routes using the [Authorize] attribute. If the user logs out, I clear both localStorage and state, which triggers a re-render showing the login form."

### **7. Explain your component hierarchy**
**Answer:** "App is the root component that manages authentication and theme state. Based on whether a token exists, it conditionally renders either AuthForm or TaskList. AuthForm is a presentation component that handles login/register and communicates back via the onAuthSuccess callback. TaskList is a container component that fetches tasks, manages SignalR connection, and renders TaskForm. TaskForm is a pure presentation component for creating tasks. This hierarchy follows the container/presentation pattern where smart components handle logic and dumb components handle UI."

### **8. What happens when theme changes?**
**Answer:** "When the user clicks the theme toggle button, it calls setTheme which updates the theme state in App. This triggers a useEffect that applies or removes the 'dark' class on the HTML element. The state change also causes App to re-render, passing the new theme value to child components via props. Children like TaskList and TaskForm receive the updated theme prop and re-render with appropriate dark mode classes. Tailwind CSS uses the dark: variant to apply different styles when the 'dark' class is present."

### **9. How do you prevent memory leaks?**
**Answer:** "The most important cleanup is in the SignalR useEffect. I return a cleanup function that stops the WebSocket connection when the component unmounts or before the effect re-runs. Without this, changing pages or logging out would leave zombie connections running. I also clear timeouts and intervals if I had any, and cancel pending API requests if the component unmounts before they complete. The pattern is: set something up in useEffect, return a function that tears it down."

### **10. Why did you choose React over other frameworks?**
**Answer:** "React has a huge ecosystem, excellent documentation, and strong community support. The component-based architecture makes complex UIs manageable by breaking them into smaller, reusable pieces. React Hooks like useState and useEffect make state management intuitive without the complexity of class components. The virtual DOM provides good performance, and the unidirectional data flow makes debugging easier. For this project, React's real-time updating capabilities pair well with SignalR, and the large number of libraries like Axios and Tailwind integrate seamlessly."

---

## 📝 Quick Reference Card

### React Hooks
```jsx
// State
const [value, setValue] = useState(initial);

// Effects
useEffect(() => { /* code */ }, []); // Once
useEffect(() => { /* code */ }, [dep]); // When dep changes
useEffect(() => {
  return () => { /* cleanup */ };
}, []);
```

### Props
```jsx
// Parent
<Child data={data} onClick={handler} />

// Child
const Child = ({ data, onClick }) => {
  return <button onClick={onClick}>{data}</button>;
};
```

### Events
```jsx
onClick={handler}
onChange={(e) => setValue(e.target.value)}
onSubmit={(e) => { e.preventDefault(); }}
```

### Conditional Rendering
```jsx
{condition && <Component />}
{condition ? <ComponentA /> : <ComponentB />}
if (loading) return <Spinner />;
```

### Lists
```jsx
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}
```

### API Calls
```jsx
const response = await axios.get(url);
const response = await axios.post(url, data);
const response = await axios.put(url, data);
const response = await axios.delete(url);
```

---

## � Object-Oriented Programming (OOP) in This Project

### **Interview Question: "How did you use OOP in this project?"**

---

### **📝 Complete Answer:**

"I extensively used Object-Oriented Programming principles throughout this project, particularly on the backend with C# and .NET Core. Let me break down the four pillars of OOP and how I applied each one:

---

### **1. ENCAPSULATION** 🔒

**Definition:** Bundling data (properties) and methods that operate on that data within a single unit (class), while hiding internal implementation details.

#### **Examples from My Project:**

**Example 1: TaskItem Model Class**
```csharp
// File: Models/TaskItem.cs
public class TaskItem
{
    public int Id { get; set; }                    // Property with getter/setter
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsComplete { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
}
```

**What I did:**
- Encapsulated task data into a single `TaskItem` class
- Used properties with automatic getters/setters for controlled access
- Default values protect against null reference errors
- The class represents a real-world entity (a task) with its attributes

**Interview explanation:**
"I created the TaskItem class to encapsulate all task-related data. Instead of passing around six separate variables, I bundle them into one object. The properties use automatic getters and setters, providing controlled access to the data while hiding implementation details."

---

**Example 2: Controller Classes with Private Fields**
```csharp
// File: Controllers/TasksController.cs
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;        // Private field - Encapsulation!
    private readonly IHubContext<TaskHub> _hubContext;

    public TasksController(AppDbContext context, IHubContext<TaskHub> hubContext)
    {
        _context = context;        // Data is encapsulated
        _hubContext = hubContext;  // Only accessible within this class
    }

    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTaskItems()
    {
        return await _context.TaskItems.ToListAsync(); // Using encapsulated field
    }
}
```

**What I did:**
- Made database context and SignalR hub private fields
- Only this controller can access these dependencies
- External code can't directly manipulate the database
- Public methods provide controlled access to functionality

**Interview explanation:**
"The TasksController encapsulates the database context and SignalR hub as private fields. This prevents external code from directly accessing the database. All database operations go through the controller's public methods, giving me full control over validation and business logic."

---

**Example 3: Data Transfer Objects (DTOs)**
```csharp
// File: DTOs/CreateTaskDto.cs
public class CreateTaskDto
{
    [Required]
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
}

// File: DTOs/UpdateTaskDto.cs
public class UpdateTaskDto
{
    [Required]
    public int Id { get; set; }
    [Required]
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Required]
    public bool IsComplete { get; set; }
    public DateTime? DueDate { get; set; }
}
```

**What I did:**
- Created separate DTO classes for different operations
- Encapsulated only the data needed for each operation
- CreateTaskDto doesn't include Id (auto-generated)
- UpdateTaskDto requires Id and IsComplete
- Protects the database model from over-posting attacks

**Interview explanation:**
"I use DTOs to encapsulate data transfer between frontend and backend. CreateTaskDto only accepts the fields needed to create a task—no Id or IsComplete. This prevents clients from manipulating fields they shouldn't. It's a security practice called 'preventing over-posting attacks.'"

---

### **2. INHERITANCE** 🌳

**Definition:** Creating new classes based on existing classes, inheriting their properties and methods.

#### **Examples from My Project:**

**Example 1: Controller Inheritance**
```csharp
// File: Controllers/TasksController.cs
public class TasksController : ControllerBase  // ← Inherits from ControllerBase
{
    // Inherits methods like: Ok(), NotFound(), BadRequest(), etc.
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTaskItems()
    {
        if (_context.TaskItems == null)
        {
            return NotFound();  // ← Method inherited from ControllerBase
        }
        return await _context.TaskItems.ToListAsync();
    }
    
    [HttpPost]
    public async Task<ActionResult<TaskItem>> PostTaskItem(CreateTaskDto taskDto)
    {
        // ... create task logic
        return CreatedAtAction(nameof(GetTaskItems), new { id = taskItem.Id }, taskItem);
        // ← CreatedAtAction is inherited from ControllerBase
    }
}

// File: Controllers/AuthController.cs
public class AuthController : ControllerBase  // ← Also inherits from ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        // ... login logic
        return Ok(new { token, expiration });      // ← Inherited method
        return Unauthorized();                      // ← Inherited method
    }
}
```

**What I did:**
- Both controllers inherit from `ControllerBase`
- Get HTTP-related methods: `Ok()`, `NotFound()`, `BadRequest()`, `Unauthorized()`, etc.
- Get routing and model binding capabilities
- Don't need to rewrite common API functionality

**Interview explanation:**
"Both my TasksController and AuthController inherit from ControllerBase, which is part of ASP.NET Core MVC. This gives me access to all HTTP response methods like Ok(), NotFound(), and BadRequest() without writing them myself. It's a perfect example of code reuse through inheritance."

---

**Example 2: DbContext Inheritance**
```csharp
// File: Data/AppDbContext.cs
public class AppDbContext : IdentityDbContext<IdentityUser>  // ← Inheritance
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)  // ← Calling parent constructor
    {
    }

    public DbSet<TaskItem> TaskItems { get; set; }
}
```

**What I did:**
- Inherit from `IdentityDbContext<IdentityUser>`
- Get all ASP.NET Identity tables (Users, Roles, etc.) automatically
- Add my custom `TaskItems` table
- Don't need to manually create user authentication tables

**Interview explanation:**
"My AppDbContext inherits from IdentityDbContext, which provides all the database tables needed for user authentication—AspNetUsers, AspNetRoles, AspNetUserTokens, etc. I just add my custom TaskItems table on top. This saved me from implementing authentication infrastructure from scratch."

---

**Example 3: SignalR Hub Inheritance**
```csharp
// File: Hubs/TaskHub.cs
public class TaskHub : Hub  // ← Inherits from SignalR's Hub class
{
    // Inherits: Clients, Groups, Context properties
    // Inherits: OnConnectedAsync(), OnDisconnectedAsync() methods
    
    public async Task SendTaskUpdate(TaskItem task, string action)
    {
        await Clients.All.SendAsync("TaskReceived", task, action);
        // ← Clients property is inherited from Hub
    }
}
```

**What I did:**
- Inherit from SignalR's `Hub` base class
- Get WebSocket connection management automatically
- Get access to `Clients`, `Groups`, `Context` properties
- Override lifecycle methods if needed

**Interview explanation:**
"TaskHub inherits from SignalR's Hub class, which handles all the WebSocket connection management. I don't need to write code for client connections, disconnections, or message routing—it's all inherited. I just define my custom method SendTaskUpdate to broadcast messages."

---

### **3. POLYMORPHISM** 🎭

**Definition:** The ability of different classes to be treated as instances of the same class through a common interface, with each class providing its own implementation.

#### **Examples from My Project:**

**Example 1: Async Task<T> Return Types**
```csharp
// File: Controllers/TasksController.cs
public class TasksController : ControllerBase
{
    // Different return types, all treated as ActionResult
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTaskItems()
    {
        return await _context.TaskItems.ToListAsync();
        // Returns: 200 OK with task list
    }

    [HttpPost]
    public async Task<ActionResult<TaskItem>> PostTaskItem(CreateTaskDto taskDto)
    {
        return CreatedAtAction(nameof(GetTaskItems), new { id = taskItem.Id }, taskItem);
        // Returns: 201 Created with single task
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutTaskItem(int id, UpdateTaskDto taskDto)
    {
        return NoContent();  // Returns: 204 No Content
        return NotFound();   // Returns: 404 Not Found
        return BadRequest(); // Returns: 400 Bad Request
    }
}
```

**What I did:**
- Different methods return different HTTP status codes
- All are treated as `IActionResult` or `ActionResult<T>`
- Same interface, different implementations
- ASP.NET Core handles serialization polymorphically

**Interview explanation:**
"My controller methods demonstrate polymorphism through ActionResult. A GET request returns Ok() with data, a POST returns CreatedAtAction(), a PUT returns NoContent() or NotFound(). They're all IActionResult types, but behave differently. The framework handles the appropriate HTTP response based on the actual type returned."

---

**Example 2: Interface Implementation (Dependency Injection)**
```csharp
// File: Controllers/TasksController.cs
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;              // ← DbContext
    private readonly IHubContext<TaskHub> _hubContext;   // ← IHubContext interface

    public TasksController(AppDbContext context, IHubContext<TaskHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;  // ← Can be any implementation of IHubContext
    }
}

// File: Controllers/AuthController.cs  
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;  // ← UserManager class
    private readonly IConfiguration _configuration;            // ← IConfiguration interface

    public AuthController(UserManager<IdentityUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;      // ← Concrete implementation
        _configuration = configuration;  // ← Can be any IConfiguration implementation
    }
}
```

**What I did:**
- Controllers depend on interfaces, not concrete implementations
- `IHubContext<TaskHub>` could be replaced with a different implementation
- `IConfiguration` could read from files, environment variables, or Azure Key Vault
- Makes code testable and flexible

**Interview explanation:**
"I use dependency injection with interfaces, which is polymorphism in action. My controllers depend on IHubContext and IConfiguration interfaces, not concrete classes. During testing, I could inject mock implementations. In production, .NET injects the real implementations. Same interface, different behaviors—that's polymorphism."

---

**Example 3: LINQ Query Methods (Polymorphic Operations)**
```csharp
// File: Controllers/TasksController.cs
var tasks = await _context.TaskItems.ToListAsync();          // → List<TaskItem>
var task = await _context.TaskItems.FindAsync(id);           // → TaskItem
var exists = _context.TaskItems.Any(e => e.Id == id);       // → bool
var sorted = tasks.Sort((a, b) => a.CreatedAt.CompareTo(b.CreatedAt)); // → void
```

**What I did:**
- Same `TaskItems` collection, different operations
- Each LINQ method has polymorphic behavior
- Works on any `IEnumerable<T>` or `IQueryable<T>`

**Interview explanation:**
"LINQ demonstrates polymorphism beautifully. The same TaskItems collection can be queried with ToListAsync(), FindAsync(), Any(), or sorted with different comparers. Each method operates on the same collection but produces different results based on the operation."

---

### **4. ABSTRACTION** 🎨

**Definition:** Hiding complex implementation details and showing only the necessary features. Focus on WHAT something does, not HOW it does it.

#### **Examples from My Project:**

**Example 1: Repository Pattern Abstraction (DbContext)**
```csharp
// File: Controllers/TasksController.cs
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    // Abstract database operations - Don't need to know SQL!
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTaskItems()
    {
        // WHAT: Get all tasks
        // HOW: Entity Framework handles SQL query generation
        return await _context.TaskItems.ToListAsync();
        // Abstracted: SELECT * FROM TaskItems
    }

    public async Task<ActionResult<TaskItem>> PostTaskItem(CreateTaskDto taskDto)
    {
        var taskItem = new TaskItem { /* ... */ };
        
        // WHAT: Add task to database
        // HOW: EF generates INSERT statement
        _context.TaskItems.Add(taskItem);
        await _context.SaveChangesAsync();
        // Abstracted: INSERT INTO TaskItems VALUES (...)
    }

    public async Task<IActionResult> DeleteTaskItem(int id)
    {
        var task = await _context.TaskItems.FindAsync(id);
        
        // WHAT: Remove task from database
        // HOW: EF generates DELETE statement
        _context.TaskItems.Remove(task);
        await _context.SaveChangesAsync();
        // Abstracted: DELETE FROM TaskItems WHERE Id = @id
    }
}
```

**What I did:**
- Use Entity Framework Core as abstraction layer
- Write C# code instead of SQL
- Database type (PostgreSQL) is abstracted away
- Could switch to SQL Server or MySQL without changing controller code

**Interview explanation:**
"Entity Framework Core provides abstraction over database operations. I call ToListAsync(), Add(), or Remove() without writing SQL. The ORM translates my C# code into database-specific queries. If I switched from PostgreSQL to SQL Server, my controller code wouldn't change—that's the power of abstraction."

---

**Example 2: SignalR Hub Abstraction**
```csharp
// File: Controllers/TasksController.cs
[HttpPost]
public async Task<ActionResult<TaskItem>> PostTaskItem(CreateTaskDto taskDto)
{
    // ... save task to database
    
    // WHAT: Broadcast message to all clients
    // HOW: SignalR handles WebSocket connections, serialization, etc.
    await _hubContext.Clients.All.SendAsync("TaskReceived", taskItem, "created");
    
    // Abstracted away:
    // - WebSocket connection management
    // - Message serialization
    // - Client tracking
    // - Network protocols
}
```

**What I did:**
- Use SignalR's abstraction over WebSocket complexity
- Call `Clients.All.SendAsync()` - simple interface
- Don't manage individual WebSocket connections
- Don't handle serialization or network protocols

**Interview explanation:**
"SignalR abstracts away WebSocket complexity. I just call SendAsync() to broadcast messages. Behind the scenes, SignalR manages hundreds of active connections, serializes data, handles reconnections, and chooses the best transport protocol. I focus on WHAT to send, not HOW to send it."

---

**Example 3: Authentication Abstraction**
```csharp
// File: Controllers/AuthController.cs
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] LoginDto model)
    {
        // WHAT: Create a user
        // HOW: Identity handles password hashing, validation, storage
        var result = await _userManager.CreateAsync(user, model.Password);
        
        // Abstracted:
        // - Password hashing (bcrypt/PBKDF2)
        // - Security stamp generation
        // - Database table management
        // - Validation rules
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        // WHAT: Verify password
        // HOW: Identity compares hashed passwords
        var isValid = await _userManager.CheckPasswordAsync(user, model.Password);
        
        // Abstracted: Hash comparison, timing attack prevention
    }
}
```

**What I did:**
- Use ASP.NET Identity's abstraction for user management
- Call high-level methods like `CreateAsync()` and `CheckPasswordAsync()`
- Identity handles password hashing, salt generation, validation
- Don't implement cryptography myself

**Interview explanation:**
"ASP.NET Identity provides abstraction over user authentication. When I call CreateAsync(), it hashes the password using industry-standard algorithms, generates security stamps, and stores everything securely. I don't need to implement password hashing or manage cryptographic details—Identity abstracts all of that."

---

**Example 4: HTTP Abstraction (Controller Actions)**
```csharp
// File: Controllers/TasksController.cs
[Authorize]  // ← Abstraction: Authentication handled automatically
[Route("api/[controller]")]  // ← Abstraction: URL routing
[ApiController]  // ← Abstraction: Model validation, error handling
public class TasksController : ControllerBase
{
    [HttpGet]  // ← Abstraction: HTTP method routing
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTaskItems()
    {
        // Abstracted away:
        // - HTTP request parsing
        // - Authorization token validation
        // - Response serialization (JSON)
        // - Status code setting
        return await _context.TaskItems.ToListAsync();
    }
}
```

**What I did:**
- Use attributes for routing, authentication, validation
- Framework abstracts HTTP protocol handling
- Don't parse HTTP headers manually
- Don't serialize JSON responses manually

**Interview explanation:**
"ASP.NET Core abstracts the entire HTTP pipeline. I use attributes like [HttpGet] and [Authorize] to declare behavior. The framework handles request parsing, JWT validation, routing, model binding, and JSON serialization. I focus on business logic, not HTTP protocol details."

---

### **🎯 Additional OOP Concepts I Used:**

#### **5. SOLID Principles**

**Single Responsibility Principle:**
- Each class has one job: `TaskItem` models data, `TasksController` handles HTTP requests, `TaskHub` manages WebSocket broadcasts
- DTOs are separate from models (separation of concerns)

**Dependency Inversion Principle:**
- Controllers depend on abstractions (`IHubContext`, `IConfiguration`) not concrete implementations
- Makes code testable and flexible

**Open/Closed Principle:**
- Can extend functionality by creating new controllers without modifying existing ones
- Can add new DTO types without changing models

---

#### **6. Design Patterns**

**Repository Pattern:**
- `AppDbContext` acts as a repository for data access
- Abstracts database operations

**DTO Pattern:**
- `CreateTaskDto`, `UpdateTaskDto`, `LoginDto` separate API contracts from domain models
- Prevents over-posting attacks

**Dependency Injection Pattern:**
- All dependencies injected through constructors
- Promotes loose coupling and testability

---

### **📊 OOP Concepts Summary Table**

| OOP Principle | Where Used | Example File |
|---------------|------------|--------------|
| **Encapsulation** | TaskItem class, private fields in controllers | `Models/TaskItem.cs` |
| **Encapsulation** | DTOs with validation attributes | `DTOs/CreateTaskDto.cs` |
| **Inheritance** | Controllers inheriting from ControllerBase | `Controllers/TasksController.cs` |
| **Inheritance** | AppDbContext inheriting from IdentityDbContext | `Data/AppDbContext.cs` |
| **Inheritance** | TaskHub inheriting from Hub | `Hubs/TaskHub.cs` |
| **Polymorphism** | Different ActionResult return types | `Controllers/TasksController.cs` |
| **Polymorphism** | Interface-based dependency injection | All Controllers |
| **Abstraction** | Entity Framework Core (no SQL) | `Controllers/TasksController.cs` |
| **Abstraction** | SignalR WebSocket management | `Hubs/TaskHub.cs` |
| **Abstraction** | ASP.NET Identity authentication | `Controllers/AuthController.cs` |

---

### **🎤 Quick Interview Answer (30 seconds)**

"I used all four OOP pillars extensively. For **encapsulation**, I created model classes like TaskItem and DTOs to bundle related data with controlled access through properties. For **inheritance**, my controllers inherit from ControllerBase and my DbContext inherits from IdentityDbContext, gaining their functionality. For **polymorphism**, I use interfaces like IHubContext and IConfiguration for dependency injection, allowing different implementations. For **abstraction**, I leverage Entity Framework to abstract database operations and SignalR to abstract WebSocket complexity, so I focus on business logic rather than implementation details."

---

## �🎓 Study Tips

1. **Practice explaining** each concept without looking at notes
2. **Draw diagrams** of component hierarchy and data flow
3. **Walk through** a complete feature from user action to UI update
4. **Prepare examples** from your project for each concept
5. **Understand the "why"** not just the "what"

---

## ✨ Final Thoughts

This project demonstrates:
- ✅ Strong understanding of React fundamentals
- ✅ Ability to integrate frontend with backend APIs
- ✅ Knowledge of real-time communication patterns
- ✅ Security best practices (JWT authentication)
- ✅ Modern development tools and workflows

**Good luck with your interview!** 🚀

Remember: Confidence comes from understanding. Know your project inside and out, and you'll do great!
