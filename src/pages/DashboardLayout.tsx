import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { 
  Activity, Home, BookOpen, Heart, Target, 
  BarChart2, User, Bell, Search, Menu
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const NAV_ITEMS = [
  { icon: Home, label: 'Habits', path: '/dashboard' },
  { icon: BookOpen, label: 'Academics', path: '/dashboard/academics' },
  { icon: Heart, label: 'Health', path: '/dashboard/health' },
  { icon: Target, label: 'Goals', path: '/dashboard/goals' },
  { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
];

export default function DashboardLayout() {
  const { xp, level, xpToNextLevel, showConfetti, userName, avatarUrl } = useAppContext();
  const location = useLocation();

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
      <aside className="w-64 border-r border-card hidden md:flex flex-col bg-background/50 backdrop-blur-xl z-20 relative">
        {/* Glow behind sidebar */}
        <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px] pointer-events-none" />
        
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">HabitForge</span>
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
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                      : 'text-muted hover:bg-card hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 relative z-10 border-t border-card">
          <div className="bg-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Level {level}</span>
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
            <p className="text-xs text-muted mt-2 text-center">{xpToNextLevel} XP to next level</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* App Navbar */}
        <header className="h-16 border-b border-card bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-20">
          <div className="flex items-center gap-4 md:hidden">
            <button className="text-muted hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold text-white">HabitForge</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                <span className="text-sm font-bold text-white">{userName ? userName.substring(0, 2).toUpperCase() : 'U'}</span>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
           {/* General Background Glow for Dashboard */}
           <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full relative z-10"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
