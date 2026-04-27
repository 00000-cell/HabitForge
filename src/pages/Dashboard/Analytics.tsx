import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame, Target, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Analytics() {
  const { user } = useAppContext();
  const [stats, setStats] = useState({
    totalCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyCompletion: 0
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const getFormatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }
    
    setIsInitialLoading(true);
    setFetchError(null);

    const fetchAnalytics = async () => {
      try {
        const qHabits = query(collection(db, 'habits'), where('userId', '==', user.uid), where('isActive', '==', true));
        const snapHabits = await getDocs(qHabits);
        const habitsList: any[] = [];
        snapHabits.forEach(d => {
          const data = d.data();
          habitsList.push({
            id: d.id,
            schedule: data.schedule || 'daily',
            createdAt: getFormatDate(data.createdAt?.toDate ? data.createdAt.toDate() : new Date())
          });
        });

        const qLogs = query(collection(db, 'habit_logs'), where('userId', '==', user.uid), where('completed', '==', true));
        const snapLogs = await getDocs(qLogs);
        
        let totalHabitsCompleted = snapLogs.size;
        let globalMaxStreak = 0;
        let currentActiveStreak = 0;
        
        const logsByHabit: Record<string, string[]> = {};
        const allLogs: string[] = [];

        snapLogs.forEach(docSnap => {
          const data = docSnap.data();
          if (!logsByHabit[data.habitId]) {
            logsByHabit[data.habitId] = [];
          }
          logsByHabit[data.habitId].push(data.date);
          allLogs.push(data.date);
        });

        // Weekly Completion
        const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const today = new Date();
        today.setHours(0,0,0,0);
        const last7Days: { dateStr: string, dayStr: string }[] = [];
        for (let i=0; i<7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          last7Days.push({
            dateStr: getFormatDate(d),
            dayStr: WEEKDAYS[d.getDay()]
          });
        }

        let weeklyTotalCompleted = 0;
        allLogs.forEach(date => {
          if (last7Days.some(d => d.dateStr === date)) weeklyTotalCompleted++;
        });

        let weeklyTotalExpected = 0;
        habitsList.forEach(h => {
          last7Days.forEach(dayObj => {
            if (h.createdAt <= dayObj.dateStr) {
              if (h.schedule === 'daily' || h.schedule.includes(dayObj.dayStr)) {
                weeklyTotalExpected++;
              }
            }
          });
        });

        const weeklyPercent = weeklyTotalExpected === 0 ? 0 : Math.round((weeklyTotalCompleted / weeklyTotalExpected) * 100);

        // Streaks Calculation
        Object.keys(logsByHabit).forEach(habitId => {
          const completedDates = logsByHabit[habitId].sort().reverse();
          let streak = 0;
          let currentCheckDate = new Date();
          currentCheckDate.setHours(0, 0, 0, 0);
          
          const todayStr = getFormatDate(currentCheckDate);
          currentCheckDate.setDate(currentCheckDate.getDate() - 1);
          const yesterdayStr = getFormatDate(currentCheckDate);
          
          let isStreakActive = false;
          if (completedDates.includes(todayStr) || completedDates.includes(yesterdayStr)) {
            isStreakActive = true;
            let checkDateStr = completedDates.includes(todayStr) ? todayStr : yesterdayStr;
            let checkDate = new Date(checkDateStr);
            
            for (const d of completedDates) {
              if (d === checkDateStr) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
                checkDateStr = getFormatDate(checkDate);
              } else if (d > checkDateStr) {
                continue;
              } else {
                break;
              }
            }
          }
          
          if (isStreakActive && streak > currentActiveStreak) {
            currentActiveStreak = streak;
          }
          
          // Calculate max global streak for this habit
          let tempMax = 0;
          let tempStreak = 0;
          let tempCheckDateStr = completedDates[0];
          
          if (completedDates.length > 0) {
              let prevDate = new Date(tempCheckDateStr);
              for (let i = 0; i < completedDates.length; i++) {
                  const currDate = new Date(completedDates[i]);
                  const diffTime = Math.abs(prevDate.getTime() - currDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays <= 1) {
                      tempStreak++;
                  } else {
                      tempStreak = 1;
                  }
                  if (tempStreak > tempMax) tempMax = tempStreak;
                  prevDate = currDate;
              }
          }
          if (tempMax > globalMaxStreak) {
            globalMaxStreak = tempMax;
          }
        });

        setStats({
          totalCompleted: totalHabitsCompleted,
          currentStreak: currentActiveStreak,
          longestStreak: globalMaxStreak,
          weeklyCompletion: weeklyPercent > 100 ? 100 : weeklyPercent
        });
      } catch (err) {
        console.error("Error calculating analytics:", err);
        setFetchError("Failed to load analytics data.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [user]);

  if (!user || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-subtext font-medium text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl flex flex-col items-center gap-2 max-w-md text-center">
          <p className="font-semibold text-lg">Oops! Something went wrong.</p>
          <p className="text-sm opacity-80">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Analytics</h1>
        <p className="text-subtext">Measure your consistency and performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Habits Completed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-subtext font-semibold text-sm uppercase tracking-wider">Total Completed</h3>
          </div>
          <p className="text-5xl font-bold text-text tabular-nums">{stats.totalCompleted}</p>
        </motion.div>

        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-subtext font-semibold text-sm uppercase tracking-wider">Current Streak</h3>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold text-text tabular-nums">{stats.currentStreak}</p>
              <span className="text-subtext font-medium">days</span>
            </div>
            <p className="text-xs text-subtext mt-2 font-medium">Personal Best: {stats.longestStreak} days</p>
          </div>
        </motion.div>

        {/* Weekly Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-subtext font-semibold text-sm uppercase tracking-wider">Weekly Perf.</h3>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-5xl font-bold text-text tabular-nums">{stats.weeklyCompletion}</p>
              <span className="text-subtext font-medium">%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.weeklyCompletion}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
