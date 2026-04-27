import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Zap, Star, Target, Flame } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface Habit {
  id: string;
  name: string;
  schedule: 'daily' | string[];
  createdAt: any;
  isActive: boolean;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

interface HabitWithStats extends Habit {
  completedToday: boolean;
  streak: number;
}

export default function Habits() {
  const { addXp, triggerConfetti, user, xp, level } = useAppContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [scheduleType, setScheduleType] = useState<'daily' | 'specific'>('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const WEEKDAYS_LABELS = [
    { id: 'sun', label: 'Su' }, { id: 'mon', label: 'Mo' }, { id: 'tue', label: 'Tu' }, 
    { id: 'wed', label: 'We' }, { id: 'thu', label: 'Th' }, { id: 'fri', label: 'Fr' }, { id: 'sat', label: 'Sa' }
  ];

  const getFormatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const todayStr = getFormatDate(new Date());
  const todayDayOfWeekStr = WEEKDAYS[new Date().getDay()];

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }
    
    setIsInitialLoading(true);
    setFetchError(null);
    let habitsLoaded = false;
    let logsLoaded = false;
    
    const checkReady = () => {
      if (habitsLoaded && logsLoaded) {
        setIsInitialLoading(false);
      }
    };

    const qHabits = query(collection(db, 'habits'), where('userId', '==', user.uid), where('isActive', '==', true));
    const unsubHabits = onSnapshot(qHabits, (snapshot) => {
      const h: Habit[] = [];
      snapshot.forEach(d => h.push({ id: d.id, ...d.data() } as Habit));
      setHabits(h);
      habitsLoaded = true;
      checkReady();
    }, (err) => {
      console.error(err);
      setFetchError("Failed to fetch habits. Please check your connection.");
      setIsInitialLoading(false);
    });

    const qLogs = query(collection(db, 'habit_logs'), where('userId', '==', user.uid), where('completed', '==', true));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const l: HabitLog[] = [];
      snapshot.forEach(d => l.push({ id: d.id, ...d.data() } as HabitLog));
      setLogs(l);
      logsLoaded = true;
      checkReady();
    }, (err) => {
      console.error(err);
      setFetchError("Failed to fetch habit logs. Please check your connection.");
      setIsInitialLoading(false);
    });

    return () => { unsubHabits(); unsubLogs(); };
  }, [user]);

  // Combine habits with logs to get streak and completedToday
  const habitsWithStats: HabitWithStats[] = habits.map(habit => {
    const habitLogs = logs.filter(l => l.habitId === habit.id);
    const completedDates = habitLogs.map(l => l.date).sort().reverse();
    
    const completedToday = completedDates.includes(todayStr);
    
    let streak = 0;
    let currentCheckDate = new Date();
    currentCheckDate.setHours(0, 0, 0, 0);
    
    const checkTodayStr = getFormatDate(currentCheckDate);
    currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    const yesterdayStr = getFormatDate(currentCheckDate);
    
    if (completedDates.includes(checkTodayStr) || completedDates.includes(yesterdayStr)) {
      let checkDateStr = completedDates.includes(checkTodayStr) ? checkTodayStr : yesterdayStr;
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

    return { ...habit, completedToday, streak };
  });

  const habitsScheduledToday = habitsWithStats.filter(h => {
    if (!h.schedule || h.schedule === 'daily') return true;
    return h.schedule.includes(todayDayOfWeekStr);
  });

  const completedCount = habitsScheduledToday.filter(h => h.completedToday).length;
  const bestStreak = habitsWithStats.length > 0 ? Math.max(...habitsWithStats.map(h => h.streak)) : 0;

  const toggleHabit = async (id: string, currentlyCompleted: boolean, streak: number) => {
    if (!user || loadingHabits.has(id)) return;
    
    setLoadingHabits(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setErrorMsg(null);

    const newCompletedState = !currentlyCompleted;
    const logId = `${user.uid}_${id}_${todayStr}`;
    
    try {
      await setDoc(doc(db, 'habit_logs', logId), {
        userId: user.uid,
        habitId: id,
        date: todayStr,
        completed: newCompletedState
      }, { merge: true });
      
      if (newCompletedState) {
        addXp(5);
        const tempStreak = streak + (currentlyCompleted ? 0 : 1);
        if (tempStreak === 7 || tempStreak === 30) triggerConfetti();
      } else {
        addXp(-5);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update habit. Please try again.");
    } finally {
      setLoadingHabits(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'habits', id), { isActive: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !user) return;

    if (scheduleType === 'specific' && selectedDays.length === 0) {
      setErrorMsg('Please select at least one day for specific schedule.');
      return;
    }

    try {
      await addDoc(collection(db, 'habits'), {
        userId: user.uid,
        name: newHabitName.trim(),
        schedule: scheduleType === 'daily' ? 'daily' : selectedDays,
        createdAt: serverTimestamp(),
        isActive: true
      });
      setNewHabitName('');
      setScheduleType('daily');
      setSelectedDays([]);
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to add habit.");
    }
  };

  if (!user || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-subtext font-medium text-lg">Loading your routine...</p>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Daily Execution</h1>
        <p className="text-subtext">Focus on the present. Execute today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card p-6 rounded-3xl border border-border shadow-xl flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl text-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-subtext text-sm font-medium">Completed Today</div>
            <div className="text-2xl font-bold text-text">{completedCount} <span className="text-subtext text-lg font-normal">/ {habitsScheduledToday.length}</span></div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border shadow-xl flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-500">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-subtext text-sm font-medium">Best Streak</div>
            <div className="text-2xl font-bold text-text">{bestStreak} <span className="text-subtext text-lg font-normal">Days</span></div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border shadow-xl flex items-center gap-4">
          <div className="p-3 bg-secondary/20 rounded-2xl text-secondary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-subtext text-sm font-medium">Total XP</div>
            <div className="text-2xl font-bold text-text">{xp} <span className="text-subtext text-lg font-normal">Lvl {level}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-text">Today's Habits</h2>
            {errorMsg && (
              <span className="text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded-lg">
                {errorMsg}
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>

        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddHabit}
            className="mb-6 p-5 bg-background border border-border rounded-2xl flex flex-col gap-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="E.g., Read 10 pages..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                autoFocus
                className="flex-1 bg-background border border-border text-text rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as 'daily' | 'specific')}
                className="bg-background border border-border text-text rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="specific">Specific Days</option>
              </select>
              <button 
                type="submit" 
                className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-secondary transition-colors whitespace-nowrap"
              >
                Add Habit
              </button>
            </div>
            
            <AnimatePresence>
              {scheduleType === 'specific' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 flex-wrap"
                >
                  {WEEKDAYS_LABELS.map(day => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setSelectedDays(prev => 
                          isSelected ? prev.filter(d => d !== day.id) : [...prev, day.id]
                        )}
                        className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors flex items-center justify-center ${
                          isSelected 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-card border border-border text-subtext hover:border-primary'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        )}

        <div className="space-y-3">
          {habitsScheduledToday.map((habit) => (
            <motion.div 
              key={habit.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                habit.completedToday 
                  ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                  : 'bg-background border-border hover:border-border'
              }`}
            >
              <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleHabit(habit.id, habit.completedToday, habit.streak)}>
                <button 
                  disabled={loadingHabits.has(habit.id)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    habit.completedToday ? 'bg-primary border-primary text-white scale-110' : 'border-gray-600 text-transparent hover:border-primary'
                  } ${loadingHabits.has(habit.id) ? 'opacity-70 cursor-not-allowed scale-100' : ''}`}
                >
                  {loadingHabits.has(habit.id) ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                      className={`w-4 h-4 border-2 rounded-full border-t-transparent ${habit.completedToday ? 'border-white' : 'border-primary'}`} 
                    />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </button>
                <span className={`text-lg font-medium transition-colors ${habit.completedToday ? 'text-subtext line-through' : 'text-text'}`}>
                  {habit.name}
                </span>
              </div>
              
              <div className="flex items-center">
                {habit.streak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background rounded-lg border border-border mr-2 opacity-80">
                    <Star className={`w-4 h-4 ${habit.completedToday ? 'text-orange-500 fill-orange-500' : 'text-subtext'}`} />
                    <span className="text-sm font-bold text-text">{habit.streak}</span>
                  </div>
                )}
                <button 
                  onClick={() => deleteHabit(habit.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Archive Habit"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
          
          {habitsScheduledToday.length === 0 && !isAdding && (
            <div className="text-center py-12 text-subtext">
              <p>You have no habits scheduled for today. Take a break or add a new one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
