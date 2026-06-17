import React, { useState, useEffect } from 'react';
import { subscribeToAuth, signInWithGoogle } from './lib/auth';
import { UserProfile } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Wrench, Mail, ShieldAlert } from 'lucide-react';

import ClientManagement from './components/ClientManagement';
import JobPlanner from './components/JobPlanner';
import CertificateGenerator from './components/CertificateGenerator';
import { ClientPortal } from './components/ClientPortal';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Custom states for the public customer portal access
  const [showClientPortal, setShowClientPortal] = useState(false);
  const [directCertId, setDirectCertId] = useState<string | null>(null);

  useEffect(() => {
    // Check if direct CP12 reference token exists in browser URL
    const params = new URLSearchParams(window.location.search);
    const certId = params.get('certId');
    if (certId) {
      setDirectCertId(certId);
      setShowClientPortal(true);
    }

    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Engineer',
          photoURL: firebaseUser.photoURL || '',
          role: 'admin',
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

  if (showClientPortal && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg mr-2"><Wrench size={13} /></span>
            BoilerFlow Client Access Portal
          </h1>
          <button 
            onClick={() => {
              setShowClientPortal(false);
              setDirectCertId(null);
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Engineer Sign In
          </button>
        </header>
        <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
          <ClientPortal 
            user={null} 
            directCertId={directCertId} 
            onClearDirectRoute={() => {
              setShowClientPortal(false);
              setDirectCertId(null);
            }} 
          />
        </div>
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
          className="w-full max-w-sm bg-white p-10 rounded-[32px] shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
              <Wrench size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">BoilerFlow</h1>
            <p className="text-slate-500 text-sm mt-1">Professional Field Service Workspace</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => signInWithGoogle()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl font-bold flex items-center justify-center transition-all group shadow-xl shadow-slate-200"
            >
              <LogIn size={20} className="mr-3 group-hover:translate-x-1 transition-transform" />
              Engineer Sign In
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-250" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold">Or Customers</span>
              </div>
            </div>

            <button 
              onClick={() => setShowClientPortal(true)}
              className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-4 rounded-2xl font-bold flex items-center justify-center transition-all shadow-md"
            >
              <Mail size={18} className="mr-2" />
              Access Client Portal
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-8 font-semibold">
            By accessing BoilerFlow portal, you agree to security conditions.
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
        {activeTab === 'portal' && <ClientPortal user={user} />}
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
