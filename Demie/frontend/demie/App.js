import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './components/DashboardView';
import AuditorLogin from './components/AuditorLogin';
import ResetPassword from './components/ResetPassword'; // 1. Import the component
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <AuditorLogin onLoginSuccess={() => setIsAuthenticated(true)} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* 2. Public Reset Password Route (Crucial for the Email Link) */}
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardView onLogout={handleLogout} />
            ) : (
              <Navigate
                to="/login"
                state={{ message: "Session expired. Please login to continue." }}
                replace
              />
            )
          }
        />

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;