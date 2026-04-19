import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Camera, Edit2, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { xp, level, xpToNextLevel } = useAppContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Building better habits every day.',
  });

  const handleSave = () => {
    setIsEditing(false);
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
        {/* Left Column: Avatar & Quick Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl text-center">
            <div className="relative inline-block mb-4 group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] mx-auto overflow-hidden">
                <span className="text-3xl font-bold text-white tracking-widest">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
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
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                {isEditing ? 'Save' : <Edit2 className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-background border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={profile.email}
                    onChange={e => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-background border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Bio</label>
                <textarea
                  disabled={!isEditing}
                  value={profile.bio}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  className="w-full bg-background border border-gray-700 text-white rounded-xl p-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 resize-none h-24"
                />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-background border border-gray-700 text-white rounded-xl hover:border-gray-500 transition-colors">
                <Shield className="w-5 h-5 text-muted" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
