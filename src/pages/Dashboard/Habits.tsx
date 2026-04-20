import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame, Check, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProgressRing from '../../components/ProgressRing';

interface Habit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
  color: string;
}

export default function Habits() {
  const { addXp, triggerConfetti } = useAppContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [multiSelectDates, setMultiSelectDates] = useState<string[]>([]);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  
  // Format YYYY-MM-DD for the API
  const getFormatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateStr = getFormatDate(selectedDate);

  useEffect(() => {
    fetch(`/api/habits?date=${selectedDateStr}`)
      .then(res => res.json())
      .then(data => setHabits(data))
      .catch(err => console.error(err));
  }, [selectedDateStr]);

  const completedCount = habits.filter(h => h.completedToday).length;
  const progressPercent = habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100);

  // Calendar logic
  const todayDate = new Date();
  const currentMonthName = currentMonthDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentMonthDate.getFullYear();
  
  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonthDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonthDate.getMonth(), 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };
  const calendarDays = generateCalendarDays();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonthDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonthDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number | null) => {
    if (day !== null) {
      const clickedDate = new Date(currentYear, currentMonthDate.getMonth(), day);
      const clickedStr = getFormatDate(clickedDate);
      
      if (isAdding) {
        setMultiSelectDates(prev => 
          prev.includes(clickedStr) 
            ? prev.filter(d => d !== clickedStr)
            : [...prev, clickedStr]
        );
      } else {
        setSelectedDate(clickedDate);
      }
    }
  };

  const handleSelectEveryDay = (e: React.MouseEvent) => {
    e.preventDefault();
    const dates = [];
    const d = new Date(selectedDate);
    for (let i = 0; i < 365; i++) {
      dates.push(getFormatDate(d));
      d.setDate(d.getDate() + 1);
    }
    setMultiSelectDates(dates);
  };

  const toggleHabit = (id: string) => {
    fetch(`/api/habits/${id}/toggle?date=${selectedDateStr}`, { method: 'PUT' })
      .then(res => res.json())
      .then(updatedHabit => {
        setHabits(prev => prev.map(habit => {
          if (habit.id === id) {
            if (updatedHabit.completedToday) {
              addXp(10);
              if (updatedHabit.streak === 7 || updatedHabit.streak === 30) {
                triggerConfetti();
              }
            } else {
              addXp(-10);
            }
            return updatedHabit;
          }
          return habit;
        }));
      })
      .catch(err => console.error(err));
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    fetch(`/api/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newHabitTitle, dates: multiSelectDates })
    }).then(() => {
      // Re-fetch to get the new list for the currently viewed date
      return fetch(`/api/habits?date=${selectedDateStr}`);
    }).then(res => res.json())
    .then(data => {
      setHabits(data);
      setNewHabitTitle('');
      setIsAdding(false);
      setMultiSelectDates([]);
    }).catch(err => console.error(err));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Daily Habits</h1>
          <p className="text-muted">Stay consistent, build your streak.</p>
        </div>
        
        {/* Progress Overview Card */}
        <div className="bg-card border border-gray-800 rounded-2xl p-4 flex items-center gap-6 shadow-lg">
          <div className="relative">
            <ProgressRing radius={40} stroke={6} progress={progressPercent} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{progressPercent}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-white font-medium">Daily Completion</h3>
            <p className="text-sm text-muted">{completedCount} of {habits.length} habits done</p>
          </div>
        </div>
      </div>

      {/* Habit List */}
      <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Habits for {selectedDate.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
          <button 
            onClick={() => {
              if (!isAdding) setMultiSelectDates([selectedDateStr]);
              setIsAdding(!isAdding);
            }}
            className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>

        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddHabit}
            className="mb-6 flex flex-col gap-3 p-4 border border-primary/30 bg-primary/5 rounded-2xl"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                autoFocus
                placeholder="E.g., Meditate for 10 minutes..."
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                className="flex-1 bg-background border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSelectEveryDay}
                  className="px-4 py-3 bg-background border border-primary/50 text-primary font-medium rounded-xl hover:bg-primary hover:text-white transition-colors"
                >
                  Every Day
                </button>
                <button 
                  type="submit" 
                  disabled={multiSelectDates.length === 0}
                  className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.form>
        )}

        <div className="space-y-4">
          {habits.map((habit) => (
            <motion.div
              key={habit.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                habit.completedToday 
                  ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                  : 'bg-background border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    habit.completedToday
                      ? 'bg-primary border-primary text-white scale-110'
                      : 'border-gray-600 text-transparent hover:border-primary'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <span className={`text-lg font-medium transition-colors ${habit.completedToday ? 'text-white' : 'text-gray-300'}`}>
                  {habit.title}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-gray-800">
                <motion.div
                  animate={habit.completedToday ? { scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Flame className={`w-5 h-5 ${habit.streak > 0 ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-gray-600'}`} />
                </motion.div>
                <span className={`font-bold ${habit.streak > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {habit.streak}
                </span>
              </div>
            </motion.div>
          ))}
          
          {habits.length === 0 && (
            <div className="text-center py-12 text-muted">
              <p>No habits yet. Start building your routine!</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Calendar */}
      <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Monthly Overview</h2>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 bg-background border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="text-primary font-medium bg-primary/10 px-4 py-1.5 rounded-lg min-w-[140px] text-center">
              {currentMonthName} {currentYear}
            </span>
            <button onClick={nextMonth} className="p-2 bg-background border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square bg-transparent" />;
            }
            const dateObj = new Date(currentYear, currentMonthDate.getMonth(), day);
            const dateStr = getFormatDate(dateObj);
            
            const isToday = day === todayDate.getDate() && currentMonthDate.getMonth() === todayDate.getMonth() && currentYear === todayDate.getFullYear();
            const isSelected = !isAdding && day === selectedDate.getDate() && currentMonthDate.getMonth() === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
            const isMultiSelected = isAdding && multiSelectDates.includes(dateStr);
            
            return (
              <div 
                key={index} 
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                  bg-background border border-gray-800 cursor-pointer hover:border-gray-600
                  ${isToday && !isSelected && !isMultiSelected ? 'text-primary font-bold border-primary/50' : ''}
                  ${isSelected ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] text-white font-bold scale-105' : ''}
                  ${isMultiSelected ? 'bg-secondary/40 border-secondary shadow-[0_0_15px_rgba(217,70,239,0.4)] text-white font-bold scale-105' : ''}
                  ${!isToday && !isSelected && !isMultiSelected ? 'text-gray-400' : ''}
                  ${isAdding ? 'hover:bg-secondary/20 hover:border-secondary transition-colors duration-100' : ''}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
