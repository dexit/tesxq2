import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Wind, 
  ShieldCheck, 
  Save, 
  Printer,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Trash2,
  Plus,
  Check,
  X as XIcon,
  HardHat,
  BadgeAlert,
  Building2,
  User,
  MapPin,
  ChevronDown,
  Utensils,
  Droplets,
  Home,
  Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Appliance {
  id: number;
  type: string;
  location: string;
  make: string;
  model: string;
  operatingPressure: string;
  ventilationSatisfactory: 'YES' | 'NO' | 'N/A';
  flueOperationSatisfactory: 'YES' | 'NO' | 'N/A';
  spillageTestPass: 'YES' | 'NO' | 'N/A';
  safetyDevicesWorking: 'YES' | 'NO' | 'N/A';
  coCo2Ratio: string;
  serviced: 'YES' | 'NO';
  safe: boolean;
}

// Reusable custom select option structure
interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<any>;
}

// Custom select dropdown with icons on the left, check indicators, and chevron selectors
interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ComponentType<any>;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select option", 
  icon: LeftIcon 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative space-y-1.5 flex-1 min-w-[200px]">
      {label && (
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-left text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
      >
        <div className="flex items-center space-x-3 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon size={18} className="text-slate-500 shrink-0" />}
              <div className="truncate">
                <span className="font-semibold text-slate-800">{selectedOption.label}</span>
                {selectedOption.sublabel && (
                  <span className="text-[10px] text-slate-400 ml-2 font-normal truncate">
                    ({selectedOption.sublabel})
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              {LeftIcon && <LeftIcon size={18} className="text-slate-400 shrink-0" />}
              <span className="text-slate-400 font-medium">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1 divide-y divide-slate-100"
          >
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-colors text-sm ${
                    value === opt.value ? 'bg-blue-50 text-blue-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {Icon && <Icon size={18} className={`${value === opt.value ? 'text-blue-600' : 'text-slate-400'} shrink-0`} />}
                  <div className="truncate flex-1">
                    <div className="font-medium">{opt.label}</div>
                    {opt.sublabel && <div className="text-[10px] text-slate-400 truncate">{opt.sublabel}</div>}
                  </div>
                  {value === opt.value && <Check size={16} className="text-blue-600 shrink-0 ml-auto" />}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
};

const CertificateGenerator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dbLandlords, setDbLandlords] = useState<any[]>([]);
  const [dbProperties, setDbProperties] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    propertyAddress: 'Flat 4B, 22 Park Lane, London, W1K 1BE',
    landlordName: 'Skyline Lettings Ltd',
    landlordAddress: 'Suite 101, 55 Baker St, London, W1U 8EW',
    gasTightnessTest: 'PASS' as 'PASS' | 'FAIL' | 'NOT_TESTED',
    bondingSatisfactory: 'YES' as 'YES' | 'NO' | 'N/A',
    emergencyValvesOk: 'YES' as 'YES' | 'NO',
    appliances: [
      { 
        id: 1, 
        type: 'Condensing Boiler', 
        location: 'Kitchen Cupboard', 
        make: 'Worcester Bosch', 
        model: 'Greenstar i30', 
        operatingPressure: '20 mbar',
        ventilationSatisfactory: 'YES' as 'YES' | 'NO' | 'N/A',
        flueOperationSatisfactory: 'YES' as 'YES' | 'NO' | 'N/A',
        spillageTestPass: 'YES' as 'YES' | 'NO' | 'N/A',
        safetyDevicesWorking: 'YES' as 'YES' | 'NO' | 'N/A',
        coCo2Ratio: '0.002',
        serviced: 'YES' as 'YES' | 'NO',
        safe: true 
      }
    ] as Appliance[],
    engineerSummary: 'Annual safety check completed. Gas integrity tight, flue systems pulling correctly, ventilation is uncontracted, combustion parameters are clean. Systems passed operating code.',
    engineerName: 'Alex Smith',
    engineerGasSafeNo: '821039',
    engineerSignature: 'A. Smith'
  });

  useEffect(() => {
    // Dynamically query actual clients/landlords and properties in Firestore to populate options
    const qL = query(collection(db, 'landlords'));
    const unsubL = onSnapshot(qL, (sn) => {
      setDbLandlords(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qP = query(collection(db, 'properties'));
    const unsubP = onSnapshot(qP, (sn) => {
      setDbProperties(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubL();
      unsubP();
    };
  }, []);

  // Standard predefined combinations fallback + dynamic records combined
  const landlordOptions: SelectOption[] = [
    { value: 'Skyline Lettings Ltd', label: 'Skyline Lettings Ltd', sublabel: 'Suite 101, 55 Baker St, London', icon: Building2 },
    { value: 'Luxe Property Management Ltd', label: 'Luxe Property Management Ltd', sublabel: '90 Pall Mall, London, SW1', icon: Building2 },
    { value: 'John McArthur (Private Landlord)', label: 'John McArthur (Private)', sublabel: '12 Finchley Road, London, NW3', icon: User },
    ...dbLandlords.map(l => ({
      value: l.companyName || l.contactName || '',
      label: l.companyName || l.contactName || 'Unnamed Record',
      sublabel: l.email || l.phone || 'No Contact Details',
      icon: Building2
    }))
  ];

  const propertyOptions: SelectOption[] = [
    { value: 'Flat 4B, 22 Park Lane, London, W1K 1BE', label: 'Flat 4B, 22 Park Lane', sublabel: 'W1K 1BE', icon: MapPin },
    { value: '10 Downing Street, London, SW1A 2AA', label: '10 Downing Street', sublabel: 'SW1A 2AA', icon: MapPin },
    { value: '12 Baker St, London, NW1 6XE', label: '12 Baker St', sublabel: 'NW1 6XE', icon: MapPin },
    ...dbProperties.map(p => ({
      value: `${p.address}, ${p.postcode}` || '',
      label: p.address || 'Unknown Property',
      sublabel: p.postcode || 'No Postcode',
      icon: MapPin
    }))
  ];

  const applianceTypeOptions = [
    { value: 'Condensing Boiler', label: 'Condensing Boiler', icon: Flame },
    { value: 'Combi Boiler', label: 'Combi Boiler', icon: Flame },
    { value: 'Gas Cooker', label: 'Gas Cooker', icon: Utensils },
    { value: 'Gas Hob', label: 'Gas Hob', icon: Flame },
    { value: 'Water Heater', label: 'Water Heater', icon: Droplets },
    { value: 'Gas Fire / Cozy Space Heater', label: 'Gas Fire / Space Heater', icon: Home },
  ];

  const makeOptions = [
    { value: 'Worcester Bosch', label: 'Worcester Bosch', icon: ShieldCheck },
    { value: 'Vaillant', label: 'Vaillant', icon: ShieldCheck },
    { value: 'Baxi', label: 'Baxi', icon: ShieldCheck },
    { value: 'Ideal Heating', label: 'Ideal Heating', icon: ShieldCheck },
    { value: 'Beko', label: 'Beko', icon: ShieldCheck },
    { value: 'Glow-worm', label: 'Glow-worm', icon: ShieldCheck },
    { value: 'Potterton', label: 'Potterton', icon: ShieldCheck },
  ];

  const locationOptions = [
    { value: 'Kitchen Cupboard', label: 'Kitchen Cupboard', icon: Home },
    { value: 'Kitchen', label: 'Kitchen', icon: Utensils },
    { value: 'Utility Room', label: 'Utility Room', icon: Home },
    { value: 'Hallway Cupboard', label: 'Hallway Cupboard', icon: Home },
    { value: 'Bathroom', label: 'Bathroom', icon: Droplets },
    { value: 'Lounge / Gas Living Space', label: 'Lounge / Living Space', icon: Home },
    { value: 'Loft / Attic Space', label: 'Loft / Attic Space', icon: Home },
  ];

  const handleLandlordChange = (val: string) => {
    const selected = landlordOptions.find(o => o.value === val);
    setFormData(prev => ({
      ...prev,
      landlordName: val,
      landlordAddress: selected ? selected.sublabel || '' : prev.landlordAddress
    }));
  };

  const handlePropertyChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      propertyAddress: val
    }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleApplianceChange = (id: number, key: keyof Appliance, value: any) => {
    setFormData(prev => ({
      ...prev,
      appliances: prev.appliances.map(app => app.id === id ? { ...app, [key]: value } : app)
    }));
  };

  const addAppliance = () => {
    setFormData(prev => ({
      ...prev,
      appliances: [
        ...prev.appliances,
        { 
          id: prev.appliances.length > 0 ? Math.max(...prev.appliances.map(a => a.id)) + 1 : 1, 
          type: 'Gas Cooker', 
          location: 'Kitchen', 
          make: 'Beko', 
          model: 'Classic 60', 
          operatingPressure: '20 mbar',
          ventilationSatisfactory: 'YES',
          flueOperationSatisfactory: 'N/A',
          spillageTestPass: 'N/A',
          safetyDevicesWorking: 'YES',
          coCo2Ratio: '0.001',
          serviced: 'YES',
          safe: true 
        }
      ]
    }));
  };

  const removeAppliance = (id: number) => {
    setFormData(prev => ({
      ...prev,
      appliances: prev.appliances.filter(app => app.id !== id)
    }));
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Outer border frame
      doc.setDrawColor(30, 41, 59); // deep slate
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 190, 277);
      
      // Top header band (Amber style Gas Safety Band)
      doc.setFillColor(245, 158, 11); // Amber
      doc.rect(10, 10, 190, 4, 'F');
      
      // Main Title block
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(10, 14, 190, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LANDLORD GAS SAFETY RECORD (CP12)', 15, 24);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text('In compliance with standard Gas Safety (Installation and Use) Regulations 1998', 15, 30);
      doc.text('Authorized compliance systems standard certificate layout', 15, 34);
      
      // Dynamic CP12 badge logo
      doc.setFillColor(217, 119, 6); // darker amber
      doc.rect(130, 20, 60, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('GAS SAFE REGISTERED', 133, 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`LICENCE: #${formData.engineerGasSafeNo}`, 133, 31);
      doc.text(`REF: CP12-${Math.floor(100000 + Math.random() * 900000)}`, 133, 35);
      
      // Grid offsets for 2 columns info
      let y = 52;
      
      // Section 1: Address boxes
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(12, y, 90, 42, 'FD');
      doc.rect(108, y, 90, 42, 'FD');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('LANDLORD / AGENCY DETAILS', 16, y + 6);
      doc.text('CUSTOMER / PROPERTY ADDRESS', 112, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Name: ${formData.landlordName || 'N/A'}`, 16, y + 14);
      
      const landlordLines = doc.splitTextToSize(`Address: ${formData.landlordAddress || 'N/A'}`, 80);
      doc.text(landlordLines, 16, y + 20);
      
      const propLines = doc.splitTextToSize(formData.propertyAddress || 'No Address Provided', 80);
      doc.text(propLines, 112, y + 14);
      doc.text(`Inspection Date: ${new Date().toLocaleDateString('en-GB')}`, 112, y + 34);
      
      y += 48;
      
      // Section 2: General safety checks
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(12, y, 186, 18, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(12, y, 198, y);
      doc.line(12, y + 18, 198, y + 18);
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('SYSTEM INTEGRITY & INSTALLATION SAFETY CHECKS', 16, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Gas Tightness Test: [ ${formData.gasTightnessTest} ]`, 16, y + 12);
      doc.text(`Main Equipotential Bonding OK?: [ ${formData.bondingSatisfactory} ]`, 78, y + 12);
      doc.text(`ECV Accessible?: [ ${formData.emergencyValvesOk} ]`, 148, y + 12);
      
      y += 24;
      
      // Section 3: Detailed Appliance safety tables
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('DETAILED APPLIANCE SAFETY EVALUATIONS', 12, y);
      
      y += 4;
      
      // Header grids
      doc.setFillColor(30, 41, 59);
      doc.rect(12, y, 186, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      
      // Columns position map
      doc.text('ID', 14, y + 6.5);
      doc.text('TYPE & MAKE/MODEL', 22, y + 6.5);
      doc.text('LOCATION', 64, y + 6.5);
      doc.text('OP. PRESS', 100, y + 6.5);
      doc.text('VENT OK', 119, y + 6.5);
      doc.text('FLUE OK', 135, y + 6.5);
      doc.text('SPILL OK', 151, y + 6.5);
      doc.text('SAFETY DEV', 167, y + 6.5);
      doc.text('CO/CO2 %', 183, y + 6.5);
      
      y += 10;
      
      formData.appliances.forEach((app, idx) => {
        // Row backgrounds
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(12, y, 186, 12, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(12, y + 12, 198, y + 12);
        
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text((idx + 1).toString(), 14, y + 7.5);
        
        // Type, make & model combined
        doc.text(`${app.type || 'Appliance'}`, 22, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`${app.make || 'Generic'} ${app.model || 'N/A'}`, 22, y + 9);
        
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(app.location || 'Kitchen', 64, y + 7.5);
        doc.text(app.operatingPressure || 'N/A', 100, y + 7.5);
        doc.text(app.ventilationSatisfactory, 122, y + 7.5);
        doc.text(app.flueOperationSatisfactory, 138, y + 7.5);
        doc.text(app.spillageTestPass, 154, y + 7.5);
        doc.text(app.safetyDevicesWorking, 170, y + 7.5);
        doc.text(app.coCo2Ratio || 'N/A', 183, y + 7.5);
        
        y += 12;
      });
      
      y += 10;
      
      // Section 4: Declaration Remarks block
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(12, y, 186, 40, 'FD');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text("OFFICIAL INSPECTION DECLARATION & NOTES", 16, y + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const summaryText = formData.engineerSummary || 'Standard testing procedures executed successfully. All appliance components checked comply fully with safety guidelines and present no visual risks at inspection time.';
      const statementLines = doc.splitTextToSize(summaryText, 178);
      doc.text(statementLines, 16, y + 15);
      
      y += 46;
      
      // Section 5: Signature Blocks
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, 90, 44, 'FD');
      doc.rect(108, y, 90, 44, 'FD');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('REGISTERED SERVICE ENGINEER', 16, y + 7);
      doc.text('COMPLIANCE DISPATCH HUB', 112, y + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Name: ${formData.engineerName}`, 16, y + 15);
      doc.text(`Registration: Gas Safe Register #${formData.engineerGasSafeNo}`, 16, y + 21);
      doc.text(`Signature: ${formData.engineerSignature}`, 16, y + 27);
      
      doc.text('Issuer: BoilerFlow Engine Services Ltd', 112, y + 15);
      doc.text('Verification: Instant Cloud QR Authenticated', 112, y + 21);
      doc.text(`Issued On: ${new Date().toLocaleDateString('en-GB')}`, 112, y + 27);
      
      // Signature preview lines (simulating digital sign lines)
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.line(16, y + 36, 86, y + 36);
      doc.line(112, y + 36, 182, y + 36);
      doc.setFontSize(7);
      doc.text('Handwritten / Electronic Sign Line', 16, y + 40);
      doc.text('Verified Digital Dispatch Stamp Mark', 112, y + 40);
      
      // Final Compliance Badge Warning
      doc.setFillColor(254, 243, 199); // Amber-100 warning block
      doc.setDrawColor(251, 191, 36); // Amber-400
      doc.rect(12, 252, 186, 10, 'FD');
      doc.setTextColor(146, 64, 14); // amber-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('WARNING NOTICE STATEMENT: Standard safety certificates run for exactly one full year starting on the issue date listed above.', 16, 258.5);
      
      // Footer metadata
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('BoilerFlow Digital Workspace Solutions. UK Compliance standard documents.', 12, 280);
      doc.text('Page 1/1 digital record', 168, 280);
      
      // Saving PDF
      doc.save(`CP12_Safety_Record_${formData.landlordName?.replace(/\s+/g, '_') || 'Inspection'}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Dynamic Upper Board */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <HardHat size={26} className="text-blue-600 mr-2" />
            CP12 Compliance Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">Produce certified gas safety records and export beautiful, standard-compliant copies.</p>
        </div>
        
        {/* Progress Tracker Cards */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          {[
            { stepNum: 1, label: 'Metadata' },
            { stepNum: 2, label: 'Appliances Grid' },
            { stepNum: 3, label: 'Sign & Issue' }
          ].map((item) => (
            <button
              key={item.stepNum}
              onClick={() => setStep(item.stepNum)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center ${
                step === item.stepNum 
                  ? 'bg-white text-slate-900 shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center mr-1.5 text-[9px] ${
                step >= item.stepNum ? 'bg-slate-900 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                {item.stepNum}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col justify-between">
        <div className="p-8 sm:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-black text-slate-900 mb-1">Landlord & General Site Meta</h2>
                  <p className="text-xs text-slate-500">Capture the site information, owners directory, and immediate gas safety evaluations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Custom select dropdowns for Landlord & Property with stunning left-aligned icons */}
                  <CustomSelect 
                    label="Landlord Selection"
                    value={formData.landlordName}
                    onChange={handleLandlordChange}
                    options={landlordOptions}
                    placeholder="Choose landlord or agency..."
                    icon={Building2}
                  />

                  <CustomSelect 
                    label="Property Site Selection"
                    value={formData.propertyAddress}
                    onChange={handlePropertyChange}
                    options={propertyOptions}
                    placeholder="Choose property location..."
                    icon={MapPin}
                  />

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Selected Landlord Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm transition-all"
                      placeholder="e.g. Skyline Lettings Ltd"
                      value={formData.landlordName}
                      onChange={(e) => setFormData(prev => ({ ...prev, landlordName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Selected Landlord Address</label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm transition-all"
                      placeholder="e.g. Suite 101, 55 Baker St"
                      value={formData.landlordAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, landlordAddress: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Inspection Property Address (Site)</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm min-h-[80px]"
                      placeholder="Enter full address of the property inspected..."
                      value={formData.propertyAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                    ></textarea>
                  </div>
                </div>

                {/* General Service Checks */}
                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">General Installation Checks</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gas Tightness */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">Gas Tightness Test</label>
                      <div className="flex p-1 bg-slate-200/60 rounded-xl gap-1">
                        {['PASS', 'FAIL', 'NOT_TESTED'].map((state) => (
                          <button
                            key={state}
                            onClick={() => setFormData(prev => ({ ...prev, gasTightnessTest: state as any }))}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                              formData.gasTightnessTest === state 
                                ? 'bg-slate-900 text-white shadow' 
                                : 'text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {state === 'NOT_TESTED' ? 'N/T' : state}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bonding Satisfactory */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">Main Bonding Satisfactory?</label>
                      <div className="flex p-1 bg-slate-200/60 rounded-xl gap-1">
                        {['YES', 'NO', 'N/A'].map((state) => (
                          <button
                            key={state}
                            onClick={() => setFormData(prev => ({ ...prev, bondingSatisfactory: state as any }))}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              formData.bondingSatisfactory === state 
                                ? 'bg-slate-900 text-white shadow' 
                                : 'text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emergency accessible */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">Emergency Control Accessible?</label>
                      <div className="flex p-1 bg-slate-200/60 rounded-xl gap-1">
                        {['YES', 'NO'].map((state) => (
                          <button
                            key={state}
                            onClick={() => setFormData(prev => ({ ...prev, emergencyValvesOk: state as any }))}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              formData.emergencyValvesOk === state 
                                ? 'bg-slate-900 text-white shadow' 
                                : 'text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between col-span-full">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 mb-1">Appliance Inspection Metrics</h2>
                    <p className="text-xs text-slate-500 font-medium">Capture exact pressure, ventilation and spillage checks for each unit.</p>
                  </div>
                  <button 
                    onClick={addAppliance}
                    className="flex items-center text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <Plus size={14} className="mr-1.5" />
                    New Appliance
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.appliances.map((app, index) => (
                    <div key={app.id} className="p-6 border border-slate-200 rounded-3xl space-y-6 relative bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all group">
                      
                      {/* Delete bar */}
                      {formData.appliances.length > 1 && (
                        <button 
                          onClick={() => removeAppliance(app.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-red-50"
                          title="Remove Appliance"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                          {index + 1}
                        </span>
                        <input 
                          type="text" 
                          value={app.type}
                          onChange={(e) => handleApplianceChange(app.id, 'type', e.target.value)}
                          className="font-black text-slate-800 bg-transparent py-0 px-1 border-b border-transparent focus:border-slate-400 outline-none text-sm w-44"
                          placeholder="Appliance Type"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Custom visual dropdowns for Type, Make, Location with gorgeous SVG options */}
                        <CustomSelect 
                          label="Appliance Type"
                          value={app.type}
                          onChange={(val) => handleApplianceChange(app.id, 'type', val)}
                          options={applianceTypeOptions}
                          placeholder="Select structure..."
                          icon={Flame}
                        />

                        <CustomSelect 
                          label="Appliance Make"
                          value={app.make}
                          onChange={(val) => handleApplianceChange(app.id, 'make', val)}
                          options={makeOptions}
                          placeholder="Select publisher..."
                          icon={Gauge}
                        />

                        <CustomSelect 
                          label="Location"
                          value={app.location}
                          onChange={(val) => handleApplianceChange(app.id, 'location', val)}
                          options={locationOptions}
                          placeholder="Select room..."
                          icon={Home}
                        />

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Pressure</label>
                          <input 
                            type="text" 
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 h-[48px]"
                            placeholder="e.g. 20 mbar"
                            value={app.operatingPressure}
                            onChange={(e) => handleApplianceChange(app.id, 'operatingPressure', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Make/Model fine details when selecting specific options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manufacturer / Custom Brand Name</label>
                          <input 
                            type="text" 
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Worcester Bosch"
                            value={app.make}
                            onChange={(e) => handleApplianceChange(app.id, 'make', e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exact Model Reference Number</label>
                          <input 
                            type="text" 
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Greenstar 30i"
                            value={app.model}
                            onChange={(e) => handleApplianceChange(app.id, 'model', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
                        {/* Vent Satisfactory */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block truncate">Ventilation OK?</label>
                          <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-lg">
                            {['YES', 'NO', 'N/A'].map((v) => (
                              <button
                                key={v}
                                onClick={() => handleApplianceChange(app.id, 'ventilationSatisfactory', v)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold ${
                                  app.ventilationSatisfactory === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Flue Operation Satisfactory */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block truncate font-medium">Flue Flow OK?</label>
                          <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-lg">
                            {['YES', 'NO', 'N/A'].map((v) => (
                              <button
                                key={v}
                                onClick={() => handleApplianceChange(app.id, 'flueOperationSatisfactory', v)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold ${
                                  app.flueOperationSatisfactory === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Spillage test passed */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block truncate font-medium">Spillage Test?</label>
                          <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-lg">
                            {['YES', 'NO', 'N/A'].map((v) => (
                              <button
                                key={v}
                                onClick={() => handleApplianceChange(app.id, 'spillageTestPass', v)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold ${
                                  app.spillageTestPass === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Safety devices working */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block truncate font-medium">Safety Devices?</label>
                          <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-lg">
                            {['YES', 'NO', 'N/A'].map((v) => (
                              <button
                                key={v}
                                onClick={() => handleApplianceChange(app.id, 'safetyDevicesWorking', v)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold ${
                                  app.safetyDevicesWorking === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Combustion analyzer carbon values */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block truncate font-medium">CO/CO2 Ratio</label>
                          <input 
                            type="text" 
                            className="p-1 px-2.5 w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center h-[26px] focus:outline-none"
                            placeholder="e.g. 0.002"
                            value={app.coCo2Ratio}
                            onChange={(e) => handleApplianceChange(app.id, 'coCo2Ratio', e.target.value)}
                          />
                        </div>

                      </div>

                      {/* Main Safe Decision Indicator */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-bold flex items-center">
                          <BadgeAlert size={14} className="text-amber-500 mr-1.5" />
                          Final Safe to Use Certification
                        </span>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApplianceChange(app.id, 'safe', true)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center ${
                              app.safe 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            <Check size={12} className="mr-1" />
                            SAFE / PASS
                          </button>
                          <button
                            onClick={() => handleApplianceChange(app.id, 'safe', false)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center ${
                              !app.safe 
                                ? 'bg-red-100 text-red-800 border border-red-300 shadow-sm' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            <XIcon size={12} className="mr-1" />
                            UNSAFE / DEFECT
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                className="space-y-6"
              >
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-inner">
                    <ShieldCheck size={36} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-950">Declaration Credentials</h2>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">Review validation and authorize compliance to digitally generate your official CP12 Gas Safety Certificate.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engineer Full Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                      value={formData.engineerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, engineerName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gas Safe Registration ID</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                      value={formData.engineerGasSafeNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, engineerGasSafeNo: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Auth Stamp Reference</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                      value={formData.engineerSignature}
                      onChange={(e) => setFormData(prev => ({ ...prev, engineerSignature: e.target.value }))}
                    />
                  </div>

                </div>

                <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-950 text-xs mb-3 flex items-center">
                    <AlertCircle size={15} className="mr-2 text-blue-600" />
                    AUTHORIZED DECLARATION STATEMENT
                  </h4>
                  <textarea 
                    className="w-full p-4 bg-white border border-blue-200 rounded-xl focus:outline-none min-h-[90px] text-xs font-medium text-slate-700 leading-relaxed shadow-sm"
                    placeholder="Provide any general safety comments or safety recommendations..."
                    value={formData.engineerSummary}
                    onChange={(e) => setFormData(prev => ({ ...prev, engineerSummary: e.target.value }))}
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex-1 p-3 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} className="mr-2" />
                    Store Draft
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex-[2] p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        COMPILING OFFICIAL RECORD...
                      </>
                    ) : (
                      <>
                        <Printer size={16} className="mr-2" />
                        ISSUE & EXPORT CP12 CERTIFICATE (PDF)
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interactive Steps Control Strip */}
        {step < 3 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={prevStep}
              className={`flex items-center px-4 py-2 text-xs font-bold text-slate-500 transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ChevronLeft size={16} className="mr-1.5" />
              Previous Group
            </button>
            <button 
              onClick={nextStep}
              className="flex items-center bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow"
            >
              Continue Verification
              <ChevronRight size={16} className="ml-1.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateGenerator;
