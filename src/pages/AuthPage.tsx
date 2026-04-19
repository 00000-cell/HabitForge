import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication: navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 relative z-10">
        <Link to="/" className="flex items-center gap-2 inline-flex">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">HabitForge</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card w-full max-w-md p-8 rounded-2xl border border-gray-800 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-muted">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start your journey to better habits today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-background border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-background border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-colors mt-6 flex items-center justify-center gap-2 group"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center text-muted">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => navigate('/auth?mode=signup')} className="text-primary hover:text-secondary font-medium transition-colors">
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => navigate('/auth?mode=login')} className="text-primary hover:text-secondary font-medium transition-colors">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
