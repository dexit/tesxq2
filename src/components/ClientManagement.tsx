import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  Building2, 
  MoreHorizontal, 
  Phone, 
  Mail,
  MapPin,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Client, Landlord } from '../types';

const ClientManagement: React.FC = () => {
  const [view, setView] = useState<'individual' | 'landlord'>('individual');
  const [clients, setClients] = useState<Client[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const qClients = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(qClients, (sn) => {
      setClients(sn.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    });

    const qLandlords = query(collection(db, 'landlords'));
    const unsubLandlords = onSnapshot(qLandlords, (sn) => {
      setLandlords(sn.docs.map(d => ({ id: d.id, ...d.data() } as Landlord)));
    });

    return () => {
      unsubClients();
      unsubLandlords();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-fit">
          <button
            onClick={() => setView('individual')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'individual' 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Homeowners
          </button>
          <button
            onClick={() => setView('landlord')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'landlord' 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Landlords & Agencies
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search database..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {view === 'individual' ? (
          clients.map((client) => (
            <ClientCard key={client.id} data={client} type="client" />
          ))
        ) : (
          landlords.map((landlord) => (
            <ClientCard key={landlord.id} data={landlord} type="landlord" />
          ))
        )}

        {/* Empty State */}
        {((view === 'individual' && clients.length === 0) || (view === 'landlord' && landlords.length === 0)) && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <Building2 size={48} strokeWidth={1} className="mb-3 opacity-20" />
            <p>No records found in this category</p>
            <button className="mt-2 text-blue-600 font-semibold text-sm hover:underline">Add New Entry</button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ClientCardProps {
  data: any;
  type: 'client' | 'landlord';
}

const ClientCard: React.FC<ClientCardProps> = ({ data, type }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${type === 'client' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
        {type === 'client' ? <User size={24} /> : <Building2 size={24} />}
      </div>
      <button className="text-slate-300 hover:text-slate-600 p-1">
        <MoreHorizontal size={20} />
      </button>
    </div>

    <h3 className="font-bold text-slate-900 text-lg mb-4 truncate">
      {type === 'client' ? data.name : data.companyName}
    </h3>

    <div className="space-y-3 mb-6">
      <div className="flex items-center text-sm text-slate-500">
        <Phone size={16} className="mr-3 text-slate-400" />
        {data.phone || 'No phone recorded'}
      </div>
      <div className="flex items-center text-sm text-slate-500">
        <Mail size={16} className="mr-3 text-slate-400" />
        <span className="truncate">{data.email || 'No email recorded'}</span>
      </div>
      <div className="flex items-center text-sm text-slate-500">
        <MapPin size={16} className="mr-3 text-slate-400" />
        {type === 'landlord' ? '12 Managed Properties' : '1 Main Property'}
      </div>
    </div>

    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
      <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <Clock size={12} className="mr-1" />
        Last Visit: 2m ago
      </span>
      <button className="text-blue-600 text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
        Manage Record
      </button>
    </div>
  </motion.div>
);

export default ClientManagement;
