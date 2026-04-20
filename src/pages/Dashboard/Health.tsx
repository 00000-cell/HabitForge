import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, Droplets, Moon, HeartPulse, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProgressRing from '../../components/ProgressRing';

export default function Health() {
  const { addXp, triggerConfetti } = useAppContext();
  const [steps, setSteps] = useState(8432);
  const goalSteps = 10000;
  
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [goalWater, setGoalWater] = useState(8);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showWaterReminder, setShowWaterReminder] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.waterIntake !== undefined) {
          setWaterGlasses(data.waterIntake);
        }
        if (data.waterGoal !== undefined) {
          setGoalWater(data.waterGoal);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Simulate step counting
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps(s => Math.min(s + Math.floor(Math.random() * 5), goalSteps));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate water reminder every 30 seconds for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      setShowWaterReminder(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddWater = async () => {
    const newAmount = waterGlasses + 1;
    setWaterGlasses(newAmount);
    addXp(5); // 5 XP per glass
    
    if (newAmount === goalWater) {
      triggerConfetti();
    }

    try {
      await fetch('/api/health/water', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setShowWaterReminder(false);
  };

  const saveWaterGoal = async (newGoal: number) => {
    if (newGoal < 1) newGoal = 1;
    setGoalWater(newGoal);
    setIsEditingGoal(false);
    try {
      await fetch('/api/health/water-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: newGoal })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showWaterReminder && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-[#0ea5e9] text-white p-4 rounded-2xl shadow-[0_10px_40px_rgba(14,165,233,0.4)] flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">Hydration Check!</h4>
              <p className="text-sm text-blue-100">Time to drink some water.</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button 
                onClick={handleAddWater}
                className="px-3 py-1.5 bg-white text-[#0ea5e9] rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
              >
                Drank It
              </button>
              <button 
                onClick={() => setShowWaterReminder(false)}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Health Metrics</h1>
        <p className="text-muted">Track your physical activity and daily wellness.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Step Counter */}
        <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Footprints className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Footprints className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white">Daily Steps</h3>
            </div>
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-white">{steps.toLocaleString()}</span>
                <span className="text-muted mb-1">/ {goalSteps.toLocaleString()}</span>
              </div>
              <div className="w-full bg-background rounded-full h-2 mt-4">
                <motion.div 
                  className="bg-primary h-2 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((steps / goalSteps) * 100, 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Water Tracker */}
        <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplets className="w-24 h-24 text-[#0ea5e9]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#0ea5e9]/20 rounded-lg text-[#0ea5e9]">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white">Hydration</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">{waterGlasses}</span>
                <div className="flex items-center text-muted mb-1 cursor-pointer hover:text-white transition-colors" onClick={() => setIsEditingGoal(true)}>
                  <span className="ml-1 mr-1">/</span>
                  {isEditingGoal ? (
                    <input 
                      type="number" 
                      autoFocus
                      className="w-16 bg-background border border-primary text-white rounded px-1 outline-none text-sm"
                      defaultValue={goalWater}
                      onBlur={(e) => saveWaterGoal(parseInt(e.target.value))}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveWaterGoal(parseInt((e.target as HTMLInputElement).value)) }}
                    />
                  ) : (
                    <span>{goalWater} glasses</span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleAddWater}
                className="w-12 h-12 rounded-full bg-[#0ea5e9]/20 text-[#0ea5e9] flex items-center justify-center hover:bg-[#0ea5e9] hover:text-white transition-colors"
              >
                <PlusIcon />
              </button>
            </div>
            <div className="flex gap-1 mt-4">
              {Array.from({ length: Math.max(goalWater, waterGlasses) }).map((_, i) => (
                <div key={i} className={`h-8 flex-1 rounded-sm ${i < waterGlasses ? 'bg-[#0ea5e9]' : 'bg-background'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Sleep Tracker */}
        <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Sleep</h3>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <ProgressRing radius={50} stroke={8} progress={85} color="#818CF8" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">6h 45m</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted mt-4">Goal: 8h 00m</p>
        </div>

        {/* Heart Rate */}
        <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Avg Heart Rate</h3>
          </div>
          <div className="flex flex-col items-center justify-center h-32">
            <span className="text-5xl font-bold text-white">72</span>
            <span className="text-muted mt-1">bpm</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
