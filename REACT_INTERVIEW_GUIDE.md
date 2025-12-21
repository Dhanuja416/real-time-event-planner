# React Interview Preparation Guide 🚀
## Real-Time Event Planner Project

---

## Table of Contents
1. [What is React?](#what-is-react)
2. [useState Hook](#usestate-hook)
3. [useEffect Hook](#useeffect-hook)
4. [Props (Properties)](#props-properties)
5. [Event Handling](#event-handling)
6. [Conditional Rendering](#conditional-rendering)
7. [Component Structure](#component-structure)
8. [Forms in React](#forms-in-react)
9. [API Calls with Axios](#api-calls-with-axios)
10. [Real-Time Communication (SignalR)](#real-time-communication-signalr)
11. [Common Interview Questions](#common-interview-questions)

---

## What is React?

**React** is a JavaScript library for building user interfaces, particularly single-page applications. It allows you to create reusable UI components.

### Key Concepts:
- **Component-Based**: UI is broken down into reusable components
- **Declarative**: You describe what the UI should look like, React handles the updates
- **Virtual DOM**: React uses a virtual representation of the DOM for efficient updates

### In Our Project:
We have 4 main components:
- `App.jsx` - Main container component
- `AuthForm.jsx` - Handles login/registration
- `TaskForm.jsx` - Creates new tasks
- `TaskList.jsx` - Displays and manages tasks

---

## useState Hook

### What is useState?
`useState` is a React Hook that lets you add state (data that can change) to functional components.

### Syntax:
```javascript
const [stateVariable, setStateFunction] = useState(initialValue);
```

### Examples from Our Project:

#### 1. **Theme Management in App.jsx**
```javascript
const [theme, setTheme] = useState('light');

const toggleTheme = () => {
  setTheme(prev => prev === 'light' ? 'dark' : 'light');
};
```
**What it does:** 
- Stores the current theme ('light' or 'dark')
- `setTheme` updates the theme
- `prev =>` is an updater function that gets the previous state value

#### 2. **Authentication Token in App.jsx**
```javascript
const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
```
**What it does:**
- Stores the JWT authentication token
- Initializes from localStorage if available, otherwise `null`
- When token exists, user is logged in

#### 3. **Form Fields in AuthForm.jsx**
```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isLogin, setIsLogin] = useState(true);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState(null);
```
**What it does:**
- `email` & `password`: Store user input
- `isLogin`: Toggles between login/register forms
- `loading`: Shows loading state during API calls
- `message`: Displays success/error messages

#### 4. **Task List in TaskList.jsx**
```javascript
const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```
**What it does:**
- `tasks`: Array of all task objects
- `loading`: Shows loading spinner
- `error`: Stores error messages

### Interview Tip:
**Q: Why can't we directly modify state?**
**A:** React needs to know when state changes to re-render components. Direct modification doesn't trigger re-renders. Always use the setter function (`setState`).

```javascript
// ❌ WRONG - This won't trigger re-render
tasks.push(newTask);

// ✅ CORRECT - This triggers re-render
setTasks([...tasks, newTask]);
```

---

## useEffect Hook

### What is useEffect?
`useEffect` is a Hook that lets you perform side effects in functional components (like API calls, subscriptions, timers, etc.).

### Syntax:
```javascript
useEffect(() => {
  // Code to run
  
  return () => {
    // Cleanup code (optional)
  };
}, [dependencies]);
```

### Examples from Our Project:

#### 1. **Theme Application in App.jsx**
```javascript
useEffect(() => {
  // Apply the theme class to the document body
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]);
```
**What it does:**
- Runs whenever `theme` changes (dependency array: `[theme]`)
- Adds/removes 'dark' class from HTML element
- Updates the entire page's theme

**Interview Explanation:**
"This effect watches the `theme` state. When theme changes, it applies the 'dark' class to enable dark mode styling."

#### 2. **Initial Data Load in TaskList.jsx**
```javascript
useEffect(() => {
  if (token) {
    fetchTasks();
  }
}, [token]);
```
**What it does:**
- Runs when component mounts and when `token` changes
- Fetches tasks only if user is authenticated
- `[token]` means: "re-run this effect whenever token changes"

**Interview Explanation:**
"This effect runs on component mount and whenever the authentication token changes. It ensures we load tasks when user logs in."

#### 3. **SignalR Real-Time Connection in TaskList.jsx**
```javascript
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
        console.log(`SignalR: Received ${action} for Task ${task.id}`);
        fetchTasks(); 
      });

      await connection.start();
      console.log('SignalR Connected.');
    } catch (err) {
      console.error('SignalR Connection Error:', err);
    }
  };

  startSignalR();

  // CLEANUP FUNCTION
  return () => {
    if (connection) {
      connection.stop();
      console.log('SignalR Disconnected.');
    }
  };
}, [token]);
```
**What it does:**
- Sets up WebSocket connection for real-time updates
- Listens for task changes from server
- **Cleanup function** disconnects when component unmounts
- Dependency `[token]` ensures connection uses current token

**Interview Explanation:**
"This effect establishes a SignalR WebSocket connection for real-time task updates. The cleanup function is crucial - it disconnects the WebSocket when the component unmounts or token changes, preventing memory leaks."

### Dependency Array Explained:

| Dependency Array | When Effect Runs |
|-----------------|------------------|
| `[]` | Only once on mount |
| `[theme]` | On mount + when `theme` changes |
| `[token, tasks]` | On mount + when `token` OR `tasks` change |
| No array | After every render (rarely needed) |

---

## Props (Properties)

### What are Props?
Props are arguments passed from parent to child components. They allow data to flow down the component tree.

### Key Rules:
- Props are **read-only** (immutable)
- Data flows **one-way**: Parent → Child
- To send data back up, pass **callback functions** as props

### Examples from Our Project:

#### 1. **Passing Token and Theme in App.jsx**
```javascript
// In App.jsx (Parent)
<TaskList token={token} theme={theme} />
<AuthForm onAuthSuccess={handleLogin} theme={theme} />
```

```javascript
// In TaskList.jsx (Child)
const TaskList = ({ token, theme }) => {
  // Now we can use token and theme here
  const apiClient = createApiClient(token);
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  
  return (
    <div className={cardBg}>
      {/* Component content */}
    </div>
  );
};
```

**What it does:**
- `App.jsx` sends `token` and `theme` to `TaskList`
- `TaskList` uses them for API calls and styling
- Props are destructured: `({ token, theme })`

#### 2. **Callback Function Props in AuthForm.jsx**
```javascript
// In App.jsx (Parent)
const handleLogin = (newToken) => {
  setToken(newToken);
};

<AuthForm onAuthSuccess={handleLogin} theme={theme} />
```

```javascript
// In AuthForm.jsx (Child)
const AuthForm = ({ onAuthSuccess, theme }) => {
  
  const handleSubmit = async (e) => {
    // ... login logic
    const token = response.data.token;
    localStorage.setItem('jwtToken', token);
    
    // Call parent function to update state in App.jsx
    onAuthSuccess(token);
  };
  
  // ...
};
```

**What it does:**
- Parent defines `handleLogin` function
- Passes it as `onAuthSuccess` prop
- Child calls it to send data back up
- This updates state in parent component

**Interview Explanation:**
"Props allow parent components to pass data down. For child-to-parent communication, we pass callback functions as props. Here, AuthForm calls `onAuthSuccess` to notify App.jsx that login succeeded."

#### 3. **Passing Props Down Multiple Levels**
```javascript
// App.jsx → TaskList → TaskForm
<TaskList token={token} theme={theme} />

// Inside TaskList.jsx
<TaskForm onTaskCreated={fetchTasks} theme={theme} />

// Inside TaskForm.jsx
const TaskForm = ({ onTaskCreated, theme }) => {
  const headerColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  // ...
};
```

**What it does:**
- `theme` flows: App → TaskList → TaskForm
- Each component passes it down further
- This is called "prop drilling"

---

## Event Handling

### What is Event Handling?
React handles user interactions (clicks, typing, form submissions) through event handlers.

### Examples from Our Project:

#### 1. **onClick Events**
```javascript
// Toggle theme button in App.jsx
<button onClick={toggleTheme}>
  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
</button>

// Logout button
<button onClick={handleLogout}>
  <span>Logout</span>
</button>

// Toggle task in TaskList.jsx
<input 
  type="checkbox"
  checked={task.isComplete}
  onChange={() => toggleTask(task)} 
/>
```

#### 2. **onChange Events for Controlled Inputs**
```javascript
// In AuthForm.jsx
<input 
  type="email" 
  value={email} 
  onChange={(e) => setEmail(e.target.value)} 
  required 
/>

<input 
  type="password" 
  value={password} 
  onChange={(e) => setPassword(e.target.value)} 
  required 
/>
```
**What it does:**
- `value={email}` makes it a controlled component
- `onChange` updates state on every keystroke
- React state is the "single source of truth"

#### 3. **onSubmit Event**
```javascript
// In AuthForm.jsx
const handleSubmit = async (e) => {
  e.preventDefault(); // Prevents page reload
  setLoading(true);
  
  // API call logic...
};

<form onSubmit={handleSubmit}>
  {/* form fields */}
</form>
```

**Interview Tip:**
**Q: Why use `e.preventDefault()`?**
**A:** By default, form submission reloads the page. `preventDefault()` stops this, allowing us to handle submission with JavaScript (like making an API call).

---

## Conditional Rendering

### What is Conditional Rendering?
Showing different UI based on conditions (state values, props, etc.).

### Examples from Our Project:

#### 1. **Ternary Operator (? :)**
```javascript
// In App.jsx - Show login or tasks
{token ? (
  <TaskList token={token} theme={theme} />
) : (
  <AuthForm onAuthSuccess={handleLogin} theme={theme} />
)}

// Theme icon toggle
{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}

// Login vs Register button text
{loading ? 'Processing...' : isLogin ? 'Log In' : 'Register'}
```

#### 2. **Logical && Operator**
```javascript
// Show logout button only if logged in
{token && (
  <button onClick={handleLogout}>
    <LogOut size={16} />
    <span>Logout</span>
  </button>
)}

// Show error message only if exists
{message && (
  <div className={messageClasses}>
    {message}
  </div>
)}
```

**How it works:** `condition && <Component />` renders Component only if condition is true.

#### 3. **Loading & Error States**
```javascript
// In TaskList.jsx
if (loading) return <p>Loading tasks...</p>;
if (error) return <p>{error}</p>;

// Main render after checks pass
return (
  <div>
    {/* Task list UI */}
  </div>
);
```

#### 4. **Empty State**
```javascript
{tasks.length === 0 ? (
  <p>No tasks found. Create a new task above!</p>
) : (
  tasks.map((task) => (
    <div key={task.id}>
      {/* Task UI */}
    </div>
  ))
)}
```

---

## Component Structure

### Functional Components
Modern React uses functional components with Hooks (not class components).

### Basic Structure:
```javascript
import React, { useState, useEffect } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  // 1. State declarations
  const [state, setState] = useState(initialValue);
  
  // 2. Functions
  const handleSomething = () => {
    // logic
  };
  
  // 3. useEffect for side effects
  useEffect(() => {
    // side effect logic
  }, [dependencies]);
  
  // 4. Return JSX
  return (
    <div>
      {/* UI elements */}
    </div>
  );
};

export default ComponentName;
```

### Example from TaskForm.jsx:
```javascript
import React, { useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

const TaskForm = ({ onTaskCreated, theme }) => {
  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Functions
  const handleSubmit = async (e) => {
    e.preventDefault();
    // API call logic...
  };
  
  // JSX Return
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
      />
      <button type="submit">
        {loading ? 'Adding...' : <Plus size={20} />}
      </button>
    </form>
  );
};

export default TaskForm;
```

---

## Forms in React

### Controlled Components
Form inputs whose values are controlled by React state.

### Example from AuthForm.jsx:
```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// The input value is controlled by state
<input 
  type="email" 
  value={email}                              // ← React state controls value
  onChange={(e) => setEmail(e.target.value)} // ← User input updates state
  required 
/>
```

### Why Use Controlled Components?
1. **Single source of truth**: State holds the current value
2. **Validation**: Easy to validate in real-time
3. **Conditional logic**: Can modify input based on other state

### Form Submission:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault(); // Prevent page reload
  setLoading(true);
  
  try {
    const response = await axios.post(API_URL, { email, password });
    // Handle response...
  } catch (error) {
    // Handle error...
  } finally {
    setLoading(false);
  }
};
```

---

## API Calls with Axios

### What is Axios?
Axios is a promise-based HTTP client for making API requests.

### Setup in Our Project:
```javascript
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7072/api/Auth';

// Create authenticated client
const createApiClient = (token) => {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

### Examples:

#### 1. **POST Request (Create/Login)**
```javascript
// In AuthForm.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  const endpoint = isLogin ? 'login' : 'register';
  const authData = { email, password };

  try {
    const response = await axios.post(
      `${API_BASE_URL}/${endpoint}`, 
      authData
    );
    
    if (isLogin) {
      const token = response.data.token;
      localStorage.setItem('jwtToken', token);
      onAuthSuccess(token);
    }
  } catch (error) {
    console.error('Auth Error:', error);
    setMessage(`Error: ${error.response?.data?.Message}`);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **GET Request (Fetch Data)**
```javascript
// In TaskList.jsx
const fetchTasks = async () => {
  try {
    setLoading(true);
    const response = await apiClient.get(API_URL);
    setTasks(response.data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
  } catch (err) {
    console.error('Error fetching tasks:', err);
    setError('Failed to fetch tasks.');
  } finally {
    setLoading(false);
  }
};
```

#### 3. **PUT Request (Update)**
```javascript
const toggleTask = async (task) => {
  const updatedTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    isComplete: !task.isComplete, 
  };

  try {
    await apiClient.put(`${API_URL}/${task.id}`, updatedTask);
  } catch (err) {
    console.error('Error toggling task:', err);
  }
};
```

#### 4. **DELETE Request**
```javascript
const deleteTask = async (taskId) => {
  if (!window.confirm("Are you sure?")) return;
  
  try {
    await apiClient.delete(`${API_URL}/${taskId}`);
  } catch (err) {
    console.error('Error deleting task:', err);
  }
};
```

### Interview Tip:
**Q: Why use try-catch-finally?**
**A:** 
- **try**: Execute API call
- **catch**: Handle errors gracefully
- **finally**: Cleanup (set loading to false) regardless of success/failure

---

## Real-Time Communication (SignalR)

### What is SignalR?
SignalR enables real-time bi-directional communication between server and client using WebSockets.

### Use Case in Our Project:
When one user creates/updates/deletes a task, all connected users see the update instantly.

### Implementation:
```javascript
import * as signalR from '@microsoft/signalr';

useEffect(() => {
  let connection = null;
  if (!token) return;

  const startSignalR = async () => {
    // 1. Build connection
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { 
        accessTokenFactory: () => token 
      })
      .withAutomaticReconnect()
      .build();

    // 2. Listen for events from server
    connection.on('TaskReceived', (task, action) => {
      console.log(`Received ${action} for Task ${task.id}`);
      fetchTasks(); // Re-fetch to show updated data
    });

    // 3. Start connection
    await connection.start();
    console.log('SignalR Connected.');
  };

  startSignalR();

  // 4. Cleanup on unmount
  return () => {
    if (connection) {
      connection.stop();
    }
  };
}, [token]);
```

### How it Works:
1. **Server**: When a task is created/updated/deleted, .NET backend sends message to all connected clients
2. **Client**: React receives message via `connection.on('TaskReceived', ...)`
3. **UI Update**: `fetchTasks()` is called to refresh the task list
4. **Result**: All users see real-time updates without refreshing

---

## Common Interview Questions

### 1. **What is the Virtual DOM?**
**Answer:** The Virtual DOM is a lightweight copy of the actual DOM. When state changes, React updates the Virtual DOM first, compares it with the previous version (diffing), and only updates the changed parts in the real DOM. This makes React fast.

**Example from our project:**
When you toggle a task's completion status, React doesn't re-render the entire task list—only the specific task item changes.

---

### 2. **What's the difference between props and state?**

| Props | State |
|-------|-------|
| Passed from parent | Managed within component |
| Read-only (immutable) | Can be changed with setState |
| Function parameters | Component memory |

**Example:**
```javascript
// App.jsx (Parent)
const [theme, setTheme] = useState('light'); // STATE
<TaskList theme={theme} /> // Passed as PROP

// TaskList.jsx (Child)
const TaskList = ({ theme }) => { // Received as PROP
  const [tasks, setTasks] = useState([]); // Own STATE
};
```

---

### 3. **What is the purpose of keys in lists?**
**Answer:** Keys help React identify which items changed, were added, or removed. They should be unique and stable.

**Example from TaskList.jsx:**
```javascript
{tasks.map((task) => (
  <div key={task.id}> {/* ← Unique key */}
    <h3>{task.title}</h3>
  </div>
))}
```

**Why `task.id`?** It's unique and doesn't change. Never use array index as key if list can be reordered.

---

### 4. **Explain the component lifecycle**
**Answer:** In functional components, we use `useEffect` to handle lifecycle events:

```javascript
// Mount (on component load)
useEffect(() => {
  console.log('Component mounted');
  fetchTasks();
}, []); // Empty array = run once on mount

// Update (on state change)
useEffect(() => {
  console.log('Theme changed');
}, [theme]); // Runs when theme changes

// Unmount (on component removal)
useEffect(() => {
  return () => {
    console.log('Component unmounting');
    connection.stop(); // Cleanup
  };
}, []);
```

---

### 5. **What are controlled vs uncontrolled components?**

**Controlled (Recommended):**
```javascript
// React state controls the input value
const [email, setEmail] = useState('');

<input 
  value={email} 
  onChange={(e) => setEmail(e.target.value)} 
/>
```

**Uncontrolled (Using refs):**
```javascript
// DOM controls the value
const emailRef = useRef();

<input ref={emailRef} />

// Access value: emailRef.current.value
```

**Our project uses controlled components** for all forms (AuthForm, TaskForm).

---

### 6. **How do you handle forms in React?**
**Answer:** From our AuthForm.jsx example:

```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault(); // Prevent page reload
  // Process form data (API call)
};

return (
  <form onSubmit={handleSubmit}>
    <input 
      value={email} 
      onChange={(e) => setEmail(e.target.value)} 
    />
    <button type="submit">Submit</button>
  </form>
);
```

---

### 7. **What is prop drilling and how to avoid it?**
**Answer:** Prop drilling is passing props through multiple levels of components.

**Example in our project:**
```javascript
App → TaskList → TaskForm
     ↓ theme   ↓ theme
```

**Solutions:**
1. **Context API** (for global state like theme)
2. **State management** (Redux, Zustand)
3. **Component composition** (render props, children)

---

### 8. **Explain useState with previous state**
```javascript
// ❌ May have issues with stale state
setCount(count + 1);

// ✅ Correct - uses previous state
setCount(prev => prev + 1);

// Example from our project (theme toggle):
setTheme(prev => prev === 'light' ? 'dark' : 'light');
```

**Why?** When using the updater function, React ensures you always have the latest state, even with rapid updates.

---

### 9. **How do you make API calls in React?**
**Answer:** Use `useEffect` for data fetching on component mount:

```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []); // Empty array = fetch once on mount
```

---

### 10. **What are React Hooks rules?**
**Answer:**
1. **Only call Hooks at the top level** (not inside loops, conditions, or nested functions)
2. **Only call Hooks from React functions** (functional components or custom hooks)

```javascript
// ❌ WRONG - Hook inside condition
if (condition) {
  const [state, setState] = useState();
}

// ✅ CORRECT - Hook at top level
const [state, setState] = useState();
if (condition) {
  setState(newValue);
}
```

---

## Key Takeaways for Interview

### 1. **Project Overview**
"I built a real-time task planner with React frontend and .NET backend. It features:
- Authentication with JWT tokens
- CRUD operations for tasks
- Real-time updates using SignalR WebSockets
- Dark mode theme toggle
- Responsive design with Tailwind CSS"

### 2. **Technical Skills Demonstrated**
- **State Management**: useState for local state
- **Side Effects**: useEffect for API calls, WebSocket connections
- **Component Communication**: Props and callback functions
- **Form Handling**: Controlled components
- **API Integration**: Axios for REST API calls
- **Real-time**: SignalR for live updates
- **Conditional Rendering**: Multiple UI states
- **Event Handling**: Click, change, submit events

### 3. **Architecture Pattern**
"I followed a component-based architecture:
- `App.jsx`: Main container, manages authentication and theme
- `AuthForm.jsx`: Handles login/register
- `TaskList.jsx`: Fetches and displays tasks, manages WebSocket
- `TaskForm.jsx`: Creates new tasks"

### 4. **Best Practices Used**
- ✅ Functional components with Hooks
- ✅ Controlled form inputs
- ✅ Proper cleanup in useEffect
- ✅ Error handling with try-catch
- ✅ Loading states for better UX
- ✅ Token-based authentication
- ✅ Reusable components with props

---

## Quick Reference Cheat Sheet

```javascript
// useState
const [value, setValue] = useState(initial);

// useEffect - Run once on mount
useEffect(() => { /* code */ }, []);

// useEffect - Run when dependency changes
useEffect(() => { /* code */ }, [dependency]);

// useEffect - Cleanup
useEffect(() => {
  return () => { /* cleanup */ };
}, []);

// Event handling
<button onClick={handleClick}>Click</button>
<input onChange={(e) => setValue(e.target.value)} />
<form onSubmit={handleSubmit}>

// Conditional rendering
{condition && <Component />}
{condition ? <ComponentA /> : <ComponentB />}

// List rendering
{items.map(item => <div key={item.id}>{item.name}</div>)}

// Props
<Child data={data} onAction={handleAction} />

// API call with axios
const response = await axios.get(url);
const response = await axios.post(url, data);
const response = await axios.put(url, data);
const response = await axios.delete(url);
```

---

## Practice Questions to Ask Interviewer

1. "Could you tell me more about your React application's architecture?"
2. "Do you use any state management libraries like Redux?"
3. "How do you handle real-time updates in your application?"
4. "What's your approach to component testing?"
5. "Do you follow any specific React design patterns?"

---

**Good luck with your interview! 🚀**

Remember: It's not just about memorizing—understand the "why" behind each concept. Use examples from your project to demonstrate practical knowledge.
