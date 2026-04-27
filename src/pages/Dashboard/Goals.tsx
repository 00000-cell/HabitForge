import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Circle, Plus, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  type: 'weekly' | 'monthly' | 'yearly';
  userId: string;
}

export default function Goals() {
  const { user, addXp, triggerConfetti } = useAppContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }
    
    setIsInitialLoading(true);
    setFetchError(null);
    
    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g: Goal[] = [];
      snapshot.forEach(doc => g.push({ id: doc.id, ...doc.data() } as Goal));
      setGoals(g);
      setIsInitialLoading(false);
    }, (err) => {
      console.error(err);
      setFetchError("Failed to load goals. Please try again.");
      setIsInitialLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const toggleGoal = async (id: string, currentCompleted: boolean, type: string) => {
    if (!user) return;
    try {
      const newCompletedState = !currentCompleted;
      const goalRef = doc(db, 'goals', id);
      await updateDoc(goalRef, { 
        completed: newCompletedState,
        completedAt: newCompletedState ? serverTimestamp() : null
      });

      if (newCompletedState) {
        const xpGained = type === 'weekly' ? 25 : type === 'monthly' ? 50 : 50; // Balanced XP requirement
        addXp(xpGained);
        triggerConfetti();
      } else {
        const xpLost = type === 'weekly' ? 25 : type === 'monthly' ? 50 : 50;
        addXp(-xpLost);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'goals', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !user) return;

    // Prevent duplicates (case-insensitive)
    const normalizedTitle = newGoalTitle.trim().toLowerCase();
    const isDuplicate = goals.some(g => g.title.toLowerCase() === normalizedTitle && g.type === newGoalType);
    
    if (isDuplicate) {
      alert("This goal already exists.");
      return;
    }

    try {
      await addDoc(collection(db, 'goals'), {
        title: newGoalTitle.trim(),
        titleLower: normalizedTitle,
        type: newGoalType,
        completed: false,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewGoalTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const renderGoalSection = (type: 'weekly' | 'monthly' | 'yearly', title: string) => {
    const sectionGoals = goals.filter(g => g.type.toLowerCase() === type.toLowerCase());
    const activeGoals = sectionGoals.filter(g => !g.completed);
    const completedGoals = sectionGoals.filter(g => g.completed);
    
    const GoalItem = ({ goal }: { goal: Goal }) => (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
          goal.completed 
            ? 'bg-primary/5 border-primary/20 opacity-60' 
            : 'bg-background border-border hover:border-border'
        }`}
      >
        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleGoal(goal.id, goal.completed, goal.type)}>
          <div className="flex-shrink-0">
            {goal.completed ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : (
              <Circle className="w-6 h-6 text-subtext" />
            )}
          </div>
          <span className={`text-lg transition-colors ${goal.completed ? 'text-subtext line-through' : 'text-text'}`}>
            {goal.title}
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
          title="Delete Goal"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    );

    return (
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-semibold text-text mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          {title}
        </h2>
        
        <div className="space-y-3 flex-1">
          <AnimatePresence>
            {activeGoals.map(goal => <GoalItem key={goal.id} goal={goal} />)}
          </AnimatePresence>

          {activeGoals.length === 0 && (
            <div className="text-center py-6 text-subtext border border-dashed border-border rounded-2xl">
              No active {title.toLowerCase()}.
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-subtext mb-2 uppercase tracking-wider">Completed</h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {completedGoals.map(goal => <GoalItem key={goal.id} goal={goal} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!user || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-subtext font-medium text-lg">Loading your goals...</p>
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Goals</h1>
          <p className="text-subtext">Set targets and earn massive XP for completing them.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-secondary transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            onSubmit={handleAddGoal}
            className="bg-card border border-primary/50 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-text mb-4">Create a New Goal</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                autoFocus
                placeholder="What do you want to achieve?"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="flex-1 bg-background border border-border text-text rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
              <select
                value={newGoalType}
                onChange={(e) => setNewGoalType(e.target.value as any)}
                className="bg-background border border-border text-text rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="weekly">Weekly Goal (25 XP)</option>
                <option value="monthly">Monthly Goal (100 XP)</option>
                <option value="yearly">Yearly Goal (500 XP)</option>
              </select>
              <button type="submit" className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-secondary transition-colors">
                Save
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-6">
        {renderGoalSection('weekly', 'Weekly Goals')}
        {renderGoalSection('monthly', 'Monthly Goals')}
        {renderGoalSection('yearly', 'Yearly Goals')}
      </div>
    </div>
  );
}
