import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-background border border-border shadow-sm text-subtext hover:text-text hover:border-gray-600 transition-all duration-300 hover:scale-105 flex items-center justify-center"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? <Moon className="w-4 h-4 text-text" /> : <Sun className="w-4 h-4 text-yellow-400" />}
    </button>
  );
}
