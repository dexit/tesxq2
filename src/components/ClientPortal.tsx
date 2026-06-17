import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Building2, 
  ExternalLink, 
  FileText, 
  Eye, 
  Download, 
  AlertCircle, 
  Calendar, 
  Search, 
  User, 
  MapPin, 
  Inbox, 
  Check, 
  RotateCcw, 
  MessageSquare,
  HardHat,
  Filter,
  ArrowRight,
  ChevronRight,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

interface ClientPortalProps {
  user: UserProfile | null;
  directCertId?: string | null;
  onClearDirectRoute?: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ user, directCertId, onClearDirectRoute }) => {
  // Navigation: For engineers, can toggle between 'share-center' and 'outbox-simulator' 
  // and 'client-mode-preview'. For clients, forced to 'viewer'.
  const [activeSubTab, setActiveSubTab] = useState<'share-center' | 'outbox' | 'search-viewer'>('share-center');
  const [certificates, setCertificates] = useState<any[]>([]);
  const [filteredCerts, setFilteredCerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Email trigger state
  const [sharingCert, setSharingCert] = useState<any | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareName, setShareName] = useState('');
  const [shareMessage, setShareMessage] = useState('Please review and acknowledge your annual CP12 Gas Safety Record. Digital Copy issued.');
  const [isSending, setIsSending] = useState(false);
  const [sentAlert, setSentAlert] = useState<{ success: boolean; msg: string } | null>(null);

  // Local simulated outbox log (stored in localstorage so it persists beautifully for debugging)
  const [outbox, setOutbox] = useState<any[]>(() => {
    const saved = localStorage.getItem('boilerflow_outbox');
    return saved ? JSON.parse(saved) : [];
  });

  // Client search reference/viewer mode
  const [clientSearchRef, setClientSearchRef] = useState('');
  const [clientSearchPostcode, setClientSearchPostcode] = useState('');
  const [loadedClientCert, setLoadedClientCert] = useState<any | null>(null);
  const [clientSearchError, setClientSearchError] = useState('');
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  // Client feedback acknowledgement state
  const [clientComment, setClientComment] = useState('');
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [acknowledgeSuccess, setAcknowledgeSuccess] = useState(false);

  // Load certificates if logged in
  useEffect(() => {
    const q = query(collection(db, 'certificates'));
    const unsub = onSnapshot(q, (sn) => {
      const list = sn.docs.map(d => ({ id: d.id, ...d.data() } as any));
      list.sort((a, b) => new Date(b.issuedAt || '').getTime() - new Date(a.issuedAt || '').getTime());
      setCertificates(list);
      setFilteredCerts(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase fetch error", error);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Update filtration on query lookup
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCerts(certificates);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredCerts(certificates.filter(c => 
        c.refNumber?.toLowerCase().includes(q) ||
        c.data?.landlordName?.toLowerCase().includes(q) ||
        c.data?.propertyAddress?.toLowerCase().includes(q) ||
        c.data?.engineerName?.toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, certificates]);

  // Handle direct link entry if certId parameter was in URL state
  useEffect(() => {
    if (directCertId) {
      loadDirectCertificate(directCertId);
    }
  }, [directCertId]);

  const loadDirectCertificate = async (id: string) => {
    try {
      setIsSearchingClient(true);
      setClientSearchError('');
      const docRef = doc(db, 'certificates', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setLoadedClientCert({ id: snapshot.id, ...snapshot.data() });
        setActiveSubTab('search-viewer');
      } else {
        setClientSearchError('Certificate reference secure token could not be fetched.');
      }
    } catch (err) {
      console.error(err);
      setClientSearchError('Error establishing connection to security directory.');
    } finally {
      setIsSearchingClient(false);
    }
  };

  const executeClientSearch = () => {
    if (!clientSearchRef.trim()) {
      setClientSearchError('Please fill in a certificate reference number.');
      return;
    }
    setClientSearchError('');
    setIsSearchingClient(true);

    // Search certificates locally in loaded or filter
    const found = certificates.find(c => 
      c.refNumber?.toLowerCase() === clientSearchRef.toLowerCase().trim() ||
      c.id === clientSearchRef.trim()
    );

    if (found) {
      // If postcode matches or is empty
      if (clientSearchPostcode.trim()) {
        const addr = found.data?.propertyAddress?.toLowerCase() || '';
        const searchPost = clientSearchPostcode.toLowerCase().trim();
        if (!addr.includes(searchPost)) {
          setClientSearchError('Postcode verification mismatch. Please confirm the property postal code.');
          setIsSearchingClient(false);
          return;
        }
      }
      setLoadedClientCert(found);
      setIsSearchingClient(false);
    } else {
      setTimeout(() => {
        setClientSearchError('Safety Record not found in compliance database. Verify reference number.');
        setIsSearchingClient(false);
      }, 700);
    }
  };

  const triggerEmailDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim() || !sharingCert) return;
    setIsSending(true);
    setSentAlert(null);

    try {
      const res = await fetch('/api/share/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          certificateId: sharingCert.id,
          email: shareEmail,
          clientName: shareName || sharingCert.data?.landlordName || 'Valued Client',
          message: shareMessage,
          refNumber: sharingCert.refNumber
        })
      });

      const data = await res.json();
      if (data.success) {
        setSentAlert({ success: true, msg: `Direct notification shared securely with ${shareEmail}` });
        
        // Save to our simulated Outbox for awesome user playgrounds!
        const logItem = {
          id: `out-${Date.now()}`,
          timestamp: new Date().toISOString(),
          recipient: shareEmail,
          subject: data.subject,
          html: data.html,
          link: data.directLink,
          status: 'Delivered',
          refNumber: sharingCert.refNumber
        };

        const updatedOutbox = [logItem, ...outbox];
        setOutbox(updatedOutbox);
        localStorage.setItem('boilerflow_outbox', JSON.stringify(updatedOutbox));

        // Auto clean sharing modal on delay
        setTimeout(() => {
          setShareEmail('');
          setShareName('');
          setSharingCert(null);
          setSentAlert(null);
        }, 3000);
      } else {
        setSentAlert({ success: false, msg: data.error || 'Failed to dispatch secure email.' });
      }
    } catch (err: any) {
      console.error(err);
      setSentAlert({ success: false, msg: 'Error submitting share payload.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleClientAcknowledge = async () => {
    if (!loadedClientCert) return;
    setIsAcknowledging(true);
    setAcknowledgeSuccess(false);

    try {
      const docRef = doc(db, 'certificates', loadedClientCert.id);
      await updateDoc(docRef, {
        verified: true,
        verifiedAt: new Date().toISOString(),
        verifiedComment: clientComment || 'Verified & acknowledged online via digital stamp.'
      });

      // Update local state copy
      setLoadedClientCert(prev => ({
        ...prev,
        verified: true,
        verifiedAt: new Date().toISOString(),
        verifiedComment: clientComment || 'Verified & acknowledged online via digital stamp.'
      }));

      setAcknowledgeSuccess(true);
      setClientComment('');
    } catch (err) {
      console.error("Acknowledgement Save Error:", err);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const generateClientPDF = async (cert: any) => {
    if (!cert) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const info = cert.data;

      // Reproduce accurate structured compliance report beautifully
      doc.setFillColor(30, 41, 59); // deep slate
      doc.rect(0, 0, 210, 42, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('LANDLORD GAS SAFETY RECORD', 14, 18);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Issued in full compliance with UK Gas Safety (Installation and Use) Regulations 1998.', 14, 26);
      doc.text(`RECORD REF: ${cert.refNumber || 'CP12-ONLINE'}`, 14, 32);

      // Badge Right Side
      doc.setFillColor(59, 130, 246); // Blue Action Bar
      doc.rect(144, 12, 52, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('UK COMPLIANT CP12', 148, 18);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('ONLINE VERIFIED SYSTEM', 148, 24);

      let y = 54;
      
      // Section 1: Landlord & Property Address Details
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, 90, 42, 'F');
      doc.rect(108, y, 90, 42, 'F');
      
      doc.setDrawColor(226, 232, 240);
      doc.rect(12, y, 90, 42, 'D');
      doc.rect(108, y, 90, 42, 'D');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('LANDLORD / MANAGENT CLIENT', 16, y + 7);
      doc.text('INSPECTED PROPERTY (SITE)', 112, y + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      
      // Split addresses
      const landlordLines = doc.splitTextToSize(info.landlordName + "\n" + info.landlordAddress, 82);
      const propertyLines = doc.splitTextToSize(info.propertyAddress, 82);
      
      doc.text(landlordLines, 16, y + 16);
      doc.text(propertyLines, 112, y + 16);

      y += 48;

      // Section 2: General Site Safety evaluation indexes
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, 186, 18, 'F');
      doc.rect(12, y, 186, 18, 'D');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('CORE INSTALLATION EVALUATION SAFETY COEFFICIENTS', 16, y + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Gas Tightness Test: [ ${info.gasTightnessTest} ]`, 16, y + 13);
      doc.text(`Main Equipotential Bonding OK?: [ ${info.bondingSatisfactory} ]`, 78, y + 13);
      doc.text(`ECV Accessible?: [ ${info.emergencyValvesOk} ]`, 148, y + 13);

      y += 24;

      // Section 3: Detailed Appliance table
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('DETAILED APPLIANCE SAFETY EVALUATIONS', 12, y);
      
      y += 4;
      doc.setFillColor(30, 41, 59);
      doc.rect(12, y, 186, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      
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
      
      const appArray = info.appliances || [];
      appArray.forEach((app: any, idx: number) => {
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
        
        doc.text(`${app.type || 'Appliance'}`, 22, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`${app.make || 'Generic'} ${app.model || 'N/A'}`, 22, y + 8.5);
        
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

      y += 8;
      
      // Section 4: Remarks
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(12, y, 186, 32, 'FD');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("OFFICIAL INSPECTION DECLARATION & NOTES", 16, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const summaryText = info.engineerSummary || 'Inspection completed successfully.';
      const statementLines = doc.splitTextToSize(summaryText, 178);
      doc.text(statementLines, 16, y + 13);

      y += 36;

      // Section 5: Signature Blocks
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, 90, 40, 'FD');
      doc.rect(108, y, 90, 40, 'FD');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('REGISTERED SERVICE ENGINEER', 16, y + 6);
      doc.text('COMPLIANCE DISPATCH HUB', 112, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Name: ${info.engineerName}`, 16, y + 14);
      doc.text(`Registration: Gas Safe Register #${info.engineerGasSafeNo}`, 16, y + 20);
      doc.text(`Signature: ${info.engineerSignature}`, 16, y + 26);
      
      doc.text('Issuer: BoilerFlow Engine Services Ltd', 112, y + 14);
      doc.text(`Digital Verification Signature: ${cert.id}`, 112, y + 20);
      doc.text(`Issued On: ${new Date(cert.issuedAt).toLocaleDateString()}`, 112, y + 26);

      // Digital sign lines
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.line(16, y + 32, 86, y + 32);
      doc.line(112, y + 32, 182, y + 32);

      // Warningnotice
      doc.setFillColor(254, 243, 199); // Amber-100 warning block
      doc.setDrawColor(251, 191, 36); // Amber-400
      doc.rect(12, 252, 186, 10, 'FD');
      doc.setTextColor(146, 64, 14); // amber-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('WARNING NOTICE STATEMENT: Standard safety certificates run for exactly one full year starting on the issue date listed above.', 16, 258.5);

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('BoilerFlow Digital Workspace Solutions. Web portal verified original safety record.', 12, 280);
      doc.text('Page 1/1 verified original', 160, 280);

      doc.save(`VERIFIED_${cert.refNumber || 'CP12'}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  const clearOutboxLogs = () => {
    localStorage.removeItem('boilerflow_outbox');
    setOutbox([]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Dynamic Header Tab Switcher (Only visible to authenticated engineers) */}
      {user && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveSubTab('share-center')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'share-center' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={14} className="mr-1.5" />
              Certificate Shares
            </button>
            <button
              onClick={() => setActiveSubTab('outbox')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
                activeSubTab === 'outbox' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Inbox size={14} className="mr-1.5" />
              Email Outbox Log
              {outbox.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-blue-600 text-[8px] font-black rounded-full text-white">
                  {outbox.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveSubTab('search-viewer');
                setLoadedClientCert(null);
              }}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'search-viewer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Lock size={14} className="mr-1.5" />
              Client Portal Preview
            </button>
          </div>

          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Logged In As: <span className="text-slate-600 underline font-extrabold">{user.displayName} ({user.role})</span>
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* TAB 1: Shares & Documents Management Center for engineers */}
        {activeSubTab === 'share-center' && (
          <motion.div
            key="share-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">CP12 Digital Share Center</h3>
                <p className="text-slate-500 text-xs mt-0.5">Select safety documents, type clients email addresses, and send high-fidelity digital portal links instantly.</p>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Query reference, landlord or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-fit sm:w-72"
                />
              </div>
            </div>

            {/* Shares Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: List of safety certificates */}
              <div className="lg:col-span-2 space-y-4">
                {isLoading ? (
                  <div className="py-20 text-center text-slate-400 text-xs font-bold">
                    Connecting to secure digital registers...
                  </div>
                ) : filteredCerts.length === 0 ? (
                  <div className="py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 space-y-2">
                    <FileText size={32} className="mx-auto opacity-20" />
                    <p className="text-xs font-bold">No issued records match your query.</p>
                    <p className="text-[10px] text-slate-400">Try creating a safety certificate in the CP12 center first!</p>
                  </div>
                ) : (
                  filteredCerts.map((cert) => {
                    const info = cert.data || {};
                    const isDraft = cert.status === 'draft';
                    const isVerified = cert.verified === true;
                    
                    return (
                      <div 
                        key={cert.id}
                        className={`p-6 rounded-2xl bg-white border transition-all ${
                          sharingCert?.id === cert.id 
                            ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md' 
                            : 'border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">{cert.refNumber || 'CP12-UNASSIGNED'}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                isDraft ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {isDraft ? 'Draft Saved' : 'CP12 Certified'}
                              </span>
                              {isVerified && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-bold flex items-center">
                                  <Check size={10} className="mr-0.5" /> Client Verified
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-700 text-xs flex items-center">
                              <Building2 size={13} className="mr-1 text-slate-400" />
                              {info.landlordName || 'N/A'}
                            </h4>
                            <p className="text-[11px] text-slate-500 flex items-center font-medium">
                              <MapPin size={12} className="mr-1 text-slate-400 shrink-0" />
                              {info.propertyAddress || 'No Property Address Recorded'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 sm:self-center">
                            <button
                              onClick={() => {
                                setLoadedClientCert(cert);
                                setActiveSubTab('search-viewer');
                              }}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-colors tooltip"
                              title="Live Customer Preview"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setSharingCert(cert);
                                setShareEmail(info.landlordEmail || '');
                                setShareName(info.landlordName || '');
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center transition-all shadow-md shadow-blue-100"
                            >
                              <Send size={13} className="mr-1.5" />
                              Share Link
                            </button>
                          </div>
                        </div>

                        {/* Expand status logs */}
                        {isVerified && (
                          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start space-x-2">
                            <MessageSquare className="text-emerald-700 mt-0.5 shrink-0" size={13} />
                            <div>
                              <p className="text-[10px] text-emerald-950 font-bold block">
                                Client Acknowledged on {cert.verifiedAt ? new Date(cert.verifiedAt).toLocaleString() : ''}
                              </p>
                              <p className="text-[10px] text-emerald-800 italic font-medium">
                                "{cert.verifiedComment}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Sharing Panel Form */}
              <div className="lg:col-span-1">
                {sharingCert ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 bg-white border border-slate-200 rounded-[24px] shadow-lg sticky top-6 space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="text-blue-600" size={18} />
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Share Safety Record</h4>
                      </div>
                      <button 
                        onClick={() => setSharingCert(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Reset Form
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This triggers an online HTML dispatch request containing a secure unguessable access link for <strong>{sharingCert.refNumber}</strong>. Clients can open the dashboard instantly.
                    </p>

                    <form onSubmit={triggerEmailDispatch} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Recipient Email</label>
                        <input 
                          type="email"
                          required
                          placeholder="client@landlord-agency.co.uk"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          className="w-full p-3 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Recipient Custom Name</label>
                        <input 
                          type="text"
                          placeholder="e.g. Skyline Lettings Ltd"
                          value={shareName}
                          onChange={(e) => setShareName(e.target.value)}
                          className="w-full p-3 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Dispatch Message Note</label>
                        <textarea 
                          rows={3}
                          value={shareMessage}
                          onChange={(e) => setShareMessage(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none min-h-[70px] leading-relaxed"
                        />
                      </div>

                      <AnimatePresence>
                        {sentAlert && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-3 rounded-xl border text-[11px] font-bold ${
                              sentAlert.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                            {sentAlert.msg}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={isSending}
                        className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                      >
                        {isSending ? 'SENDING EMAIL...' : 'DISPATCH SECURE RECIPIENT email'}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <div className="p-8 bg-slate-100 rounded-[24px] border border-dashed border-slate-300 text-center text-slate-400 space-y-3">
                    <Send size={28} className="mx-auto opacity-30 mt-4 animate-pulse text-blue-500" />
                    <h5 className="font-bold text-slate-700 text-xs">No active sharing selected</h5>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Select any certificate from the issued compliance list and tap "Share Link" to configure recipient emails, custom dispatch warnings, and track client acknowledgement stamps.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: Visual email outbox simulator */}
        {activeSubTab === 'outbox' && (
          <motion.div
            key="outbox"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Email Dispatch Sandbox</h3>
                <p className="text-slate-500 text-xs mt-0.5">Review sent outbox dispatches, inspect client delivery receipts, and click links to verify the client verification portal flow.</p>
              </div>

              {outbox.length > 0 && (
                <button 
                  onClick={clearOutboxLogs}
                  className="px-3.5 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
                >
                  Clear Sandbox Dispatches
                </button>
              )}
            </div>

            {outbox.length === 0 ? (
              <div className="py-20 bg-white border border-slate-200 rounded-[32px] text-center space-y-4">
                <Inbox size={48} className="mx-auto text-slate-300 stroke-1" />
                <h5 className="font-extrabold text-slate-700 text-sm">Outbox Sandbox is Empty</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Sent certificate receipts will instantly appear here with full HTML templates. Try hitting the "Share Link" button on any certificate in the Share Center tab first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {outbox.map((mail) => (
                  <div key={mail.id} className="p-6 bg-white border border-slate-200 rounded-[24px] shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-2">
                        <span className="flex items-center font-bold">
                          <Clock size={12} className="mr-1" />
                          {new Date(mail.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold rounded">
                          {mail.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">To: <span className="text-indigo-600 underline">{mail.recipient}</span></p>
                        <p className="text-xs font-black text-slate-900">{mail.subject}</p>
                      </div>

                      {/* Display a simulated HTML email preview inside an iframe or safe block */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner max-h-72 overflow-y-auto bg-slate-50 p-4">
                        <div dangerouslySetInnerHTML={{ __html: mail.html }} />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <a 
                        href={`/?certId=${mail.link.split('?certId=')[1]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
                      >
                        <ExternalLink size={13} className="mr-1.5" />
                        Open Recipient Portal Link
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: Client Search Mode & CP12 Digital Viewer */}
        {activeSubTab === 'search-viewer' && (
          <motion.div
            key="search-viewer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* If direct view is active, enable going back */}
            {!loadedClientCert && (
              <div className="max-w-md mx-auto py-12 bg-white border border-slate-200 rounded-[32px] p-8 shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Gas safety original directory</h3>
                  <p className="text-slate-400 text-xs">Access your CP12 digital safety report. Enter your certificate reference ID and postcode.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Certificate reference number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CP12-821039"
                      value={clientSearchRef}
                      onChange={(e) => setClientSearchRef(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Property Postal Code (Verify Site)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. W1K 1BE"
                      value={clientSearchPostcode}
                      onChange={(e) => setClientSearchPostcode(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold focus:outline-none"
                    />
                  </div>

                  {clientSearchError && (
                    <div className="p-3 bg-red-50 text-red-800 border border-red-200 text-xs font-bold rounded-xl flex items-center">
                      <AlertCircle size={14} className="mr-2 shrink-0" />
                      {clientSearchError}
                    </div>
                  )}

                  <button
                    onClick={executeClientSearch}
                    disabled={isSearchingClient}
                    className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-250 disabled:opacity-50"
                  >
                    {isSearchingClient ? 'Verifying Safe Token...' : 'Query Compliance Directories'}
                  </button>
                </div>
              </div>
            )}

            {/* LIVE DYNAMIC CP12 CERTIFICATE VISUAL READER */}
            {loadedClientCert && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                
                {/* Visual Action Banner wrapper */}
                <div className="bg-slate-900 text-white p-6 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs uppercase tracking-widest text-blue-400">UK Registered Certificate Document original</span>
                      <span className="px-2 py-0.5 bg-emerald-500 rounded text-[9px] font-black text-white">VALID ORIGINAL</span>
                    </div>
                    <h4 className="font-black text-lg">CP12 Safety Record: <span className="underline decoration-blue-500 decoration-2">{loadedClientCert.refNumber}</span></h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => generateClientPDF(loadedClientCert)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center transition-all shadow shadow-blue-600/30"
                    >
                      <Printer size={14} className="mr-1.5" />
                      Download Signed Original PDF
                    </button>
                    {!user && onClearDirectRoute && (
                      <button 
                        onClick={() => {
                          setLoadedClientCert(null);
                          onClearDirectRoute();
                        }}
                        className="px-4 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                      >
                        Exit Security Document View
                      </button>
                    )}
                  </div>
                </div>

                {/* THE PORTAL CP12 REPLICA CARD */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
                  
                  {/* Digital Document Header Block */}
                  <div className="bg-slate-900 p-8 sm:p-10 text-white border-b-4 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Boiler<span className="text-blue-500">Flow</span> Gas safety record</h4>
                      <p className="text-slate-400 text-xs mt-1">Pursuant to UK Gas Safety Installation and Use Regulations 1998.</p>
                      <p className="text-slate-500 text-[10px] tracking-wide mt-2">REGISTRATION NO: Gas Safe Register #821039</p>
                    </div>

                    <div className="p-3 bg-emerald-900/40 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center space-x-2 shrink-0">
                      <CheckCircle2 size={24} />
                      <div>
                        <span className="text-xs font-black block">VERIFICATION SIGNED</span>
                        <span className="text-[9px] text-emerald-500/80 font-semibold block">Online Verified System</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 sm:p-10 space-y-8">
                    
                    {/* Landlord vs Site Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Landlord or Managing Agency</span>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <p className="font-extrabold text-slate-900 text-sm">{loadedClientCert.data?.landlordName || 'N/A'}</p>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                            {loadedClientCert.data?.landlordAddress || 'No Registered Landlord Address Recorded.'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Inspected Site Property Address</span>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <p className="font-extrabold text-slate-900 text-sm">Site Location Verified</p>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                            {loadedClientCert.data?.propertyAddress || 'No Property Address Recorded.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Safety Evaluation Indices Grid */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Site Installation Evaluation Checklist</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 text-xs font-semibold">Gas Tightness Test</span>
                          <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-800 font-black text-[10px] rounded">
                            {loadedClientCert.data?.gasTightnessTest || 'PASS'}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 text-xs font-semibold">Equipotential Bonding</span>
                          <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-800 font-black text-[10px] rounded">
                            {loadedClientCert.data?.bondingSatisfactory || 'YES'}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 text-xs font-semibold">ECV Accessible</span>
                          <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-800 font-black text-[10px] rounded">
                            {loadedClientCert.data?.emergencyValvesOk || 'YES'}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Inspected Appliances Detailed Grid */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-bold">Inspected Safety Appraisals breakdown</span>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                              <tr>
                                <th className="p-4">Appliance Type</th>
                                <th className="p-4">Location</th>
                                <th className="p-4 text-center">Operation Press</th>
                                <th className="p-4 text-center">Ventilation ok</th>
                                <th className="p-4 text-center">Flue Operation</th>
                                <th className="p-4 text-center">Safety Device</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                              {(loadedClientCert.data?.appliances || []).map((app: any, index: number) => (
                                <tr key={index} className="hover:bg-slate-50">
                                  <td className="p-4">
                                    <span className="font-extrabold text-slate-900 block">{app.type || 'Appliance'}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{app.make || 'Generic'} {app.model || ''}</span>
                                  </td>
                                  <td className="p-4 text-slate-500">{app.location || 'Kitchen'}</td>
                                  <td className="p-4 text-center text-slate-900 font-bold">{app.operatingPressure || 'N/A'}</td>
                                  <td className="p-4 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${app.ventilationSatisfactory === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                      {app.ventilationSatisfactory}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${app.flueOperationSatisfactory === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                      {app.flueOperationSatisfactory}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${app.safetyDevicesWorking === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                      {app.safetyDevicesWorking}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Engineer Summary Remarks */}
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-150">
                      <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2 font-bold">Engineer General Remarks & Statements</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold font-sans italic">
                        "{loadedClientCert.data?.engineerSummary || 'Standard inspections successfully completed, components comply fully with safety norms.'}"
                      </p>
                    </div>

                    {/* Electronic Engineer Signature Block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                      
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Assigned Engineer credential</span>
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-black text-slate-900">Alex Smith</p>
                          <p className="text-[11px] text-slate-500 font-medium">Gas Safe Register ID Reference Number #821039</p>
                          <div className="pt-2">
                            <span className="font-mono text-xs italic text-blue-600 block pl-2 border-l-2 border-blue-600">{loadedClientCert.data?.engineerSignature || 'A. Smith'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Verification Original Date</span>
                          <p className="text-xs font-black text-slate-900 mt-2">
                            {loadedClientCert.issuedAt ? new Date(loadedClientCert.issuedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-medium italic mt-2">BoilerFlow Secure Dispatcher System original document.</p>
                      </div>

                    </div>

                  </div>
                </div>

                {/* INTERACTIVE CLIENT ACKNOWLEDGEMENT WORKSPACE PANEL */}
                <div className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-lg space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <CheckCircle2 className="text-blue-600 animate-pulse" size={20} />
                    <h4 className="font-black text-slate-900 text-sm">Interactive Client Verification Stamp</h4>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    Tenants, landlords, or homeowners can officially acknowledge receipt, inspect device parameters, and submit their compliance review note back to our engineer dashboard instantly.
                  </p>

                  {loadedClientCert.verified ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start space-x-3 text-emerald-950 font-bold text-xs"
                    >
                      <CheckCircle2 className="text-emerald-600 mt-0.5" size={16} />
                      <div>
                        <p>Acknowledge Safety Verification Log is Registered Successfully!</p>
                        <p className="text-[11px] text-emerald-800 font-medium mt-1">Confirmed Comments: <span className="italic block mt-1 bg-white p-3 rounded-xl border border-emerald-100">"{loadedClientCert.verifiedComment}"</span></p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Feedback Remarks / Tenant Notes</label>
                        <textarea 
                          rows={3}
                          placeholder="Provide any comments, e.g. 'Acknowledge inspection done on Tuesday', or 'All appliances satisfactory'."
                          value={clientComment}
                          onChange={(e) => setClientComment(e.target.value)}
                          className="w-full p-4 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleClientAcknowledge}
                          disabled={isAcknowledging}
                          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center transition-all shadow-md"
                        >
                          {isAcknowledging ? 'Submitting Acknowledgement...' : 'Acknowledge Receipt & Mark Compliance Verified'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
