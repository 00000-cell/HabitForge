import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AppContextType {
  xp: number;
  addXp: (amount: number) => void;
  level: number;
  xpToNextLevel: number;
  showConfetti: boolean;
  triggerConfetti: () => void;
  userName: string;
  avatarUrl: string;
  setUserName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [xp, setXp] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.xp !== undefined) {
          setXp(data.xp);
        }
        if (data.name) {
          setUserName(data.name);
        }
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
      })
      .catch(err => console.error('Failed to fetch profile', err));
  }, []);

  // Level thresholds
  const level = xp < 100 ? 1 : xp < 300 ? 2 : Math.floor((xp - 300) / 300) + 3;
  const nextLevelBase = level === 1 ? 100 : level === 2 ? 300 : 300 + (level - 2) * 300;
  const xpToNextLevel = nextLevelBase - xp;

  const addXp = (amount: number) => {
    setXp((prev) => {
      const newXp = prev + amount;
      // Check if leveled up
      const oldLevel = prev < 100 ? 1 : prev < 300 ? 2 : Math.floor((prev - 300) / 300) + 3;
      const newLevel = newXp < 100 ? 1 : newXp < 300 ? 2 : Math.floor((newXp - 300) / 300) + 3;
      if (newLevel > oldLevel) {
        triggerConfetti();
      }
      return newXp;
    });
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000); // Hide after 5 seconds
  };

  return (
    <AppContext.Provider value={{
      xp,
      level,
      xpToNextLevel,
      showConfetti,
      addXp,
      triggerConfetti,
      userName,
      avatarUrl,
      setUserName,
      setAvatarUrl
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
