import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './pages/DashboardLayout';
import Habits from './pages/Dashboard/Habits';
import CalendarView from './pages/Dashboard/CalendarView';
import Academics from './pages/Dashboard/Academics';
import Health from './pages/Dashboard/Health';
import Goals from './pages/Dashboard/Goals';
import Analytics from './pages/Dashboard/Analytics';
import Profile from './pages/Dashboard/Profile';
import AdminPanel from './pages/AdminPanel';
import { useAppContext } from './context/AppContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loadingAuth } = useAppContext();
  
  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user === null) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Habits />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="academics" element={<Academics />} />
              <Route path="health" element={<Health />} />
              <Route path="goals" element={<Goals />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
