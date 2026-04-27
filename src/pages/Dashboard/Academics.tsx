import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, BookOpen, Calendar, Edit3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Academics() {
  const { addXp, user } = useAppContext();
  
  const [studyDuration, setStudyDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);

  // Notes State
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }
    
    setIsInitialLoading(true);
    setFetchError(null);
    let notesLoaded = false;
    let examLoaded = false;
    
    const checkReady = () => {
      if (notesLoaded && examLoaded) {
        setIsInitialLoading(false);
      }
    };

    const fetchNotes = async () => {
      try {
        const snap = await getDoc(doc(db, 'notes', user.uid));
        if (snap.exists() && snap.data().content) {
          setNotes(snap.data().content);
        }
      } catch (err) {
        console.error(err);
        setFetchError("Failed to fetch notes.");
      } finally {
        notesLoaded = true;
        checkReady();
      }
    };
    
    const fetchExamDate = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().examDate) {
          setExamDateStr(snap.data().examDate);
        }
      } catch(err) {
        console.error(err);
        setFetchError("Failed to fetch exam data.");
      } finally {
        examLoaded = true;
        checkReady();
      }
    };

    fetchNotes();
    fetchExamDate();
  }, [user]);

  const handleSaveNotes = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'notes', user.uid), {
        userId: user.uid,
        content: notes,
        timestamp: serverTimestamp()
      });
      addXp(5);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const [examDateStr, setExamDateStr] = useState('');
  const [isEditingExam, setIsEditingExam] = useState(false);

  const handleExamDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setExamDateStr(newDate);
    setIsEditingExam(false);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { examDate: newDate });
      } catch(err) {
        console.error(err);
      }
    }
  };

  const getDaysLeft = () => {
    if (!examDateStr) return 0;
    const diff = new Date(examDateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

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

  if (!user || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-subtext font-medium text-lg">Loading academic workspace...</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Academics</h1>
        <p className="text-subtext">Focus on your studies and track your upcoming exams.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Timer & Countdown */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Focus Timer */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden text-center">
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
                <button onClick={() => setIsEditingTime(!isEditingTime)} className="ml-2 text-subtext hover:text-primary transition-colors">
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
                  className="w-20 bg-background border border-primary text-text rounded-xl px-2 py-1 text-center text-3xl font-bold focus:outline-none"
                />
                <span className="text-xl text-subtext font-medium">min</span>
              </div>
            ) : (
              <div className="text-6xl font-bold text-text mb-8 tracking-tighter tabular-nums">
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
                className="w-12 h-12 rounded-full bg-background border border-border text-subtext flex items-center justify-center hover:text-text hover:border-gray-500 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Exam Countdown */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg text-secondary">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-text">Next Exam</h3>
              <button onClick={() => setIsEditingExam(!isEditingExam)} className="ml-auto text-subtext hover:text-secondary transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            {isEditingExam ? (
              <div className="p-4 bg-background border border-secondary/50 rounded-xl">
                <input 
                  type="date" 
                  value={examDateStr}
                  onChange={handleExamDateChange}
                  className="w-full bg-transparent text-text focus:outline-none"
                />
              </div>
            ) : (
              <div className="p-4 bg-background border border-border rounded-xl">
                <div className="text-3xl font-bold text-text mb-2">{getDaysLeft()}<span className="text-lg text-subtext font-normal ml-1">days left</span></div>
                <div className="w-full bg-card rounded-full h-2 mt-4">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: `${Math.min(100, (getDaysLeft() / 30) * 100)}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notes Area */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-text">Quick Notes</h3>
              </div>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 bg-background border border-border rounded-2xl p-4 text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors resize-none leading-relaxed"
              placeholder="Jot down important points..."
            />
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="px-6 py-2 bg-background border border-border text-text rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
