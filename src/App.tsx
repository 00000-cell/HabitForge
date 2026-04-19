import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './pages/DashboardLayout';
import Habits from './pages/Dashboard/Habits';
import Academics from './pages/Dashboard/Academics';
import Health from './pages/Dashboard/Health';
import Goals from './pages/Dashboard/Goals';
import Analytics from './pages/Dashboard/Analytics';
import Profile from './pages/Dashboard/Profile';


function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Habits />} />
            <Route path="academics" element={<Academics />} />
            <Route path="health" element={<Health />} />
            <Route path="goals" element={<Goals />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
