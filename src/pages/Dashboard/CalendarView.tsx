import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Calendar as CalendarIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Habit {
  id: string;
  name: string;
  schedule: 'daily' | string[];
  createdAt: string;
  isActive: boolean;
}

interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const getFormatDate = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CalendarView() {
  const { user } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const todayStr = getFormatDate(new Date());
  const selectedDateStr = getFormatDate(selectedDate);

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsInitialLoading(true);
      setFetchError(null);
      try {
        const qHabits = query(collection(db, 'habits'), where('userId', '==', user.uid), where('isActive', '==', true));
        const snapHabits = await getDocs(qHabits);
        const hList: Habit[] = [];
        snapHabits.forEach(d => {
          const data = d.data();
          const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          hList.push({
            id: d.id,
            name: data.name,
            schedule: data.schedule || 'daily',
            createdAt: getFormatDate(createdDate),
            isActive: data.isActive
          });
        });
        setHabits(hList);

        const qLogs = query(collection(db, 'habit_logs'), where('userId', '==', user.uid), where('completed', '==', true));
        const snapLogs = await getDocs(qLogs);
        const lList: HabitLog[] = [];
        snapLogs.forEach(d => {
          const data = d.data();
          lList.push({
            habitId: data.habitId,
            date: data.date,
            completed: data.completed
          });
        });
        setLogs(lList);
      } catch (err) {
        console.error(err);
        setFetchError("Failed to fetch calendar data.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();

  const getDayStatus = (dateStr: string, dayOfWeekIndex: number) => {
    const dayOfWeekStr = WEEKDAYS[dayOfWeekIndex];
    
    const habitsForDay = habits.filter(h => {
      if (h.createdAt > dateStr) return false; // Not created yet
      if (!h.schedule || h.schedule === 'daily') return true;
      return h.schedule.includes(dayOfWeekStr);
    });

    if (habitsForDay.length === 0) return 'neutral';

    const logsForDay = logs.filter(l => l.date === dateStr);
    
    const completedCount = habitsForDay.filter(h => logsForDay.some(l => l.habitId === h.id)).length;
    
    if (completedCount === habitsForDay.length) return 'complete';
    
    if (dateStr > todayStr) return 'neutral'; // Future
    
    return completedCount > 0 ? 'partial' : 'missed';
  };

  // Generate grid cells
  const gridCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    gridCells.push(<div key={`empty-${i}`} className="h-10 sm:h-14" />);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const cellDateStr = getFormatDate(cellDate);
    const dayOfWeekIndex = cellDate.getDay();
    const status = getDayStatus(cellDateStr, dayOfWeekIndex);
    const isToday = cellDateStr === todayStr;
    const isSelected = cellDateStr === selectedDateStr;

    let bgClass = "bg-background hover:bg-card border-border";
    let textClass = "text-text";

    if (status === 'complete') {
      bgClass = "bg-primary/20 hover:bg-primary/30 border-primary/30";
      textClass = "text-primary font-bold";
    } else if (status === 'partial') {
      bgClass = "bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30";
      textClass = "text-orange-500 font-bold";
    } else if (status === 'missed') {
      bgClass = "bg-red-500/10 hover:bg-red-500/20 border-red-500/20";
      textClass = "text-red-500";
    }

    gridCells.push(
      <button
        key={`day-${day}`}
        onClick={() => setSelectedDate(cellDate)}
        className={`relative h-10 sm:h-14 rounded-xl border flex items-center justify-center transition-all ${bgClass} ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      >
        <span className={`${textClass} ${isToday ? 'underline decoration-2 underline-offset-4' : ''}`}>
          {day}
        </span>
      </button>
    );
  }

  // Selected Day Details
  const selectedDayOfWeekIndex = selectedDate.getDay();
  const selectedDayOfWeekStr = WEEKDAYS[selectedDayOfWeekIndex];
  
  const habitsForSelectedDay = habits.filter(h => {
    if (h.createdAt > selectedDateStr) return false;
    if (!h.schedule || h.schedule === 'daily') return true;
    return h.schedule.includes(selectedDayOfWeekStr);
  });
  
  const logsForSelectedDay = logs.filter(l => l.date === selectedDateStr);

  if (!user || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-subtext font-medium text-lg">Loading your calendar...</p>
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Calendar</h1>
        <p className="text-subtext">View your long-term consistency and history.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg bg-background border border-border hover:bg-card hover:text-primary transition-colors text-subtext">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg bg-background border border-border hover:bg-card hover:text-primary transition-colors text-subtext">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS_SHORT.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-subtext uppercase tracking-wider mb-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {gridCells}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-2xl text-primary">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
                </h3>
                <p className="text-subtext text-sm">
                  {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {habitsForSelectedDay.length === 0 ? (
                <div className="text-center py-8 text-subtext border border-dashed border-border rounded-2xl bg-background/50">
                  No habits scheduled.
                </div>
              ) : (
                <AnimatePresence>
                  {habitsForSelectedDay.map(habit => {
                    const isCompleted = logsForSelectedDay.some(l => l.habitId === habit.id);
                    return (
                      <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isCompleted 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'bg-background border-border opacity-70'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-subtext flex-shrink-0" />
                        )}
                        <span className={`font-medium ${isCompleted ? 'text-subtext line-through' : 'text-text'}`}>
                          {habit.name}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
          
          {/* Key / Legend */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Legend</h4>
            <div className="space-y-3 text-sm text-subtext">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-primary/20 border border-primary/30" />
                <span>All completed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30" />
                <span>Partially completed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-red-500/10 border border-red-500/20" />
                <span>Missed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
