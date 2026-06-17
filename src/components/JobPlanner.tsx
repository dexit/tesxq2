import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User as UserIcon,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { motion } from 'motion/react';

const JobPlanner: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

  // Mock schedule data
  const mockJobs = [
    { id: '1', date: new Date(), time: '09:00', title: 'Boiler Service', customer: 'John Doe', location: 'NW1 4NP', engineer: 'Alex Smith', status: 'completed' },
    { id: '2', date: new Date(), time: '13:30', title: 'Gas Safety (CP12)', customer: 'Skyline Lettings', location: 'SE1 7PB', engineer: 'Alex Smith', status: 'in-progress' },
    { id: '3', date: addDays(new Date(), 1), time: '10:00', title: 'Installation', customer: 'Sarah Connor', location: 'SW1A 1AA', engineer: 'Sam Wilson', status: 'pending' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
      {/* Planner Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-bold text-slate-800">Field Schedule</h2>
          <div className="flex items-center p-1 bg-slate-50 rounded-xl border border-slate-100">
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 text-sm font-semibold text-slate-700 min-w-32 text-center">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 transition-colors">
          <Plus size={18} className="mr-2" />
          Add Appointment
        </button>
      </div>

      {/* Days View */}
      <div className="grid grid-cols-7 flex-1 overflow-hidden divide-x divide-slate-100">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const dayJobs = mockJobs.filter(j => isSameDay(j.date, day));

          return (
            <div key={day.toString()} className="flex flex-col min-w-0">
              <div className={`p-4 text-center border-b border-slate-50 ${isToday ? 'bg-blue-50/50' : ''}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                  {format(day, 'EEE')}
                </p>
                <p className={`text-xl font-black mt-1 ${isToday ? 'text-blue-700' : 'text-slate-800'}`}>
                  {format(day, 'd')}
                </p>
              </div>
              
              <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-slate-50/30">
                {dayJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {job.time}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-emerald-500' : job.status === 'in-progress' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{job.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{job.customer}</p>
                    
                    <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
                      <div className="flex items-center text-[10px] text-slate-400">
                        <MapPin size={10} className="mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-[10px] text-slate-400">
                        <UserIcon size={10} className="mr-1" />
                        {job.engineer}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <button className="w-full py-3 rounded-xl border border-dashed border-slate-200 text-slate-300 hover:text-slate-400 hover:bg-white transition-all flex items-center justify-center group">
                  <Plus size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JobPlanner;
