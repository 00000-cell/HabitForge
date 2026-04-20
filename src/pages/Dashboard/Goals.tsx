import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Circle, Plus, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  type: 'weekly' | 'monthly' | 'yearly';
}

export default function Goals() {
  const { addXp, triggerConfetti } = useAppContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  useEffect(() => {
    fetch('/api/goals')
      .then(res => res.json())
      .then(data => setGoals(data))
      .catch(err => console.error(err));
  }, []);

  const toggleGoal = (id: string) => {
    fetch(`/api/goals/${id}/toggle`, { method: 'PUT' })
      .then(res => res.json())
      .then(updatedGoal => {
        setGoals(prev => prev.map(goal => {
          if (goal.id === id) {
            if (updatedGoal.completed) {
              const xpGained = goal.type === 'weekly' ? 25 : goal.type === 'monthly' ? 100 : 500;
              addXp(xpGained);
              triggerConfetti();
            } else {
              const xpLost = goal.type === 'weekly' ? 25 : goal.type === 'monthly' ? 100 : 500;
              addXp(-xpLost);
            }
            return { ...goal, completed: updatedGoal.completed };
          }
          return goal;
        }));
      })
      .catch(err => console.error(err));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newGoalTitle, type: newGoalType })
    }).then(() => {
      return fetch('/api/goals');
    }).then(res => res.json())
    .then(data => {
      setGoals(data);
      setNewGoalTitle('');
      setIsAdding(false);
    }).catch(err => console.error(err));
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
        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
          goal.completed 
            ? 'bg-primary/5 border-primary/20 opacity-60' 
            : 'bg-background border-gray-800 hover:border-gray-700'
        }`}
        onClick={() => toggleGoal(goal.id)}
      >
        <div className="flex-shrink-0">
          {goal.completed ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : (
            <Circle className="w-6 h-6 text-muted" />
          )}
        </div>
        <span className={`text-lg transition-colors ${goal.completed ? 'text-muted line-through' : 'text-white'}`}>
          {goal.title}
        </span>
      </motion.div>
    );

    return (
      <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          {title}
        </h2>
        
        <div className="space-y-3 flex-1">
          <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Active</h3>
          <AnimatePresence>
            {activeGoals.map(goal => <GoalItem key={goal.id} goal={goal} />)}
          </AnimatePresence>

          {activeGoals.length === 0 && (
            <div className="text-center py-6 text-muted border border-dashed border-gray-800 rounded-2xl">
              No active {title.toLowerCase()}.
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Completed</h3>
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Goals</h1>
          <p className="text-muted">Set targets and earn massive XP for completing them.</p>
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
            <h3 className="text-lg font-semibold text-white mb-4">Create a New Goal</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                autoFocus
                placeholder="What do you want to achieve?"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="flex-1 bg-background border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
              <select
                value={newGoalType}
                onChange={(e) => setNewGoalType(e.target.value as any)}
                className="bg-background border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors cursor-pointer"
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
