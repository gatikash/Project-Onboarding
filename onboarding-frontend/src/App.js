import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Checklist from './components/Checklist';
import ManagerChecklist from './components/ManagerChecklist';
import Projects from './components/Projects';
import ResourcesPage from './components/ResourcesPage';
import Header from './components/Header';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Protected Route component to handle authentication
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Role-based route component
const RoleBasedRoute = ({ children, allowedRoles, user }) => {
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    if (userEmail && userRole) {
      setUser({ email: userEmail, role: userRole });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {user && <Header userEmail={user.email} onLogout={handleLogout} />}
        <Routes>
          {/* Public route - Login page */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={(userData) => {
                  localStorage.setItem('userEmail', userData.email);
                  localStorage.setItem('userRole', userData.role);
                  localStorage.setItem('userId', userData.id);
                  setUser(userData);
                }} />
              )
            } 
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* User routes */}
          <Route
            path="/checklist"
            element={
              <ProtectedRoute user={user}>
                <RoleBasedRoute allowedRoles={['USER']} user={user}>
                  <Checklist />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          {/* Manager routes */}
          <Route
            path="/manager-checklist"
            element={
              <ProtectedRoute user={user}>
                <RoleBasedRoute allowedRoles={['MANAGER']} user={user}>
                  <ManagerChecklist />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          {/* Projects route - Manager only */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute user={user}>
                <RoleBasedRoute allowedRoles={['MANAGER']} user={user}>
                  <Projects />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          {/* Resources route */}
          <Route
            path="/resources"
            element={
              <ProtectedRoute user={user}>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
