import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
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
      <div className="flex-1">
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
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </div>

      {/* Universal Footer */}
      <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 mt-auto transition-colors duration-300">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
          Built with <span className="text-brand-purple">⚡</span> by <span className="text-gray-900 dark:text-gray-100 font-semibold">Vijay Pant</span> | FocusForge © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default App;
