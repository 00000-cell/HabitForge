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

  useEffect(() => {
    fetch('/api/habits')
      .then(res => res.json())
      .then(data => setHabits(data))
      .catch(err => console.error(err));
  }, []);

  const completedCount = habits.filter(h => h.completedToday).length;
  const progressPercent = habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100);

  const toggleHabit = (id: string) => {
    fetch(`/api/habits/${id}/toggle`, { method: 'PUT' })
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

    fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newHabitTitle })
    }).then(() => {
      // Re-fetch to get the new list
      return fetch('/api/habits');
    }).then(res => res.json())
    .then(data => {
      setHabits(data);
      setNewHabitTitle('');
      setIsAdding(false);
    }).catch(err => console.error(err));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Today's Habits</h1>
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
          <h2 className="text-xl font-semibold text-white">Your Routine</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
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
            className="mb-6 flex gap-4"
          >
            <input
              type="text"
              autoFocus
              placeholder="E.g., Meditate for 10 minutes..."
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              className="flex-1 bg-background border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            />
            <button type="submit" className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-secondary transition-colors">
              Add
            </button>
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
    </div>
  );
}
