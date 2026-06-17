import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Wind, 
  ShieldCheck, 
  Save, 
  Printer,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CertificateGenerator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyAddress: '',
    landlordName: '',
    appliances: [
      { id: 1, type: 'Boiler', location: 'Kitchen', make: 'Worcester', model: 'Greenstar', flueType: 'Balanced', inspected: true, safe: true }
    ],
    engineerSummary: '',
    nextInspectionDate: ''
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Header */}
      <div className="flex items-center justify-between px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
              step >= s ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
            {s < 3 && (
              <div className={`w-16 sm:w-32 h-1 mx-2 rounded-full ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 sm:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">General Details</h2>
                  <p className="text-slate-500">Confirm the property and ownship details for this inspection.</p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Property Address</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[100px]"
                      placeholder="Enter full site address..."
                    ></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Landlord/Agency Name</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="e.g. Skyline Lettings Ltd"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Appliance Checks</h2>
                    <p className="text-slate-500">Document inspection results for each appliance on site.</p>
                  </div>
                  <button className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                    <ShieldCheck size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.appliances.map((app) => (
                    <div key={app.id} className="p-6 border border-slate-200 rounded-3xl space-y-6 relative group">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Flame size={18} className="text-rose-500" />
                            <h4 className="font-bold text-slate-800">Main {app.type}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input type="text" className="p-3 bg-slate-50 border rounded-xl text-sm" placeholder="Make" value={app.make} />
                            <input type="text" className="p-3 bg-slate-50 border rounded-xl text-sm" placeholder="Model" value={app.model} />
                          </div>
                        </div>
                        <div className="w-full sm:w-64 space-y-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Wind size={18} className="text-blue-500" />
                            <h4 className="font-bold text-slate-800">Safety Status</h4>
                          </div>
                          <div className="flex p-1 bg-slate-100 rounded-xl">
                            <button className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm">PASS</button>
                            <button className="flex-1 py-2 text-slate-500 text-xs font-bold">FAIL</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-200 hover:text-blue-500 transition-all">
                    + Add Another Appliance
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Ready to Issue</h2>
                  <p className="text-slate-500 max-w-sm mx-auto">Review the summary and sign below to officially issue this Gas Safety Record.</p>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center">
                    <AlertCircle size={18} className="mr-2" />
                    Engineer's Declaration
                  </h4>
                  <textarea 
                    className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:outline-none min-h-[120px] text-sm"
                    placeholder="Enter any necessary comments or advisory notes..."
                  ></textarea>
                </div>

                <div className="flex items-center justify-center space-x-4 pt-6">
                  <button className="flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center hover:bg-slate-50">
                    <Save size={20} className="mr-2" />
                    Save Draft
                  </button>
                  <button className="flex-[2] p-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-blue-700 shadow-xl shadow-blue-200">
                    <Printer size={20} className="mr-2" />
                    Issue & Email PDF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        {step < 3 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={prevStep}
              className={`flex items-center px-6 py-3 font-bold text-slate-500 transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ChevronLeft size={20} className="mr-2" />
              Back
            </button>
            <button 
              onClick={nextStep}
              className="flex items-center bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-100"
            >
              Next Step
              <ChevronRight size={20} className="ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateGenerator;
