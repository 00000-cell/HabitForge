import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Flame, ShieldAlert, ArrowLeft, Circle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';

export default function AdminPanel() {
  const { user, isAdmin } = useAppContext();
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [totalHabitsTracked, setTotalHabitsTracked] = useState(0);
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  
  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
      const u: any[] = [];
      snapshot.forEach(doc => u.push({ id: doc.id, ...doc.data() }));
      // Sort by active status implicitly or leave as is
      setUsersList(u);
    });

    const q = query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribeActivity = onSnapshot(q, (snapshot) => {
      const a: any[] = [];
      snapshot.forEach(doc => a.push({ id: doc.id, ...doc.data() }));
      setActivities(a);
    });

    const goalsQuery = query(collection(db, 'goals'), where('completed', '==', true));
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      setGoalsCompleted(snapshot.size);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeActivity();
      unsubscribeGoals();
    };
  }, [isAdmin]);

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  const isActive = (lastActive: any) => {
    if (!lastActive) return false;
    const diff = (new Date().getTime() - lastActive.toDate().getTime()) / 1000;
    return diff < 300;
  };

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-text p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 bg-card border border-border rounded-xl hover:bg-card transition-colors">
              <ArrowLeft className="w-5 h-5 text-subtext hover:text-text" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                Admin Dashboard
              </h1>
              <p className="text-subtext">Host Control Panel - Restricted Access</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            System Live
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-subtext font-medium mb-1">Total Users</h3>
            <p className="text-4xl font-bold text-text">{totalUsers}</p>
            <p className="text-sm text-green-400 mt-2">Live sync enabled</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/20 rounded-xl text-primary">
                <Flame className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-subtext font-medium mb-1">Total Habits Tracked</h3>
            <p className="text-4xl font-bold text-text">{totalHabitsTracked}</p>
            <p className="text-sm text-subtext mt-2">No data yet</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl text-green-500">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-subtext font-medium mb-1">Goals Completed</h3>
            <p className="text-4xl font-bold text-text">{goalsCompleted}</p>
            <p className="text-sm text-subtext mt-2">No data yet</p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Info */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6">Host Information</h2>
            <div className="space-y-4">
              <div className="p-4 bg-background border border-border rounded-2xl flex justify-between items-center">
                <span className="text-subtext font-medium">Logged in as</span>
                <span className="text-text font-bold">{user?.email}</span>
              </div>
              <div className="p-4 bg-background border border-border rounded-2xl flex justify-between items-center">
                <span className="text-subtext font-medium">Host UID</span>
                <span className="text-subtext font-mono text-sm">{user?.uid}</span>
              </div>
              <div className="p-4 bg-background border border-border rounded-2xl flex justify-between items-center">
                <span className="text-subtext font-medium">Role</span>
                <span className="text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-lg">Administrator</span>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {activities.length === 0 ? (
                 <p className="text-subtext text-sm">No recent activity.</p>
              ) : activities.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 border-b border-border last:border-0">
                  <span className="text-xs text-subtext w-16 pt-1 flex-shrink-0">{timeAgo(log.timestamp)}</span>
                  <div className="flex-1">
                    <span className="text-sm text-text font-medium block">{log.action}</span>
                    <span className="text-xs text-subtext block">{log.userEmail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Registered Users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-subtext text-sm">
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {usersList.map((u) => {
                  const active = isActive(u.lastActive);
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-card/20 transition-colors">
                      <td className="py-4 text-text font-medium">{u.email}</td>
                      <td className="py-4">
                        {active ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Active Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-subtext bg-card px-2 py-1 rounded-md text-xs font-medium">
                            <Circle className="w-1.5 h-1.5 fill-current" />
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-subtext">{timeAgo(u.lastLogin)}</td>
                    </tr>
                  );
                })}
                {usersList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-subtext">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
