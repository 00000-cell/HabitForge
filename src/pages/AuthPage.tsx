import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
    setError('');
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await addDoc(collection(db, 'activity'), {
          userEmail: userCred.user.email,
          action: 'User logged in',
          timestamp: serverTimestamp()
        });
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        
        await addDoc(collection(db, 'activity'), {
          userEmail: userCred.user.email,
          action: 'User signed up',
          timestamp: serverTimestamp()
        });
      }
      // redirect handled by useEffect
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
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
          <span className="text-xl font-bold text-text tracking-tight">HabitForge</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card w-full max-w-md p-8 rounded-2xl border border-border shadow-2xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-muted">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start your journey to better habits today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-subtext" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-background border border-border text-text rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-subtext" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border text-text rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-subtext" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border text-text rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-colors mt-6 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
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
