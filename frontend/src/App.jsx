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
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <Toaster position="top-right" />
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
      <footer className="w-full bg-slate-950 border-t border-slate-800 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm font-medium">
          Built with <span className="text-purple-500">⚡</span> by <span className="text-slate-200">Vijay Pant</span> | FocusForge © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default App;
