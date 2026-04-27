import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { 
  Activity, Home, BookOpen, Heart, Target, 
  BarChart2, User, Bell, Search, Menu, ShieldAlert, LogOut, Calendar
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ThemeToggle from '../components/ThemeToggle';

const NAV_ITEMS = [
  { icon: Home, label: 'Habits', path: '/dashboard' },
  { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
  { icon: BookOpen, label: 'Academics', path: '/dashboard/academics' },
  { icon: Heart, label: 'Health', path: '/dashboard/health' },
  { icon: Target, label: 'Goals', path: '/dashboard/goals' },
  { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
];

export default function DashboardLayout() {
  const { xp, level, xpToNextLevel, showConfetti, userName, avatarUrl, isAdmin, logout } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Calculate progress percentage
  const currentLevelBase = level === 1 ? 0 : level === 2 ? 100 : 300 + (level - 3) * 300;
  const nextLevelBase = level === 1 ? 100 : level === 2 ? 300 : 300 + (level - 2) * 300;
  const progressPercent = ((xp - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100;

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col bg-sidebar z-20 relative transition-colors duration-300">
        {/* Glow behind sidebar */}
        <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px] pointer-events-none" />
        
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text tracking-tight">HabitForge</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 relative z-10">
          {NAV_ITEMS.map((item) => {
            const isRouteActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                     isRouteActive
                       ? 'bg-primary text-white shadow-[0_4px_10px_rgba(139,92,246,0.2)]'
                       : 'text-subtext hover:bg-card hover:text-text'
                   }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
          
          {isAdmin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-4 border border-transparent hover:border-red-500/30"
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div className="p-4 relative z-10 border-t border-card">
          <div className="bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text">Level {level}</span>
              <span className="text-xs text-primary">{xp} XP</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-subtext mt-2 text-center">{xpToNextLevel} XP to next level</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* App Navbar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4 md:hidden">
            <button className="text-subtext hover:text-text">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold text-text">HabitForge</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/dashboard/profile')}
              className="hover:scale-105 transition-transform"
              title="Go to Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                  <span className="text-sm font-bold text-text">{userName ? userName.substring(0, 2).toUpperCase() : 'U'}</span>
                </div>
              )}
            </button>
            <button 
              onClick={logout} 
              className="p-2 text-subtext hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
           {/* General Background Glow for Dashboard */}
           <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
          
          <div className="h-full relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
