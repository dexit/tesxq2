import React, { useState, useEffect } from 'react';
import { subscribeToAuth, signInWithGoogle } from './lib/auth';
import { UserProfile } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Wrench } from 'lucide-react';

import ClientManagement from './components/ClientManagement';
import JobPlanner from './components/JobPlanner';
import CertificateGenerator from './components/CertificateGenerator';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        // In a real app we'd fetch the profile from firestore here
        // For now, mapping firebase user to our profile
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Engineer',
          photoURL: firebaseUser.photoURL || '',
          role: 'admin', // Default for this demo build
          createdAt: new Date().toISOString()
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-blue-500"
        >
          <Wrench size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[32px] shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
              <Wrench size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BoilerFlow</h1>
            <p className="text-slate-500 mt-2">Professional Field Service Management</p>
          </div>

          <button 
            onClick={() => signInWithGoogle()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl font-bold flex items-center justify-center transition-all group shadow-xl shadow-slate-200"
          >
            <LogIn size={20} className="mr-3 group-hover:translate-x-1 transition-transform" />
            Engineer Sign In
          </button>

          <p className="text-center text-xs text-slate-400 mt-8">
            Access restricted to authorized personnel only.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'planner' && <JobPlanner />}
        {activeTab === 'clients' && <ClientManagement />}
        {activeTab === 'certificates' && <CertificateGenerator />}
        {activeTab === 'settings' && <Placeholder tab="Settings" icon={Wrench} />}
      </AnimatePresence>
    </Layout>
  );
};

const Placeholder = ({ tab, icon: Icon }: { tab: string, icon: any }) => (
  <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
    <div className="p-6 bg-slate-50 rounded-full mb-4">
      <Icon size={48} strokeWidth={1} className="opacity-40" />
    </div>
    <h3 className="text-xl font-bold text-slate-600 mb-2">{tab} Module</h3>
    <p className="max-w-xs text-center text-sm">This module is currently being configured for your fleet. Check back shortly.</p>
  </div>
);

export default App;
