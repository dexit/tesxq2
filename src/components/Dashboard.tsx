import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job, JobStatus } from '../types';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    completed: 0,
    alerts: 0
  });

  useEffect(() => {
    // In a real app, these would be real queries
    const q = query(collection(db, 'jobs'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setTasks(jobs);
      
      const active = jobs.filter(j => j.status === 'in-progress').length;
      const pending = jobs.filter(j => j.status === 'pending').length;
      const completed = jobs.filter(j => j.status === 'completed').length;
      setStats({ active, pending, completed, alerts: 2 });
    });

    return () => unsubscribe();
  }, []);

  const statCards = [
    { label: 'Active Jobs', value: stats.active, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Tasks', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Today', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Urgent Alerts', value: stats.alerts, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good Morning, Dispatch</h1>
          <p className="text-slate-500">Here is what's happening across the field today.</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <CalendarIcon size={18} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{format(new Date(), 'EEEE, do MMMM')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <TrendingUp size={20} className="text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Jobs List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Daily Schedule</h3>
            <button className="text-blue-600 text-sm font-semibold hover:underline">View Planner</button>
          </div>
          <div className="flex-1 p-6">
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((job) => (
                  <div 
                    key={job.id} 
                    className="group p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(job.startTime), 'MMM')}</span>
                        <span className="text-lg font-bold text-slate-700 leading-none">{format(new Date(job.startTime), 'dd')}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{job.title}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="flex items-center text-xs text-slate-500">
                            <Clock size={14} className="mr-1" />
                            {format(new Date(job.startTime), 'HH:mm')}
                          </span>
                          <span className="flex items-center text-xs text-slate-500">
                            <MapPin size={14} className="mr-1" />
                            Property ID: {job.propertyId.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <StatusBadge status={job.status} />
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Briefcase size={48} strokeWidth={1} className="mb-3 opacity-20" />
                <p>No jobs scheduled for today</p>
                <button className="mt-4 text-sm font-semibold text-blue-600 hover:underline">Assign a Task</button>
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown & Notifications */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Network Health</h3>
            <div className="space-y-6">
              <HealthItem label="Calendar Sync" status="operational" />
              <HealthItem label="Gmail Reminders" status="operational" />
              <HealthItem label="Engineer Portal" status="warning" />
              <HealthItem label="API Services" status="operational" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-4 opacity-80">Use the dispatch assistant to optimize your engineer routes for today.</p>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Ask Gemini
              </button>
            </div>
            <Briefcase size={120} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    'in-progress': 'bg-blue-50 text-blue-600 border-blue-100',
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    cancelled: 'bg-slate-50 text-slate-400 border-slate-100',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
};

const HealthItem: React.FC<{ label: string; status: 'operational' | 'warning' | 'error' }> = ({ label, status }) => {
  const statusColor = {
    operational: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600 font-medium">{label}</span>
      <div className="flex items-center space-x-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{status}</span>
        <div className={`w-2 h-2 rounded-full ${statusColor[status]} animate-pulse`}></div>
      </div>
    </div>
  );
};

export default Dashboard;
