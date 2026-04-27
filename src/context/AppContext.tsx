import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, updateDoc, collection, addDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

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
  user: User | null;
  isAdmin: boolean;
  logout: () => void;
  loadingAuth: boolean;
}

const HOST_EMAIL = "manmal6542@gmail.com";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [xp, setXp] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === HOST_EMAIL);
      if (currentUser) {
        setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || 'User');
        setAvatarUrl(currentUser.photoURL || '');
        
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              lastActive: serverTimestamp(),
              xp: 0
            });
            setXp(0);
          } else {
            const data = userSnap.data();
            setXp(data.xp || 0);
            await updateDoc(userRef, {
              lastLogin: serverTimestamp(),
              lastActive: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Error setting user document:", err);
        }
      } else {
        setUserName('');
        setAvatarUrl('');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);



  useEffect(() => {
    // Periodically update lastActive
    const interval = setInterval(() => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { lastActive: serverTimestamp() }).catch(err => console.error(err));
      }
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, [user]);

  // Level thresholds
  const level = xp < 100 ? 1 : xp < 300 ? 2 : Math.floor((xp - 300) / 300) + 3;
  const nextLevelBase = level === 1 ? 100 : level === 2 ? 300 : 300 + (level - 2) * 300;
  const xpToNextLevel = nextLevelBase - xp;

  const addXp = (amount: number) => {
    setXp((prev) => {
      const newXp = Math.max(0, prev + amount);
      // Check if leveled up
      const oldLevel = prev < 100 ? 1 : prev < 300 ? 2 : Math.floor((prev - 300) / 300) + 3;
      const newLevel = newXp < 100 ? 1 : newXp < 300 ? 2 : Math.floor((newXp - 300) / 300) + 3;
      if (newLevel > oldLevel) {
        triggerConfetti();
      }
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { xp: newXp }).catch(console.error);
      }
      return newXp;
    });
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000); // Hide after 5 seconds
  };

  const logout = async () => {
    if (user) {
      try {
        await addDoc(collection(db, 'activity'), {
          userEmail: user.email,
          action: 'User logged out',
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error(err);
      }
    }
    return firebaseSignOut(auth).catch(err => console.error(err));
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
      setAvatarUrl,
      user,
      isAdmin,
      logout,
      loadingAuth
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
