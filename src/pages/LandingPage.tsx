import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, Target, Brain, Shield, ChevronRight } from 'lucide-react';

const Features = [
  {
    icon: <Activity className="w-6 h-6 text-primary" />,
    title: 'Streak Tracking',
    description: 'Build consistency with visual streak indicators and keep the momentum going.',
  },
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: 'Progress Insights',
    description: 'Understand your performance over time with detailed charts and stats.',
  },
  {
    icon: <Brain className="w-6 h-6 text-primary" />,
    title: 'Focus System',
    description: 'Built-in Pomodoro timers and study tools to keep you in the zone.',
  },
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: 'Minimal Interface',
    description: 'A distraction-free, premium dark mode dashboard designed for deep work.',
  },
];

const Steps = [
  { step: '1', title: 'Create your habit', description: 'Set specific goals and define what success looks like.' },
  { step: '2', title: 'Track daily progress', description: 'Log your wins each day and watch your stats grow.' },
  { step: '3', title: 'Build streaks and improve', description: 'Level up your XP and become the best version of yourself.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-card bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">HabitForge</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-muted hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted hover:text-white transition-colors">How it Works</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="text-text hover:text-white transition-colors">Login</Link>
            <Link to="/auth?mode=signup" className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight max-w-4xl leading-tight">
            Build Better Habits. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Become Unstoppable.
            </span>
          </h1>
          <p className="mt-6 text-xl text-muted max-w-2xl mx-auto">
            Track your habits, stay consistent, and build the life you actually want with the ultimate premium life dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup" className="group px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg transition-all hover:bg-secondary shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2">
              Start Tracking Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/auth?mode=login" className="px-8 py-4 bg-card text-white rounded-xl font-semibold text-lg transition-all hover:bg-gray-800 border border-gray-800">
              View Dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Everything you need to succeed</h2>
            <p className="text-muted mt-4">Powerful tools combined in one minimal interface.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-card p-6 rounded-2xl border border-gray-800 hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(139,92,246,0.1)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-muted">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {Steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative"
              >
                <div className="w-16 h-16 bg-card border border-primary/30 rounded-full flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-muted max-w-xs mx-auto">{step.description}</p>
                {idx < Steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-transparent pointer-events-none" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card py-8 text-center text-muted">
        <p>© {new Date().getFullYear()} HabitForge. Build better habits.</p>
      </footer>
    </div>
  );
}
