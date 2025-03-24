import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ManagerDashboard from './components/ManagerDashboard';
import UserDashboard from './components/UserDashboard';
import Resources from './pages/ResourcesPage';
import UserMaster from './pages/UserMaster';
import UserTasks from './pages/UserTasks';
import UserChecklist from './components/UserChecklist';
import ManagerChecklist from './components/ManagerChecklist';
import ManagerResources from './components/ManagerResources';
import Projects from './pages/Projects';
import Header from './components/Header';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('userId') !== null;
  };

  const isManager = () => {
    const roleName = localStorage.getItem('roleName');
    return roleName === 'MANAGER';
  };

  const getDashboard = () => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }

    const isUserManager = isManager();
    return isUserManager ? <ManagerDashboard /> : <UserDashboard />;
  };

  return (
    <Router>
      <div>
        {isAuthenticated() && <Header />}
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated() ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={getDashboard()}
          />
          <Route
            path="/resources"
            element={isAuthenticated() ? <Resources /> : <Navigate to="/login" />}
          />
          <Route
            path="/manager-checklist"
            element={
              isAuthenticated() && isManager() ? (
                <ManagerChecklist />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/manager-resources"
            element={
              isAuthenticated() && isManager() ? (
                <ManagerResources />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/projects"
            element={
              isAuthenticated() && isManager() ? (
                <Projects />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/users"
            element={
              isAuthenticated() && isManager() ? (
                <UserMaster />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/user-tasks"
            element={
              isAuthenticated() && isManager() ? (
                <UserTasks />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/checklist"
            element={isAuthenticated() ? <UserChecklist /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
