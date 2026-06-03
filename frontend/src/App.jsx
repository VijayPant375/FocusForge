import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import { Toaster } from 'react-hot-toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          className: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl font-medium',
          success: {
            iconTheme: { primary: '#10B981', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: 'white' },
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
          <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard setAuth={setIsAuthenticated} />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Landing setAuth={setIsAuthenticated} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
