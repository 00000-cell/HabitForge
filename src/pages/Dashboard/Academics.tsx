import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, BookOpen, Calendar, Edit3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function Academics() {
  const { addXp } = useAppContext();
  
  const [studyDuration, setStudyDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);

  // Notes State
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/notes')
      .then(res => res.json())
      .then(data => {
        if (data.notes) setNotes(data.notes);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      addXp(5);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Exam Countdown (mock)
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 14); // 14 days from now

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (interval) clearInterval(interval);
      setIsActive(false);
      
      if (!isBreak) {
        addXp(50); // XP for completing a study session
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setIsBreak(false);
        setTimeLeft(studyDuration * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak, addXp, studyDuration]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(studyDuration * 60);
  };

  const handleStudyDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      setStudyDuration(val);
      if (!isActive && !isBreak) {
        setTimeLeft(val * 60);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = isBreak ? 100 - ((timeLeft / (5 * 60)) * 100) : 100 - ((timeLeft / (studyDuration * 60)) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Academics</h1>
        <p className="text-muted">Focus on your studies and track your upcoming exams.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Timer & Countdown */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Focus Timer */}
          <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-background">
              <motion.div 
                className={`h-full ${isBreak ? 'bg-secondary' : 'bg-primary'}`}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="flex items-center justify-center gap-2 text-primary mb-4 mt-2">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">{isBreak ? 'Break Time' : 'Focus Session'}</span>
              {!isBreak && !isActive && (
                <button onClick={() => setIsEditingTime(!isEditingTime)} className="ml-2 text-muted hover:text-primary transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {isEditingTime && !isActive && !isBreak ? (
              <div className="flex justify-center items-center mb-8 gap-2">
                <input 
                  type="number" 
                  value={studyDuration}
                  onChange={handleStudyDurationChange}
                  className="w-20 bg-background border border-primary text-white rounded-xl px-2 py-1 text-center text-3xl font-bold focus:outline-none"
                />
                <span className="text-xl text-muted font-medium">min</span>
              </div>
            ) : (
              <div className="text-6xl font-bold text-white mb-8 tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={toggleTimer}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:bg-secondary transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105"
              >
                {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button 
                onClick={resetTimer}
                className="w-12 h-12 rounded-full bg-background border border-gray-700 text-muted flex items-center justify-center hover:text-white hover:border-gray-500 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Exam Countdown */}
          <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg text-secondary">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Next Exam</h3>
            </div>
            <div className="p-4 bg-background border border-gray-800 rounded-xl">
              <div className="text-3xl font-bold text-white mb-2">14<span className="text-lg text-muted font-normal ml-1">days left</span></div>
              <div className="w-full bg-card rounded-full h-2 mt-4">
                <div className="bg-secondary h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notes Area */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Quick Notes</h3>
              </div>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 bg-background border border-gray-800 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors resize-none leading-relaxed"
              placeholder="Jot down important points..."
            />
            
            <div className="mt-4 flex justify-end">
              <button className="px-6 py-2 bg-background border border-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
