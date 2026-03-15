import { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Zap, AlertTriangle, MapPin, Clock, DollarSign, 
  Search, Filter, RefreshCw, Info, CheckCircle,
  User, Phone, Mail, CreditCard, Ticket, X, Plus,
  TrendingUp, Building2, Banknote, Wallet,
  ArrowRight, Timer, XCircle, QrCode,
  Shield, Sparkles, Activity, DoorOpen, AlertCircle,
  Layers, Smartphone, Copy, Download
} from 'lucide-react';
import AuthContext from '../Context/Context';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { format, differenceInMinutes } from 'date-fns';

const UserParking = () => {
  const {
    getUserAvailableSlots,
    getSlotSummary,
    bookParkingSlot,
    getSessionByToken,
    extendParkingSession,
    completeParkingSession,
    cancelParkingSession,
    getPricingInfo
  } = useContext(AuthContext);

  const [view, setView] = useState('browse');
  const [slots, setSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]); // Store all slots including occupied
  const [summary, setSummary] = useState({});
  const [pricing, setPricing] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showPaymentScanner, setShowPaymentScanner] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [realTimeUpdate, setRealTimeUpdate] = useState(0); // Force re-render timer
  
  const [filters, setFilters] = useState({
    search: '',
    section: '',
    slotType: '',
    vehicleType: '',
    gate: ''
  });

  const [bookingForm, setBookingForm] = useState({
    userName: '',
    userContact: '',
    userEmail: '',
    vehicleNumber: '',
    vehicleType: 'Normal',
    allottedDuration: 60
  });

  // Real-time timer update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTimeUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(() => {
      loadSlots();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [slotsRes, summaryRes, pricingRes] = await Promise.all([
        getUserAvailableSlots(),
        getSlotSummary(),
        getPricingInfo()
      ]);

      if (slotsRes?.success) {
        setSlots(slotsRes.data?.slots || []);
        setAllSlots(slotsRes.data?.allSlots || slotsRes.data?.slots || []); // Store all slots
      }
      if (summaryRes?.success) {
        setSummary(summaryRes.data?.summary || {});
      }
      if (pricingRes?.success) {
        setPricing(pricingRes.data?.pricing || {});
      }
    } catch (error) {
      console.error('Load Error:', error);
      toast.error('Failed to load parking data');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const slotsRes = await getUserAvailableSlots(filters);
      if (slotsRes?.success) {
        setSlots(slotsRes.data?.slots || []);
        setAllSlots(slotsRes.data?.allSlots || slotsRes.data?.slots || []);
      }
    } catch (error) {
      console.error('Refresh Error:', error);
    }
  };

  const loadSession = async (tokenId) => {
    try {
      const result = await getSessionByToken(tokenId);
      if (result?.success) {
        setCurrentSession(result.data);
        setShowSessionModal(true);
      }
    } catch (error) {
      console.error('Session Load Error:', error);
    }
  };

  // Calculate real-time remaining time
  const calculateTimeInfo = (session) => {
    if (!session) return null;
    
    const now = new Date();
    const entryTime = new Date(session.entryTime);
    const elapsedMinutes = differenceInMinutes(now, entryTime);
    const remainingMinutes = Math.max(0, session.allottedDuration - elapsedMinutes);
    const isOvertime = elapsedMinutes > session.allottedDuration;
    const overtimeMinutes = isOvertime ? elapsedMinutes - session.allottedDuration : 0;
    
    // Calculate overtime charges (50% extra)
    let overtimeCharge = 0;
    if (isOvertime && !session.isEmergencyVehicle) {
      const overtimeHours = overtimeMinutes / 60;
      const baseRate = session.slotId?.pricing?.baseRate || 20;
      overtimeCharge = Math.round(baseRate * overtimeHours * 1.5);
    }
    
    return {
      elapsedMinutes,
      remainingMinutes,
      isOvertime,
      overtimeMinutes,
      overtimeCharge,
      totalAmount: session.totalAmount + overtimeCharge
    };
  };

  // Organize slots (show ALL slots including occupied)
  const organizedSlots = useMemo(() => {
    let filtered = [...allSlots]; // Use all slots, not just available

    if (filters.search) {
      filtered = filtered.filter(s => 
        s.slotNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.section?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.section) filtered = filtered.filter(s => s.section === filters.section);
    if (filters.slotType) filtered = filtered.filter(s => s.slotType === filters.slotType);
    
    // EV filter - only show EV slots for electric vehicles
    if (filters.vehicleType === 'EV') {
      filtered = filtered.filter(s => s.slotType === 'EV');
    } else if (filters.vehicleType) {
      filtered = filtered.filter(s => s.vehicleTypes?.includes(filters.vehicleType));
    }
    
    if (filters.gate) filtered = filtered.filter(s => s.entryGate === filters.gate);

    const sections = {};
    filtered.forEach(slot => {
      const section = slot.section || 'Unknown';
      if (!sections[section]) {
        sections[section] = {
          name: section,
          gate: slot.entryGate,
          slots: [],
          available: 0
        };
      }
      sections[section].slots.push(slot);
      if (!slot.isOccupied && slot.isActive) {
        sections[section].available++;
      }
    });

    return sections;
  }, [allSlots, filters]);

  const handleBookSlot = (slot) => {
    // If slot is occupied, show its details
    if (slot.isOccupied) {
      toast.info('This slot is currently occupied');
      return;
    }
    
    setSelectedSlot(slot);
    
    // Auto-set vehicle type based on slot type
    let vehicleType = 'Normal';
    if (slot.slotType === 'EV') vehicleType = 'EV';
    if (slot.slotType === 'Emergency') vehicleType = 'Emergency';
    
    setBookingForm({
      ...bookingForm,
      slotId: slot._id,
      vehicleType
    });
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    // validate phone number contains exactly 10 digits
    const phone = bookingForm.userContact || '';
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Phone number format not allowed (10 digits)');
      return;
    }

    setLoading(true);
    
    try {
      const bookingData = {
        ...bookingForm,
        slotId: selectedSlot._id
      };

      const result = await bookParkingSlot(bookingData);
      
      if (result?.success) {
        setCurrentSession(result.data);
        setShowBookingModal(false);
        setShowSessionModal(true);
        await loadSlots();
        
        setBookingForm({
          userName: '',
          userContact: '',
          userEmail: '',
          vehicleNumber: '',
          vehicleType: 'Normal',
          allottedDuration: 60
        });
      }
    } catch (error) {
      console.error('Booking Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSession = async () => {
    if (!currentSession?.session?.tokenId) return;
    
    const additionalMinutes = 30;
    const result = await extendParkingSession(currentSession.session.tokenId, additionalMinutes);
    
    if (result?.success) {
      await loadSession(currentSession.session.tokenId);
    }
  };

  const handleCompleteSession = async (paymentMethod) => {
    if (!currentSession?.session?.tokenId) return;
    
    // Show payment scanner for online payment
    if (paymentMethod === 'online') {
      setShowPaymentScanner(true);
      // Simulate payment after 3 seconds
      setTimeout(async () => {
        const result = await completeParkingSession(currentSession.session.tokenId, paymentMethod);
        
        if (result?.success) {
          setShowPaymentScanner(false);
          setShowSessionModal(false);
          setCurrentSession(null);
          await loadSlots();
        }
      }, 3000);
    } else {
      // Cash payment
      const result = await completeParkingSession(currentSession.session.tokenId, paymentMethod);
      
      if (result?.success) {
        setShowSessionModal(false);
        setCurrentSession(null);
        await loadSlots();
      }
    }
  };

  const handleCancelSession = async () => {
    if (!currentSession?.session?.tokenId || !window.confirm('Cancel this booking?')) return;
    
    const result = await cancelParkingSession(currentSession.session.tokenId);
    
    if (result?.success) {
      setShowSessionModal(false);
      setCurrentSession(null);
      await loadSlots();
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copied to clipboard!');
  };

  const uniqueSections = [...new Set(allSlots.map(s => s.section))].sort();
  const uniqueGates = [...new Set(allSlots.map(s => s.entryGate))].sort();
  if (loading && slots.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </motion.div>
          <p className="text-gray-700 text-xl font-bold">Loading Parking System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mt-7">
      {/* Header - Same as before */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30 backdrop-blur-xl bg-white/80 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="relative"
              >
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              </motion.div>
              <div>

                <p className="text-sm text-gray-600 font-medium">
                  Find Your Perfect Parking Spot
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('browse')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  view === 'browse'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Browse Slots
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('myBooking')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  view === 'myBooking'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  My Booking
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadSlots}
                disabled={loading}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={Layers}
              label="Total Slots"
              value={summary.totalSlots || 0}
              gradient="from-blue-500 to-cyan-500"
              bgLight="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              label="Available"
              value={summary.availableSlots || 0}
              gradient="from-emerald-500 to-green-500"
              bgLight="bg-emerald-50"
              iconColor="text-emerald-600"
              pulse
            />
            <StatCard
              icon={Zap}
              label="EV Charging"
              value={summary.evSlots || 0}
              gradient="from-amber-500 to-orange-500"
              bgLight="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Occupancy"
              value={`${summary.occupancyRate || 0}%`}
              gradient="from-purple-500 to-pink-500"
              bgLight="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>
        </div>
      </header>

      {/* Main Content - Continue in next message */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'browse' && (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Filter Available Slots</h2>
                {Object.values(filters).some(v => v) && (
                  <button
                    onClick={() => setFilters({ search: '', section: '', slotType: '', vehicleType: '', gate: '' })}
                    className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search slot..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <select
                  value={filters.section}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sections</option>
                  {uniqueSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>

                <select
                  value={filters.slotType}
                  onChange={(e) => setFilters({ ...filters, slotType: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="Normal">Normal Car</option>
                  <option value="EV">EV Charging</option>
                  <option value="Emergency">Emergency (FREE)</option>
                  <option value="Disabled">Disabled Access</option>
                </select>

                <select
                  value={filters.vehicleType}
                  onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Vehicles</option>
                  <option value="Car">Regular Car</option>
                  <option value="EV">Electric Car (EV Only)</option>
                  <option value="Emergency">Emergency Vehicle</option>
                </select>

                <select
                  value={filters.gate}
                  onChange={(e) => setFilters({ ...filters, gate: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Gates</option>
                  {uniqueGates.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </motion.div>

            {/* Slots Grid */}
            {Object.keys(organizedSlots).length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-gray-200 shadow-lg"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-700 text-xl font-bold mb-2">No slots found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {Object.entries(organizedSlots).map(([sectionName, sectionData], idx) => (
                  <motion.div
                    key={sectionName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Section {sectionName}</h3>
                          <p className="text-sm text-gray-600 font-medium">{sectionData.available} slots available</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200">
                        <DoorOpen className="w-5 h-5 text-emerald-600" />
                        <span className="text-gray-900 font-bold">{sectionData.gate}</span>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-5 gap-4">
                      {sectionData.slots.map((slot) => (
                        <SlotCard
                          key={slot._id}
                          slot={slot}
                          onBook={handleBookSlot}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'myBooking' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg"
          >
            <div className="text-center max-w-lg mx-auto">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl rotate-6"></div>
                <div className="relative w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl border-4 border-white">
                  <Ticket className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              
              <h2 className="text-3xl font-black text-gray-900 mb-3">Track Your Booking</h2>
              <p className="text-gray-600 mb-8 font-medium">Enter your booking token to view details and manage parking</p>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="TKN1234567890ABC"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-center text-lg font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadSession(tokenInput)}
                  disabled={!tokenInput}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Find My Booking
                </motion.button>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 text-left space-y-2">
                    <p className="font-bold">Where to find your token?</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Look at your booking receipt</li>
                      <li>It was shown right after booking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Modals - Continue with BookingModal, SessionModal, PaymentScanner */}
      
      <AnimatePresence>
        {showBookingModal && selectedSlot && (
          <BookingModal
            slot={selectedSlot}
            form={bookingForm}
            setForm={setBookingForm}
            onSubmit={handleSubmitBooking}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedSlot(null);
            }}
            loading={loading}
            pricing={pricing}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSessionModal && currentSession && (
          <SessionModal
            session={currentSession}
            timeInfo={calculateTimeInfo(currentSession.session)}
            onExtend={handleExtendSession}
            onComplete={handleCompleteSession}
            onCancel={handleCancelSession}
            onClose={() => {
              setShowSessionModal(false);
              setCurrentSession(null);
            }}
            copyToken={copyToken}
            realTimeUpdate={realTimeUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentScanner && (
          <PaymentScanner
            amount={calculateTimeInfo(currentSession?.session)?.totalAmount || 0}
            onClose={() => setShowPaymentScanner(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Continue with SlotCard, BookingModal, SessionModal, PaymentScanner components in next message...
// Slot Card Component - Shows ALL slots (Available & Occupied)
const SlotCard = ({ slot, onBook }) => {
  const getSlotStyle = () => {
    // Occupied slots
    if (slot.isOccupied) {
      return {
        gradient: 'from-orange-500 to-red-500',
        bgLight: 'bg-orange-50',
        border: 'border-orange-300',
        textColor: 'text-orange-700',
        icon: <Car className="w-6 h-6 text-orange-600" />,
        badge: 'OCCUPIED'
      };
    }

    // Available slots by type
    if (slot.slotType === 'EV') {
      return {
        gradient: 'from-emerald-500 to-green-500',
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-200',
        textColor: 'text-emerald-700',
        icon: <Zap className="w-6 h-6 text-emerald-600" />,
        badge: 'AVAILABLE'
      };
    }
    if (slot.slotType === 'Emergency') {
      return {
        gradient: 'from-red-500 to-rose-500',
        bgLight: 'bg-red-50',
        border: 'border-red-200',
        textColor: 'text-red-700',
        icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
        badge: 'FREE'
      };
    }
    if (slot.slotType === 'Disabled') {
      return {
        gradient: 'from-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50',
        border: 'border-blue-200',
        textColor: 'text-blue-700',
        icon: <Shield className="w-6 h-6 text-blue-600" />,
        badge: 'AVAILABLE'
      };
    }
    return {
      gradient: 'from-gray-600 to-gray-700',
      bgLight: 'bg-gray-50',
      border: 'border-gray-200',
      textColor: 'text-gray-700',
      icon: <Car className="w-6 h-6 text-gray-600" />,
      badge: 'AVAILABLE'
    };
  };

  const style = getSlotStyle();

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onBook(slot)}
      className={`group relative bg-white rounded-2xl p-5 cursor-pointer shadow-md hover:shadow-xl border-2 ${
        slot.isOccupied ? 'border-orange-300 opacity-75' : 'border-gray-200 hover:border-blue-400'
      } transition-all overflow-hidden`}
    >
      {/* Gradient Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${style.gradient}`}></div>

      {/* Hover Overlay */}
      {!slot.isOccupied && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-2xl font-black text-gray-900">{slot.slotNumber}</span>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Section {slot.section}</p>
          </div>
          <div className={`w-11 h-11 ${style.bgLight} rounded-xl flex items-center justify-center border-2 ${style.border}`}>
            {style.icon}
          </div>
        </div>

        {/* Occupied Vehicle Info */}
        {slot.isOccupied && slot.currentSessionId && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-700">OCCUPIED</span>
            </div>
            <p className="text-xs text-orange-600 font-semibold">Click to view details</p>
          </div>
        )}

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-medium">Row {slot.position?.row} • Col {slot.position?.column}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <DoorOpen className="w-3.5 h-3.5" />
            <span className="font-medium">{slot.entryGate}</span>
          </div>
        </div>

        {/* Price Card */}
        <div className={`${style.bgLight} border-2 ${style.border} rounded-xl px-3 py-2.5 flex items-center justify-between group-hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-2">
            {slot.slotType === 'Emergency' ? (
              <>
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-base font-black text-emerald-700">FREE</span>
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 text-gray-700" />
                <span className="text-base font-black text-gray-900">₹{slot.pricing?.baseRate}</span>
                <span className="text-xs text-gray-500 font-semibold">/hr</span>
              </>
            )}
          </div>
          {!slot.isOccupied && (
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          )}
        </div>

        {/* Amenities Badges */}
        {slot.amenities && slot.amenities.length > 0 && !slot.isOccupied && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {slot.amenities.slice(0, 2).map((amenity, idx) => (
              <span key={idx} className="text-[10px] bg-gray-100 border border-gray-200 px-2 py-1 rounded-full text-gray-700 font-bold">
                {amenity}
              </span>
            ))}
          </div>
        )}

        {/* Status Badge */}
        <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${style.gradient} text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg`}>
          {style.badge}
        </div>
      </div>
    </motion.div>
  );
};

// Booking Modal Component
const BookingModal = ({ slot, form, setForm, onSubmit, onClose, loading, pricing }) => {
  const calculateTotal = () => {
    const hours = form.allottedDuration / 60;
    const rate = slot.slotType === 'Emergency' ? 0 : slot.pricing?.baseRate || 0;
    return Math.round(rate * hours);
  };

  const getSlotStyle = () => {
    if (slot.slotType === 'EV') return { gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', border: 'border-emerald-300' };
    if (slot.slotType === 'Emergency') return { gradient: 'from-red-500 to-rose-500', bg: 'bg-red-50', border: 'border-red-300' };
    if (slot.slotType === 'Disabled') return { gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', border: 'border-blue-300' };
    return { gradient: 'from-gray-600 to-gray-700', bg: 'bg-gray-50', border: 'border-gray-300' };
  };

  const style = getSlotStyle();

  // Restrict vehicle type options based on slot type
  const getVehicleOptions = () => {
    if (slot.slotType === 'EV') {
      return [{ value: 'EV', label: 'Electric Vehicle (EV Only)' }];
    }
    if (slot.slotType === 'Emergency') {
      return [{ value: 'Emergency', label: 'Emergency Vehicle (FREE)' }];
    }
    return [
      { value: 'Normal', label: 'Regular Car' },
      { value: 'Car', label: 'Regular Car' }
    ];
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-auto border-2 border-gray-200">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between border-b-4 border-blue-700 z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                <Ticket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Book Your Slot</h2>
                <p className="text-blue-100 font-medium">Reserve {slot.slotNumber} in Section {slot.section}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2.5 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="p-8 grid grid-cols-5 gap-8">
            {/* Left: Slot Details (2 columns) */}
            <div className="col-span-2 space-y-5">
              {/* Slot Card */}
              <div className={`bg-gradient-to-br ${style.gradient} rounded-2xl p-6 shadow-xl text-white`}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-4xl font-black mb-1">{slot.slotNumber}</h3>
                    <p className="text-white/80 font-semibold">Section {slot.section}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                    {slot.slotType === 'EV' ? <Zap className="w-8 h-8" /> : 
                     slot.slotType === 'Emergency' ? <AlertTriangle className="w-8 h-8" /> : 
                     <Car className="w-8 h-8" />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <MapPin className="w-4 h-4 mb-1 opacity-80" />
                    <p className="text-xs opacity-80 font-medium">Position</p>
                    <p className="font-bold text-sm">R{slot.position?.row} • C{slot.position?.column}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <DoorOpen className="w-4 h-4 mb-1 opacity-80" />
                    <p className="text-xs opacity-80 font-medium">Entry Gate</p>
                    <p className="font-bold text-sm">{slot.entryGate}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <Layers className="w-4 h-4 mb-1 opacity-80" />
                    <p className="text-xs opacity-80 font-medium">Size</p>
                    <p className="font-bold text-sm">{slot.size}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <DollarSign className="w-4 h-4 mb-1 opacity-80" />
                    <p className="text-xs opacity-80 font-medium">Rate</p>
                    <p className="font-bold text-sm">
                      {slot.slotType === 'Emergency' ? 'FREE' : `₹${slot.pricing?.baseRate}/hr`}
                    </p>
                  </div>
                </div>

                {slot.amenities && slot.amenities.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {slot.amenities.map((amenity, idx) => (
                      <span key={idx} className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-bold border border-white/20">
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing Info */}
              <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Pricing Information
                </h4>
                <div className="space-y-3 text-sm">
                  {slot.slotType === 'Emergency' ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-100 rounded-xl border border-emerald-300">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-emerald-700">FREE for Emergency Vehicles</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                        <span className="text-gray-600 font-medium">Base Rate:</span>
                        <span className="font-black text-gray-900 text-lg">₹{slot.pricing?.baseRate}/hr</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                        <span className="text-gray-600 font-medium">Peak Hour:</span>
                        <span className="font-black text-gray-900 text-lg">₹{slot.pricing?.peakHourRate}/hr</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-100 rounded-xl border border-orange-300">
                        <span className="text-orange-700 font-medium">Overtime Penalty:</span>
                        <span className="font-black text-orange-700">+50% Extra</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Email Notification Info */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="font-bold mb-1">Email Confirmation</p>
                    <p className="text-green-700">Booking details, QR code, and parking token will be sent to your email.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking Form (3 columns) */}
            <form onSubmit={onSubmit} className="col-span-3 space-y-5">
              {/* User Details */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Your Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.userName}
                        onChange={(e) => setForm({ ...form, userName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.userContact}
                        onChange={(e) => {
                          // remove any non-digit characters immediately
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          setForm({ ...form, userContact: digitsOnly });
                        }}
                        pattern="\d{10}"
                        maxLength={10}
                        title="Only 10 digit numbers allowed"
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={form.userEmail}
                        onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Vehicle Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Number *</label>
                    <input
                      type="text"
                      value={form.vehicleNumber}
                      onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 uppercase tracking-wider text-center text-lg font-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="MH12AB1234"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Type *</label>
                    <select
                      value={form.vehicleType}
                      onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={slot.slotType === 'EV' || slot.slotType === 'Emergency'}
                    >
                      {getVehicleOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Duration Selector */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Parking Duration
                </h4>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[30, 60, 120, 180, 240, 360, 480, 720].map((mins) => (
                    <motion.button
                      key={mins}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setForm({ ...form, allottedDuration: mins })}
                      className={`px-4 py-3 rounded-xl font-bold transition-all ${
                        form.allottedDuration === mins
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                      }`}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </motion.button>
                  ))}
                </div>
                <div>
                  <input
                    type="range"
                    min="15"
                    max="720"
                    step="15"
                    value={form.allottedDuration}
                    onChange={(e) => setForm({ ...form, allottedDuration: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-center text-gray-600 font-bold mt-3">
                    Selected: <span className="text-blue-600 text-lg">{form.allottedDuration} minutes</span>
                  </p>
                </div>
              </div>

              {/* Total Amount Card */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-sm opacity-90 font-semibold mb-2">Total Amount to Pay</p>
                    <p className="text-5xl font-black">
                      {slot.slotType === 'Emergency' ? 'FREE' : `₹${calculateTotal()}`}
                    </p>
                    {slot.slotType !== 'Emergency' && (
                      <p className="text-sm opacity-90 mt-2 font-medium">
                        {form.allottedDuration} minutes @ ₹{slot.pricing?.baseRate}/hour
                      </p>
                    )}
                  </div>
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                    <Sparkles className="w-10 h-10" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border-2 border-gray-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Booking
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Continue with SessionModal and PaymentScanner in next message...
// Session Modal Component with REAL-TIME Timer
const SessionModal = ({ session, timeInfo, onExtend, onComplete, onCancel, onClose, copyToken, realTimeUpdate }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('');

  const sessionData = session.session;
  const isEmergency = sessionData.isEmergencyVehicle;

  // Recalculate time info on every render (real-time update)
  const now = new Date();
  const entryTime = new Date(sessionData.entryTime);
  const elapsedMinutes = Math.floor((now - entryTime) / 60000);
  const remainingMinutes = Math.max(0, sessionData.allottedDuration - elapsedMinutes);
  const isOvertime = elapsedMinutes > sessionData.allottedDuration;
  const overtimeMinutes = isOvertime ? elapsedMinutes - sessionData.allottedDuration : 0;
  
  // Calculate overtime charges in real-time
  let overtimeCharge = 0;
  if (isOvertime && !isEmergency) {
    const overtimeHours = overtimeMinutes / 60;
    overtimeCharge = Math.round(sessionData.baseRate * overtimeHours * 1.5);
  }
  
  const totalAmount = sessionData.totalAmount + overtimeCharge;

  const getProgressPercentage = () => {
    return Math.min((elapsedMinutes / sessionData.allottedDuration) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 50) return { gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    if (percentage < 80) return { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' };
    return { gradient: 'from-red-500 to-rose-500', bg: 'bg-red-50', text: 'text-red-700' };
  };

  const progressColor = getProgressColor();

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-auto border-2 border-gray-200">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-6 flex items-center justify-between border-b-4 border-emerald-600 z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                <Ticket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Active Parking Session</h2>
                <p className="text-emerald-100 font-semibold">Token: {sessionData.tokenId}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2.5 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="p-8 grid grid-cols-5 gap-8">
            {/* Left Side: QR & Timer (2 columns) */}
            <div className="col-span-2 space-y-5">
              {/* QR Code Card - FIXED */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg border-2 border-gray-200">
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                  <div className="flex flex-col items-center">
                    {/* <div className="bg-white p-4 rounded-xl border-4 border-blue-500 mb-4">
                      <QRCodeSVG
                        value={sessionData.tokenId}
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div> */}
                    <div className="w-full bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                      <p className="text-xs text-blue-600 font-bold text-center mb-2">PARKING TOKEN</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-black text-gray-900 tracking-wider font-mono">
                          {sessionData.tokenId}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyToken(sessionData.tokenId)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          <Copy className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 font-semibold">
                      Scan this QR code at the exit gate for quick checkout
                    </p>
                  </div>
                </div> */}
              </div>

              {/* Real-Time Timer Card */}
              <div className={`bg-gradient-to-br ${progressColor.gradient} rounded-2xl p-6 shadow-xl`}>
                <div className="text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm opacity-90 font-semibold mb-2">
                        {isOvertime ? 'OVERTIME!' : 'Time Remaining'}
                      </p>
                      <p className="text-5xl font-black">
                        {isOvertime ? formatTime(overtimeMinutes) : formatTime(remainingMinutes)}
                      </p>
                      <p className="text-xl font-bold opacity-90 mt-1">
                        {isOvertime ? 'overtime' : 'left'}
                      </p>
                    </div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                      <Timer className="w-10 h-10" />
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-white/30 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-white/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-white rounded-full shadow-lg"
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-3 opacity-90 font-semibold">
                      <span>{formatTime(elapsedMinutes)} used</span>
                      <span>{formatTime(sessionData.allottedDuration)} total</span>
                    </div>
                  </div>

                  {isOvertime && (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30"
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 flex-shrink-0 animate-pulse" />
                        <div>
                          <p className="font-black text-sm">OVERTIME ALERT!</p>
                          <p className="text-xs opacity-90 font-semibold">
                            Extra charges: +₹{overtimeCharge} (50% penalty)
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Session Info Card */}
              <div className="bg-gray-50 rounded-2xl p-5 border-2 border-gray-200 space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  Session Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Vehicle Number</span>
                    <span className="text-gray-900 font-black text-lg font-mono">{sessionData.vehicleNumber}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Slot Number</span>
                    <span className="text-gray-900 font-black text-lg">{sessionData.slotId?.slotNumber}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Section</span>
                    <span className="text-gray-900 font-bold">{sessionData.slotId?.section}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Entry Gate</span>
                    <span className="text-gray-900 font-bold">{sessionData.slotId?.entryGate}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Entry Time</span>
                    <span className="text-gray-900 font-bold">{format(entryTime, 'hh:mm a, MMM dd')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: User Info & Actions (3 columns) */}
            <div className="col-span-3 space-y-5">
              {/* User Contact Card */}
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <User className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-xs text-gray-500 font-semibold mb-1">Name</p>
                    <p className="text-sm font-black text-gray-900">{sessionData.userName}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <Phone className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-xs text-gray-500 font-semibold mb-1">Phone</p>
                    <p className="text-sm font-black text-gray-900">{sessionData.userContact}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <Mail className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-xs text-gray-500 font-semibold mb-1">Email</p>
                    <p className="text-sm font-black text-gray-900 truncate">{sessionData.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Billing Card with REAL-TIME Overtime */}
              <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Billing Summary (Live)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-emerald-200">
                    <span className="text-gray-600 font-semibold">Base Amount:</span>
                    <span className="font-black text-gray-900 text-xl">
                      {isEmergency ? 'FREE' : `₹${sessionData.totalAmount}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-semibold">Overtime Penalty:</span>
                      {isOvertime && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                          +50%
                        </span>
                      )}
                    </div>
                    <span className={`font-black text-xl ${isOvertime ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                      ₹{overtimeCharge}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl border-2 border-emerald-600 shadow-lg">
                    <span className="font-black text-white text-lg">Total Amount:</span>
                    <span className="font-black text-white text-3xl">
                      {isEmergency ? 'FREE' : `₹${totalAmount}`}
                    </span>
                  </div>
                </div>

                {isEmergency && (
                  <div className="mt-4 bg-white border-2 border-emerald-300 rounded-xl p-4 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-sm font-black text-emerald-700">Emergency Vehicle Parking</p>
                      <p className="text-xs text-emerald-600 font-semibold">No charges applicable</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!showPayment ? (
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onExtend}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Extend Parking by 30 Minutes
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPayment(true)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Complete Session & Pay ₹{totalAmount}
                  </motion.button>

                  {elapsedMinutes <= 5 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onCancel}
                      className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border-2 border-gray-200 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Cancel Booking (Within 5 min)
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Select Payment Method
                    </h4>

                    {!isEmergency && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {[
                          { id: 'cash', label: 'Cash at Exit', icon: Banknote, color: 'from-green-500 to-emerald-500', desc: 'Pay at exit gate' },
                          { id: 'online', label: 'UPI / Card', icon: Smartphone, color: 'from-blue-500 to-indigo-500', desc: 'Pay now online' }
                        ].map((method) => (
                          <motion.button
                            key={method.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedPayment(method.id)}
                            className={`p-6 rounded-xl font-bold transition-all ${
                              selectedPayment === method.id
                                ? `bg-gradient-to-r ${method.color} text-white shadow-lg`
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                            }`}
                          >
                            <method.icon className="w-10 h-10 mx-auto mb-2" />
                            <p className="text-base mb-1">{method.label}</p>
                            <p className={`text-xs ${selectedPayment === method.id ? 'text-white/80' : 'text-gray-500'}`}>
                              {method.desc}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowPayment(false)}
                        className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border-2 border-gray-200"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onComplete(selectedPayment || 'cash')}
                        disabled={!isEmergency && !selectedPayment}
                        className="flex-[2] px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedPayment === 'online' ? '💳 Pay Now' : '✅ Confirm & Exit'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Important Notes */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900 space-y-2">
                    <p className="font-bold text-base">Important Information:</p>
                    <ul className="list-disc list-inside space-y-1 font-semibold">
                      <li>Overtime penalty: 50% extra after allotted time</li>
                      <li>Save your token ID for future reference</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Payment Scanner Component (Dummy UPI)
const PaymentScanner = ({ amount, onClose }) => {
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProcessing(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-200">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-2">UPI Payment</h2>
            <p className="text-gray-600 mb-6">Scan QR code to pay ₹{amount}</p>

            {/* Dummy UPI QR Code */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200 mb-6">
              <div className="bg-white p-4 rounded-xl inline-block">
                <QRCodeSVG
                  value={`upi://pay?pa=smartpark@upi&pn=SmartPark&am=${amount}&cu=INR`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-sm text-purple-700 font-bold mt-4">smartpark@upi</p>
            </div>

            {processing ? (
              <div className="flex items-center justify-center gap-3 text-blue-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Waiting for payment...</span>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4"
              >
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-700 font-bold">Payment Successful!</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Helper Stat Card Component
const StatCard = ({ icon: Icon, label, value, gradient, bgLight, iconColor, pulse }) => {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="relative bg-white rounded-2xl p-5 shadow-md hover:shadow-xl border-2 border-gray-200 transition-all overflow-hidden group"
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`}></div>

      {pulse && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl`}
        />
      )}

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 ${bgLight} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-gray-200`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default UserParking;
