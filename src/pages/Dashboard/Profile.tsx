import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Camera, Edit2, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { xp, level, xpToNextLevel, userName, avatarUrl, setUserName, setAvatarUrl } = useAppContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    setEditName(userName || '');
    setEditAvatar(avatarUrl || '');
  }, [userName, avatarUrl]);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, avatarUrl: editAvatar })
      });
      if (res.ok) {
        setUserName(editName);
        setAvatarUrl(editAvatar);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    navigate('/auth?mode=login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile & Settings</h1>
        <p className="text-muted">Manage your personal information and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl text-center">
            <div className="relative inline-block mb-4 group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] mx-auto overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white tracking-widest">
                    {(userName || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">{userName || 'Habit User'}</h2>
            <p className="text-muted text-sm mb-6">Level {level} Explorer</p>
            
            <div className="bg-background border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Total XP</span>
                <span className="font-bold text-primary">{xp}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Next Level</span>
                <span className="font-bold text-white">{xpToNextLevel} XP needed</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-gray-800 rounded-3xl p-4 shadow-xl">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="md:col-span-2">
          <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Personal Information</h3>
              <button 
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                {isEditing ? 'Save' : <Edit2 className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-background border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Avatar Image URL</label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editAvatar}
                    onChange={e => setEditAvatar(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full bg-background border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
