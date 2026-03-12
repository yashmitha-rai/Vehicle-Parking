import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Download, RefreshCw, Calendar, DollarSign,
  Clock, Car, User, Phone, CreditCard, AlertTriangle, CheckCircle,
  XCircle, Eye, X, TrendingUp, TrendingDown, Activity, Ban, Timer
} from 'lucide-react';
import AuthContext from '../Context/Context';
import toast from 'react-hot-toast';

const AdminSessions = () => {
  const {
    getAllSessionsDetailed,
    getActiveSessions,
    getPaymentAnalytics,
    getSessionAnalytics,
    forceCompleteSession,
    updatePaymentStatus,
    getSessionsByVehicle
  } = useContext(AuthContext);

  // State Management
  const [activeTab, setActiveTab] = useState('all');
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showForceCompleteModal, setShowForceCompleteModal] = useState(false);
  const [forceCompleteData, setForceCompleteData] = useState({
    sessionId: null,
    reason: '',
    paymentMethod: 'Cash'
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    vehicleType: '',
    emergency: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });

  const [summary, setSummary] = useState({
    totalSessions: 0,
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    emergencyCount: 0
  });

  // Auto-refresh active sessions every 30 seconds
  useEffect(() => {
    if (activeTab === 'active') {
      const interval = setInterval(() => {
        loadActiveSessions();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Load Data
  useEffect(() => {
    if (activeTab === 'all') loadSessions();
    else if (activeTab === 'active') loadActiveSessions();
    else if (activeTab === 'payments') loadPaymentAnalytics();
    else if (activeTab === 'analytics') loadSessionAnalytics();
  }, [activeTab, filters]);

  const loadSessions = async () => {
    setLoading(true);
    const result = await getAllSessionsDetailed(filters);
    if (result.success) {
      setSessions(result.data.sessions || []);
      setSummary(result.data.summary || {});
    }
    setLoading(false);
  };

  const loadActiveSessions = async () => {
    setLoading(true);
    const result = await getActiveSessions();
    if (result.success) {
      setActiveSessions(result.data.sessions || []);
    }
    setLoading(false);
  };

  const loadPaymentAnalytics = async () => {
    setLoading(true);
    const result = await getPaymentAnalytics(filters);
    if (result.success) {
      setPaymentStats(result.data);
    }
    setLoading(false);
  };

  const loadSessionAnalytics = async () => {
    setLoading(true);
    const result = await getSessionAnalytics();
    if (result.success) {
      setSessionStats(result.data);
    }
    setLoading(false);
  };

  const handleForceCompleteClick = (session) => {
    setForceCompleteData({
      sessionId: session._id,
      reason: '',
      paymentMethod: session.isEmergencyVehicle ? null : 'Cash'
    });
    setSelectedSession(session);
    setShowForceCompleteModal(true);
  };

  const handleForceCompleteConfirm = async () => {
    if (!forceCompleteData.reason.trim()) {
      toast.error('Please provide a reason for force completion');
      return;
    }

    const result = await forceCompleteSession(
      forceCompleteData.sessionId,
      forceCompleteData.reason,
      forceCompleteData.paymentMethod
    );

    if (result.success) {
      setShowForceCompleteModal(false);
      setShowDetailsModal(false);
      loadActiveSessions();
      loadSessions();
      toast.success('Session completed successfully');
    }
  };

  const handleUpdatePayment = async (sessionId, status, method) => {
    const result = await updatePaymentStatus(sessionId, status, method);
    if (result.success) {
      loadSessions();
      setShowDetailsModal(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      vehicleType: '',
      emergency: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 20
    });
  };

  // Calculate live penalty
  const calculateLivePenalty = (session) => {
    if (!session || session.status !== 'active' || session.isEmergencyVehicle) return 0;

    const now = new Date();
    const entryTime = new Date(session.entryTime);
    const elapsedMinutes = Math.floor((now - entryTime) / 60000);
    
    if (elapsedMinutes <= session.allottedDuration) return 0;
    
    const overtimeMinutes = elapsedMinutes - session.allottedDuration;
    const overtimeHours = overtimeMinutes / 60;
    return Math.round(session.baseRate * overtimeHours * 1.5);
  };

  const calculateLiveAmount = (session) => {
    if (!session) return 0;
    if (session.isEmergencyVehicle) return 0;
    return session.totalAmount + calculateLivePenalty(session);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Sessions & Payments</h1>
            <p className="text-gray-500 font-semibold mt-1">Manage bookings, payments, and analytics</p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'all') loadSessions();
              else if (activeTab === 'active') loadActiveSessions();
              else if (activeTab === 'payments') loadPaymentAnalytics();
              else if (activeTab === 'analytics') loadSessionAnalytics();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="Total Sessions"
            value={summary.totalSessions || 0}
            color="blue"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Total Revenue"
            value={`₹${summary.totalRevenue || 0}`}
            color="green"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Paid"
            value={`₹${summary.paidAmount || 0}`}
            color="emerald"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={`₹${summary.pendingAmount || 0}`}
            color="orange"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Emergency"
            value={summary.emergencyCount || 0}
            color="red"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            icon={<Activity className="w-4 h-4" />}
            label="All Sessions"
          />
          <TabButton
            active={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            icon={<Clock className="w-4 h-4" />}
            label="Active Parking"
            badge={activeSessions.length}
          />
          <TabButton
            active={activeTab === 'payments'}
            onClick={() => setActiveTab('payments')}
            icon={<DollarSign className="w-4 h-4" />}
            label="Payment Analytics"
          />
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Session Analytics"
          />
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ALL SESSIONS TAB */}
          {activeTab === 'all' && (
            <>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by vehicle, name, contact, or token..."
                    value={filters.search}
                    onChange={handleSearch}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-semibold"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={filters.paymentStatus}
                    onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-semibold"
                  >
                    <option value="">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>

                  <select
                    value={filters.vehicleType}
                    onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-semibold"
                  >
                    <option value="">All Vehicles</option>
                    <option value="EV">EV</option>
                    <option value="Normal">Normal</option>
                  </select>

                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-semibold"
                  />

                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-semibold"
                  />

                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Sessions Table */}
              <SessionsTable
                sessions={sessions}
                loading={loading}
                onViewDetails={(session) => {
                  setSelectedSession(session);
                  setShowDetailsModal(true);
                }}
                onUpdatePayment={handleUpdatePayment}
              />
            </>
          )}

          {/* ACTIVE SESSIONS TAB */}
          {activeTab === 'active' && (
            <ActiveSessionsGrid
              sessions={activeSessions}
              loading={loading}
              onForceComplete={handleForceCompleteClick}
              onViewDetails={(session) => {
                setSelectedSession(session);
                setShowDetailsModal(true);
              }}
              calculateLivePenalty={calculateLivePenalty}
              calculateLiveAmount={calculateLiveAmount}
            />
          )}

          {/* PAYMENT ANALYTICS TAB */}
          {activeTab === 'payments' && (
            <PaymentAnalytics stats={paymentStats} loading={loading} />
          )}

          {/* SESSION ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <SessionAnalytics stats={sessionStats} loading={loading} />
          )}
        </div>
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onForceComplete={handleForceCompleteClick}
        onUpdatePayment={handleUpdatePayment}
        calculateLivePenalty={calculateLivePenalty}
        calculateLiveAmount={calculateLiveAmount}
      />

      {/* Force Complete Modal */}
      <ForceCompleteModal
        isOpen={showForceCompleteModal}
        onClose={() => setShowForceCompleteModal(false)}
        onConfirm={handleForceCompleteConfirm}
        session={selectedSession}
        forceCompleteData={forceCompleteData}
        setForceCompleteData={setForceCompleteData}
        calculateLivePenalty={calculateLivePenalty}
        calculateLiveAmount={calculateLiveAmount}
      />
    </div>
  );
};

// ========================================
// COMPONENT: Stat Card
// ========================================
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-emerald-500',
    emerald: 'from-emerald-500 to-teal-500',
    orange: 'from-orange-500 to-red-500',
    red: 'from-red-500 to-rose-500'
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 p-4"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ========================================
// COMPONENT: Tab Button
// ========================================
const TabButton = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 font-bold transition-all relative ${
      active
        ? 'text-blue-600 border-b-4 border-blue-600'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

// ========================================
// COMPONENT: Sessions Table
// ========================================
const SessionsTable = ({ sessions, loading, onViewDetails, onUpdatePayment }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Activity className="w-16 h-16 mb-3 opacity-50" />
        <p className="text-lg font-semibold">No sessions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Token</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Vehicle</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">User</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Slot</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Time</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Amount</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Payment</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Status</th>
            <th className="text-center py-3 px-4 text-xs font-bold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <p className="text-xs font-mono font-bold text-blue-600">{session.tokenId}</p>
              </td>
              <td className="py-3 px-4">
                <p className="font-bold text-gray-900">{session.vehicleNumber}</p>
                <p className="text-xs text-gray-500">{session.vehicleType}</p>
              </td>
              <td className="py-3 px-4">
                <p className="font-semibold text-gray-900">{session.userName}</p>
                <p className="text-xs text-gray-500">{session.userContact}</p>
              </td>
              <td className="py-3 px-4">
                <p className="font-bold text-gray-900">{session.slotId?.slotNumber || 'N/A'}</p>
                <p className="text-xs text-gray-500">Sec {session.slotId?.section}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(session.entryTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(session.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </td>
              <td className="py-3 px-4">
                <p className="text-lg font-black text-gray-900">
                  {session.isEmergencyVehicle ? 'FREE' : `₹${session.totalAmount}`}
                </p>
                {session.penaltyCharge > 0 && (
                  <p className="text-xs text-red-600 font-semibold">+₹{session.penaltyCharge} penalty</p>
                )}
              </td>
              <td className="py-3 px-4">
                {session.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                    <CheckCircle className="w-3 h-3" />
                    Paid
                  </span>
                ) : session.paymentStatus === 'pending' ? (
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                    <XCircle className="w-3 h-3" />
                    Failed
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                {session.status === 'active' && (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                )}
                {session.status === 'completed' && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">Completed</span>
                )}
                {session.status === 'cancelled' && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Cancelled</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={() => onViewDetails(session)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ========================================
// COMPONENT: Active Sessions Grid (WITH LIVE PENALTY)
// ========================================
const ActiveSessionsGrid = ({ sessions, loading, onForceComplete, onViewDetails, calculateLivePenalty, calculateLiveAmount }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Clock className="w-16 h-16 mb-3 opacity-50" />
        <p className="text-lg font-semibold">No active parking sessions</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.map((session) => {
        const livePenalty = calculateLivePenalty(session);
        const liveAmount = calculateLiveAmount(session);
        const isOvertime = session.liveData?.isOvertime || false;

        return (
          <motion.div
            key={session._id}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`bg-gradient-to-br ${
              isOvertime 
                ? 'from-red-50 to-orange-50 border-red-300' 
                : 'from-blue-50 to-indigo-50 border-blue-200'
            } border-2 rounded-xl p-4 space-y-3`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">{session.slotId?.slotNumber}</h3>
                <p className="text-xs text-gray-600 font-semibold">Section {session.slotId?.section}</p>
              </div>
              <span className={`${
                isOvertime ? 'bg-red-500' : 'bg-blue-500'
              } text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse`}>
                {isOvertime ? 'OVERTIME' : 'ACTIVE'}
              </span>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-bold text-gray-900">{session.vehicleNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-900">{session.userName}</p>
              </div>
            </div>

            {/* Time Info with Live Updates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-500 font-semibold mb-1">Elapsed</p>
                <p className="text-sm font-bold text-gray-900">
                  {session.liveData?.elapsedMinutes || 0} min
                </p>
              </div>
              <div className={`rounded-lg p-2 ${isOvertime ? 'bg-red-100' : 'bg-white'}`}>
                <p className="text-xs text-gray-500 font-semibold mb-1">
                  {isOvertime ? 'Overtime' : 'Remaining'}
                </p>
                <p className={`text-sm font-bold ${isOvertime ? 'text-red-600' : 'text-gray-900'}`}>
                  {isOvertime
                    ? `+${session.liveData?.overtimeMinutes || 0} min`
                    : `${session.liveData?.remainingMinutes || 0} min`}
                </p>
              </div>
            </div>

            {/* Emergency Badge */}
            {session.isEmergencyVehicle && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-600 text-xs font-black">EMERGENCY - FREE</span>
              </div>
            )}

            {/* Amount with Live Penalty */}
            <div className={`${
              session.isEmergencyVehicle 
                ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
            } text-white rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold opacity-90">
                  {session.isEmergencyVehicle ? 'FREE PARKING' : 'Current Amount'}
                </p>
                {isOvertime && !session.isEmergencyVehicle && (
                  <Timer className="w-4 h-4 animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-black">
                {session.isEmergencyVehicle ? 'FREE' : `₹${liveAmount}`}
              </p>
              {livePenalty > 0 && (
                <p className="text-xs font-semibold opacity-90 mt-1">
                  Base: ₹{session.totalAmount} + Penalty: ₹{livePenalty}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onViewDetails(session)}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => onForceComplete(session)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
              >
                Force Exit
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ========================================
// COMPONENT: Force Complete Modal
// ========================================
const ForceCompleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  session, 
  forceCompleteData, 
  setForceCompleteData,
  calculateLivePenalty,
  calculateLiveAmount
}) => {
  if (!isOpen || !session) return null;

  const livePenalty = calculateLivePenalty(session);
  const liveAmount = calculateLiveAmount(session);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Force Complete Session</h2>
              <p className="text-sm opacity-90 font-semibold mt-1">This action cannot be undone</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Session Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-semibold">Vehicle:</span>
                <span className="text-base font-black text-gray-900">{session.vehicleNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-semibold">Slot:</span>
                <span className="text-base font-bold text-gray-900">{session.slotId?.slotNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-semibold">Elapsed:</span>
                <span className="text-base font-bold text-gray-900">{session.liveData?.elapsedMinutes} min</span>
              </div>
              {livePenalty > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-sm text-red-600 font-semibold">Live Penalty:</span>
                  <span className="text-base font-black text-red-600">₹{livePenalty}</span>
                </div>
              )}
            </div>

            {/* Amount Breakdown */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700 font-bold mb-2">Final Amount Breakdown</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Amount:</span>
                  <span className="font-bold text-gray-900">₹{session.totalAmount}</span>
                </div>
                {livePenalty > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">Overtime Penalty:</span>
                    <span className="font-bold text-red-600">₹{livePenalty}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-green-300 pt-2 mt-2">
                  <span className="text-base font-bold text-green-700">Total:</span>
                  <span className="text-xl font-black text-green-700">
                    {session.isEmergencyVehicle ? 'FREE' : `₹${liveAmount}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Reason for Force Completion *
              </label>
              <textarea
                value={forceCompleteData.reason}
                onChange={(e) => setForceCompleteData({ ...forceCompleteData, reason: e.target.value })}
                placeholder="Enter reason (e.g., Emergency exit, User request, System maintenance)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all resize-none"
                rows="3"
              />
            </div>

            {/* Payment Method */}
            {!session.isEmergencyVehicle && liveAmount > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={forceCompleteData.paymentMethod}
                  onChange={(e) => setForceCompleteData({ ...forceCompleteData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-50 font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!forceCompleteData.reason.trim()}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Force Complete
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ========================================
// COMPONENT: Payment Analytics (Keep existing)
// ========================================
const PaymentAnalytics = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { summary, paymentMethods, dailyRevenue, vehicleTypeRevenue } = stats;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Revenue"
          value={`₹${summary?.totalRevenue || 0}`}
          color="green"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Paid Amount"
          value={`₹${summary?.totalPaid || 0}`}
          color="emerald"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending Amount"
          value={`₹${summary?.totalPending || 0}`}
          color="orange"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Total Penalty"
          value={`₹${summary?.totalPenalty || 0}`}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-black text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {paymentMethods?.map((method) => (
              <div key={method._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="font-bold text-gray-900">{method._id || 'Unknown'}</span>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900">₹{method.amount}</p>
                  <p className="text-xs text-gray-500">{method.count} transactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Type Revenue */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-black text-gray-900 mb-4">Revenue by Vehicle Type</h3>
          <div className="space-y-3">
            {vehicleTypeRevenue?.map((vehicle) => (
              <div key={vehicle._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-gray-600" />
                  <span className="font-bold text-gray-900">{vehicle._id}</span>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900">₹{vehicle.revenue}</p>
                  <p className="text-xs text-gray-500">{vehicle.count} sessions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-black text-gray-900 mb-4">Daily Revenue Trend</h3>
        <div className="space-y-2">
          {dailyRevenue?.map((day) => {
            const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue));
            const percentage = (day.revenue / maxRevenue) * 100;
            return (
              <div key={day._id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-700">
                    {new Date(day._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm font-black text-gray-900">₹{day.revenue}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPONENT: Session Analytics (Keep existing)
// ========================================
const SessionAnalytics = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { today, yesterday, thisWeek, thisMonth, hourlyDistribution, peakHour } = stats;

  return (
    <div className="space-y-6">
      {/* Time-based Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Today</p>
              <p className="text-2xl font-black text-gray-900">
                {today?.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold">
            Revenue: ₹{today?.reduce((sum, item) => sum + item.revenue, 0) || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Yesterday</p>
              <p className="text-2xl font-black text-gray-900">{yesterday?.count || 0}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold">Revenue: ₹{yesterday?.revenue || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">This Week</p>
              <p className="text-2xl font-black text-gray-900">{thisWeek?.count || 0}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold">Revenue: ₹{thisWeek?.revenue || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">This Month</p>
              <p className="text-2xl font-black text-gray-900">{thisMonth?.count || 0}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold">Revenue: ₹{thisMonth?.revenue || 0}</p>
        </div>
      </div>

      {/* Peak Hour */}
      {peakHour && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-orange-600 font-bold uppercase">Peak Hour Today</p>
              <p className="text-3xl font-black text-orange-900">
                {peakHour._id}:00 - {peakHour._id + 1}:00
              </p>
              <p className="text-sm text-orange-700 font-semibold">{peakHour.count} bookings</p>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Distribution */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-black text-gray-900 mb-4">Hourly Distribution (Today)</h3>
        <div className="space-y-2">
          {hourlyDistribution?.map((hour) => {
            const maxCount = Math.max(...hourlyDistribution.map((h) => h.count));
            const percentage = (hour.count / maxCount) * 100;
            return (
              <div key={hour._id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-700">
                    {hour._id}:00 - {hour._id + 1}:00
                  </span>
                  <span className="text-sm font-black text-gray-900">{hour.count} sessions</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPONENT: Session Details Modal
// ========================================
const SessionDetailsModal = ({ session, isOpen, onClose, onForceComplete, onUpdatePayment, calculateLivePenalty, calculateLiveAmount }) => {
  if (!isOpen || !session) return null;

  const livePenalty = session.status === 'active' ? calculateLivePenalty(session) : session.penaltyCharge || 0;
  const liveAmount = session.status === 'active' ? calculateLiveAmount(session) : session.totalAmount;

  // Validation flags
  const canForceComplete = session.status === 'active';
  const canUpdatePayment = session.status !== 'cancelled' && !session.isEmergencyVehicle && session.paymentStatus !== 'paid';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-black">Session Details</h2>
              <p className="text-sm opacity-90 font-semibold mt-1">{session.tokenId}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-center gap-4">
              {session.status === 'active' && (
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                  🟢 ACTIVE PARKING
                </span>
              )}
              {session.status === 'completed' && (
                <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold">
                  ✅ COMPLETED
                </span>
              )}
              {session.status === 'cancelled' && (
                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                  ❌ CANCELLED
                </span>
              )}
              {session.isEmergencyVehicle && (
                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                  🚨 EMERGENCY
                </span>
              )}
            </div>

            {/* Vehicle & User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Vehicle</p>
                <p className="text-xl font-black text-gray-900 font-mono">{session.vehicleNumber}</p>
                <p className="text-sm text-gray-600 font-semibold">{session.vehicleType}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Owner</p>
                <p className="text-lg font-bold text-gray-900">{session.userName}</p>
                <p className="text-sm text-gray-600 font-semibold">{session.userContact}</p>
              </div>
            </div>

            {/* Slot Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-bold uppercase mb-2">Parking Slot</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-blue-900">{session.slotId?.slotNumber}</p>
                  <p className="text-sm text-blue-700 font-semibold">
                    Section {session.slotId?.section} • {session.slotId?.slotType}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-semibold">Gate</p>
                  <p className="text-lg font-bold text-blue-900">{session.slotId?.entryGate}</p>
                </div>
              </div>
            </div>

            {/* Time Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Entry</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(session.entryTime).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Duration</p>
                <p className="text-sm font-bold text-gray-900">{session.allottedDuration} min</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  {session.status === 'active' ? 'Elapsed' : 'Actual'}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {session.status === 'active' 
                    ? `${session.liveData?.elapsedMinutes || 0} min` 
                    : `${session.actualDuration || 0} min`}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className={`${
              session.isEmergencyVehicle 
                ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
            } text-white rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold opacity-90">
                  {session.isEmergencyVehicle ? 'FREE PARKING' : 'Amount Details'}
                </p>
                <p className="text-3xl font-black">
                  {session.isEmergencyVehicle ? 'FREE' : `₹${liveAmount}`}
                </p>
              </div>
              
              {!session.isEmergencyVehicle && (
                <>
                  <div className="flex justify-between text-sm opacity-90 mb-1">
                    <span>Base Amount:</span>
                    <span>₹{session.totalAmount}</span>
                  </div>
                  {livePenalty > 0 && (
                    <div className="flex justify-between text-sm opacity-90">
                      <span>Overtime Penalty:</span>
                      <span>₹{livePenalty}</span>
                    </div>
                  )}
                </>
              )}

              <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                <span className="text-sm font-semibold">Payment Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    session.paymentStatus === 'paid'
                      ? 'bg-white/20 text-white'
                      : session.paymentStatus === 'pending'
                      ? 'bg-yellow-300 text-yellow-900'
                      : 'bg-red-300 text-red-900'
                  }`}
                >
                  {session.paymentStatus.toUpperCase()}
                </span>
              </div>

              {session.paymentMethod && (
                <div className="mt-2 text-sm opacity-90">
                  <span>Payment Method: {session.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {canForceComplete && (
                <button
                  onClick={() => {
                    onClose();
                    onForceComplete(session);
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Force Complete
                </button>
              )}
              {canUpdatePayment && (
                <button
                  onClick={() => onUpdatePayment(session._id, 'paid', 'Cash')}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Paid
                </button>
              )}
              {!canForceComplete && !canUpdatePayment && (
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Close
                </button>
              )}
            </div>

            {/* Validation Messages */}
            {session.status === 'cancelled' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-center">
                <p className="text-red-700 text-sm font-bold">
                  ❌ Cannot modify cancelled session
                </p>
              </div>
            )}
            {session.status === 'completed' && session.paymentStatus === 'paid' && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                <p className="text-green-700 text-sm font-bold">
                  ✅ Session completed and paid
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminSessions;
