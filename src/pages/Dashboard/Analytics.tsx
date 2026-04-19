import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { Activity, Flame, Target, TrendingUp } from 'lucide-react';

const WEEKLY_DATA = [
  { name: 'Mon', habits: 4, study: 2, health: 3 },
  { name: 'Tue', habits: 5, study: 4, health: 4 },
  { name: 'Wed', habits: 3, study: 1, health: 2 },
  { name: 'Thu', habits: 6, study: 5, health: 5 },
  { name: 'Fri', habits: 5, study: 3, health: 4 },
  { name: 'Sat', habits: 7, study: 0, health: 6 },
  { name: 'Sun', habits: 6, study: 2, health: 5 },
];

const MONTHLY_TREND = [
  { name: 'Week 1', score: 65 },
  { name: 'Week 2', score: 72 },
  { name: 'Week 3', score: 85 },
  { name: 'Week 4', score: 92 },
];

export default function Analytics() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-muted">Understand your trends and optimize your routine.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Activity, label: 'Completion Rate', value: '84%', trend: '+5%', color: 'text-primary', bg: 'bg-primary/20' },
          { icon: Flame, label: 'Longest Streak', value: '24 Days', trend: 'Active', color: 'text-orange-500', bg: 'bg-orange-500/20' },
          { icon: Target, label: 'Goals Met', value: '12', trend: '+2 this week', color: 'text-green-500', bg: 'bg-green-500/20' },
          { icon: TrendingUp, label: 'Productivity Score', value: '92/100', trend: '+8 pts', color: 'text-secondary', bg: 'bg-secondary/20' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${stat.bg} rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-muted font-medium mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Weekly Activity</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1F2937' }}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="habits" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" name="Habits" />
                <Bar dataKey="study" fill="#3B82F6" radius={[0, 0, 0, 0]} stackId="a" name="Study" />
                <Bar dataKey="health" fill="#10B981" radius={[0, 0, 0, 0]} stackId="a" name="Health" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-card border border-gray-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Monthly Score Trend</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="score" stroke="#A78BFA" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
