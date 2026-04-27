import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Check, Plus as PlusIcon, CheckCircle2, Circle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function Health() {
  const { user, addXp, triggerConfetti } = useAppContext();
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [goalWater, setGoalWater] = useState(8);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalCompleted, setGoalCompleted] = useState(false);
  const [extraXpAwarded, setExtraXpAwarded] = useState(0);
  
  // Health Checklist
  const [checklist, setChecklist] = useState([
    { id: 'meditate', label: 'Meditate (10 min)', completed: false },
    { id: 'stretch', label: 'Stretch Body', completed: false },
    { id: 'walk', label: 'Daily Walk', completed: false },
    { id: 'sleep', label: 'Sleep on time', completed: false }
  ]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }
    
    setIsInitialLoading(true);
    setFetchError(null);
    let healthLoaded = false;
    let checklistLoaded = false;
    
    const checkReady = () => {
      if (healthLoaded && checklistLoaded) {
        setIsInitialLoading(false);
      }
    };

    const fetchHealth = async () => {
      try {
        const docRef = doc(db, 'healthData', `${user.uid}_${todayStr}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setWaterGlasses(data.water || 0);
          setGoalWater(data.waterGoal || 8);
          setGoalCompleted(data.goalCompleted || false);
          setExtraXpAwarded(data.extraXpAwarded || 0);
        }
      } catch (err) {
        console.error(err);
        setFetchError("Failed to fetch health data.");
      } finally {
        healthLoaded = true;
        checkReady();
      }
    };

    const fetchChecklist = async () => {
      try {
        const docRef = doc(db, 'healthHabits', `${user.uid}_${todayStr}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setChecklist(prev => prev.map(item => ({
            ...item,
            completed: data[item.id] || false
          })));
        }
      } catch (err) {
        console.error(err);
        setFetchError("Failed to fetch health checklist.");
      } finally {
        checklistLoaded = true;
        checkReady();
      }
    };
    
    fetchHealth();
    fetchChecklist();
  }, [user, todayStr]);

  const saveWaterData = async (newWater: number, newGoal: number, newGoalCompleted: boolean, newExtra: number) => {
    if (!user) return;
    const docRef = doc(db, 'healthData', `${user.uid}_${todayStr}`);
    await setDoc(docRef, {
      water: newWater,
      waterGoal: newGoal,
      goalCompleted: newGoalCompleted,
      extraXpAwarded: newExtra,
      timestamp: new Date()
    }, { merge: true });
  };

  const handleAddWater = async () => {
    const newWater = waterGlasses + 1;
    let newGoalCompleted = goalCompleted;
    let newExtra = extraXpAwarded;
    
    if (newWater === goalWater && !goalCompleted) {
      newGoalCompleted = true;
      addXp(15);
      triggerConfetti();
    }
    
    if (newWater > goalWater && (newWater - goalWater) % 10 === 0) {
      addXp(10);
      newExtra += 10;
      triggerConfetti();
    }
    
    setWaterGlasses(newWater);
    setGoalCompleted(newGoalCompleted);
    setExtraXpAwarded(newExtra);
    
    await saveWaterData(newWater, goalWater, newGoalCompleted, newExtra);
  };

  const saveWaterGoal = async (newGoal: number) => {
    if (isNaN(newGoal) || newGoal <= 0) newGoal = 8;
    setGoalWater(newGoal);
    setIsEditingGoal(false);
    
    let newGoalCompleted = goalCompleted;
    if (waterGlasses >= newGoal && !goalCompleted) {
      newGoalCompleted = true;
      addXp(15);
      triggerConfetti();
    } else if (waterGlasses < newGoal) {
      newGoalCompleted = false;
    }
    setGoalCompleted(newGoalCompleted);
    await saveWaterData(waterGlasses, newGoal, newGoalCompleted, extraXpAwarded);
  };

  const toggleChecklist = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    const newStatus = !currentStatus;
    
    // Update state
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: newStatus } : item
    ));
    
    // XP
    if (newStatus) {
      addXp(5);
    } else {
      addXp(-5);
    }
    
    // Save to Firestore
    const docRef = doc(db, 'healthHabits', `${user.uid}_${todayStr}`);
    await setDoc(docRef, {
      [id]: newStatus,
      timestamp: new Date()
    }, { merge: true });
  };

  if (!user || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-[#0ea5e9] border-t-transparent rounded-full" />
          <p className="text-subtext font-medium text-lg">Loading health data...</p>
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
      <AnimatePresence>
        {goalCompleted && (
          <motion.div 
            initial={{ opacity: 0, x: 50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-5 right-5 z-50 bg-card border border-border shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 rounded-2xl flex flex-col gap-1 min-w-[260px]"
          >
            <div className="flex items-center gap-2 text-text font-bold">
              <Check className="w-5 h-5 text-[#0ea5e9]" />
              <span>Hydration goal completed</span>
            </div>
            <div className="text-sm text-subtext font-medium ml-7">
              +15 XP earned
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Health Metrics</h1>
        <p className="text-subtext">Track your physical activity and daily wellness.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Water Tracker */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplets className="w-32 h-32 text-[#0ea5e9]" />
          </div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-3 bg-[#0ea5e9]/20 rounded-xl text-[#0ea5e9]">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-xl text-text">Hydration</h3>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold text-text tabular-nums">{waterGlasses}</span>
              <div className="flex items-center text-subtext mb-2 cursor-pointer hover:text-text transition-colors" onClick={() => setIsEditingGoal(true)}>
                <span className="ml-1 mr-1 text-2xl">/</span>
                {isEditingGoal ? (
                  <input 
                    type="number" 
                    autoFocus
                    className="w-16 bg-background border border-primary text-text rounded px-1 outline-none text-xl"
                    defaultValue={goalWater}
                    onBlur={(e) => saveWaterGoal(parseInt(e.target.value))}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveWaterGoal(parseInt((e.target as HTMLInputElement).value)) }}
                  />
                ) : (
                  <span className="text-2xl">{goalWater}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleAddWater}
                className="w-16 h-16 rounded-full bg-[#0ea5e9]/20 text-[#0ea5e9] flex items-center justify-center hover:bg-[#0ea5e9] hover:text-white transition-colors shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:scale-105"
              >
                <PlusIcon className="w-8 h-8" />
              </button>
            </div>
          </div>
          
          <div className="mt-8 flex gap-1.5 flex-wrap relative z-10">
            {[...Array(Math.max(goalWater, waterGlasses))].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`h-3 flex-1 min-w-[20px] rounded-full transition-all duration-500 ${
                  i < waterGlasses 
                    ? goalCompleted 
                      ? 'bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,233,0.3)]' 
                      : 'bg-[#0ea5e9]' 
                    : 'bg-background border border-border'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Health Habits Checklist */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-semibold text-text mb-6">Daily Checklist</h2>
          <div className="space-y-3 flex-1">
            {checklist.map(item => (
              <div 
                key={item.id}
                onClick={() => toggleChecklist(item.id, item.completed)}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  item.completed 
                    ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                    : 'bg-background border-border hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="shrink-0">
                    {item.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : (
                      <Circle className="w-6 h-6 text-subtext" />
                    )}
                  </div>
                  <span className={`text-lg font-medium transition-colors ${item.completed ? 'text-subtext line-through' : 'text-text'}`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-xs text-subtext font-normal ml-2">(+5 XP)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
