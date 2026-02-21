import React, { useState } from 'react';
import DashboardView from './components/DashboardView';
import AuditorLogin from './components/AuditorLogin';
import './App.css';

function App() {
  // Session state to track if the Auditor is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to clear authentication and return to login screen
  const handleLogout = () => {
    setIsAuthenticated(false);
    // Optional: Clear any local session tokens here if you implement them later
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        {/* Pass the setter to AuditorLogin to grant access */}
        <AuditorLogin onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="App">
      {/* Pass the logout handler down through DashboardView to the Sidebar */}
      <DashboardView onLogout={handleLogout} />
    </div>
  );
}

export default App;