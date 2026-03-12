import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Activity, DollarSign, Users, Car, Clock,
  RefreshCw, MapPin, AlertCircle, CheckCircle, Zap, Shield, Calendar,
  BarChart3, PieChart as PieChartIcon, ArrowUp, Download, Package, Wifi,
  Eye, XCircle, Circle, TrendingDown, Battery, Gauge
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { format, differenceInMinutes } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const API_BASE_URL = 'http://localhost:8008/api/admin';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [slotAnalytics, setSlotAnalytics] = useState({});
  const [sessionAnalytics, setSessionAnalytics] = useState({});
  const [paymentData, setPaymentData] = useState({});
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [dashboardRes, analyticsRes, sessionRes, paymentRes, activeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard`, config),
        axios.get(`${API_BASE_URL}/slots/analytics`, config),
        axios.get(`${API_BASE_URL}/sessions/analytics`, config),
        axios.get(`${API_BASE_URL}/sessions/payments`, config),
        axios.get(`${API_BASE_URL}/sessions/active`, config)
      ]);

      if (dashboardRes.data.success) {
        setStats(dashboardRes.data.stats);
      }
      if (analyticsRes.data.success) {
        setSlotAnalytics(analyticsRes.data.analytics);
      }
      if (sessionRes.data.success) {
        setSessionAnalytics(sessionRes.data);
      }
      if (paymentRes.data.success) {
        setPaymentData(paymentRes.data);
      }
      if (activeRes.data.success) {
        setActiveSessions(activeRes.data.sessions || []);
      }

      // toast.success('Dashboard refreshed', { duration: 2000 });
    } catch (error) {
      console.error('Dashboard Error:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleForceComplete = async (sessionId) => {
    if (!window.confirm('Force complete this session?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/sessions/${sessionId}/force-complete`,
        { reason: 'Admin override', paymentMethod: 'cash' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Session completed successfully');
        loadDashboardData();
        setSelectedSession(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete session');
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Slots', stats.totalSlots],
      ['Available Slots', stats.availableSlots],
      ['Occupied Slots', stats.occupiedSlots],
      ['Active Sessions', stats.activeSessions],
      ['Today Revenue', stats.todayRevenue],
      ['Week Revenue', stats.weekRevenue],
      ['Month Revenue', stats.monthRevenue],
      ['Total Revenue', stats.totalRevenue]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  if (loading && !stats.totalSlots) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b-2 border-neutral-200 shadow-lg sticky top-0 z-30 backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <LayoutDashboard className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-black text-neutral-900">SmartPark Analytics</h1>
                <p className="text-sm text-neutral-600 font-semibold">
                  Real-time Parking Management Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToCSV}
                className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Export Report
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadDashboardData}
                disabled={loading}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'slots', label: 'Slot Management', icon: Car },
            ].map(tab => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-blue-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              sessionAnalytics={sessionAnalytics}
              paymentData={paymentData}
              slotAnalytics={slotAnalytics}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab
              sessionAnalytics={sessionAnalytics}
              paymentData={paymentData}
              stats={stats}
              slotAnalytics={slotAnalytics}
            />
          )}
          {activeTab === 'slots' && (
            <SlotsTab slotAnalytics={slotAnalytics} stats={stats} />
          )}
          {activeTab === 'active' && (
            <ActiveSessionsTab
              activeSessions={activeSessions}
              onViewDetails={setSelectedSession}
              onForceComplete={handleForceComplete}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <SessionDetailsModal
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            onForceComplete={handleForceComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ stats, sessionAnalytics, paymentData, slotAnalytics }) => {
  // Transform daily revenue for chart (from dailyRevenue array)
  const revenueChartData = (paymentData.dailyRevenue || [])
    .slice(0, 7)
    .reverse()
    .map(item => ({
      date: format(new Date(item._id), 'MMM dd'),
      revenue: item.revenue || 0,
      count: item.count || 0
    }));

  // Occupancy pie data
  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedSlots || 0 },
    { name: 'Available', value: stats.availableSlots || 0 }
  ];

  // Payment methods pie data (combine all payment methods)
  const paymentMethodsData = (paymentData.paymentMethods || []).map(method => ({
    name: method._id,
    value: method.amount || 0
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Slots"
          value={stats.totalSlots || 0}
          subtitle={`${stats.occupancyRate || 0}% Occupancy`}
          icon={Car}
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricCard
          title="Available Now"
          value={stats.availableSlots || 0}
          subtitle={`${stats.occupiedSlots || 0} Occupied`}
          icon={CheckCircle}
          gradient="from-emerald-500 to-green-500"
          pulse
        />
        <MetricCard
          title="Active Sessions"
          value={stats.activeSessions || 0}
          subtitle="Live Monitoring"
          icon={Activity}
          gradient="from-orange-500 to-red-500"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue || 0}`}
          subtitle={`₹${stats.monthRevenue || 0} This Month`}
          icon={DollarSign}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <ChartCard title="Daily Revenue Trend" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Occupancy Distribution */}
        <ChartCard title="Slot Occupancy Distribution" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#ef4444" />
                <Cell fill="#10b981" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Slot Types Bar Chart */}
        <ChartCard title="Slot Type Distribution" icon={Package}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(slotAnalytics.byType || {}).map(([name, value]) => ({
                name,
                value
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Payment Methods */}
        <ChartCard title="Payment Methods Distribution" icon={DollarSign}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ₹${value}`}
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          label="Sessions Today"
          value={stats.sessionsToday || 0}
          icon={Activity}
          color="blue"
        />
        <QuickStatCard
          label="Emergency Slots"
          value={stats.emergencySlots || 0}
          icon={AlertCircle}
          color="red"
        />
        <QuickStatCard
          label="Week Revenue"
          value={`₹${stats.weekRevenue || 0}`}
          icon={TrendingUp}
          color="green"
        />
        <QuickStatCard
          label="Pending Payments"
          value={`₹${paymentData.pendingAmount || 0}`}
          icon={Clock}
          color="orange"
        />
      </div>
    </motion.div>
  );
};

// ==================== ANALYTICS TAB ====================
const AnalyticsTab = ({ sessionAnalytics, paymentData, stats, slotAnalytics }) => {
  // Peak hours chart data - PROPERLY FIXED
  const peakHoursData = (sessionAnalytics.hourlyDistribution || [])
    .map(item => {
      const hour = item._id; // This is 0-23 from backend
      
      // Proper 12-hour conversion
      let hour12;
      let ampm;
      
      if (hour === 0) {
        hour12 = 12;
        ampm = 'AM';
      } else if (hour < 12) {
        hour12 = hour;
        ampm = 'AM';
      } else if (hour === 12) {
        hour12 = 12;
        ampm = 'PM';
      } else {
        hour12 = hour - 12;
        ampm = 'PM';
      }
      
      return {
        hour: `${hour12}:00 ${ampm}`,
        sessions: item.count || 0,
        sortOrder: hour // Keep original 24-hour for sorting
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Session status breakdown
  const statusData = (sessionAnalytics.statusBreakdown || []).map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count || 0
  }));

  // Weekly sessions - calculate from thisWeek data
  const weeklySessionsData = [
    { day: 'Mon', sessions: Math.floor((sessionAnalytics.thisWeek?.count || 0) / 7) },
    { day: 'Tue', sessions: Math.floor((sessionAnalytics.thisWeek?.count || 0) / 7) },
    { day: 'Wed', sessions: Math.floor((sessionAnalytics.thisWeek?.count || 0) / 7) },
    { day: 'Thu', sessions: Math.floor((sessionAnalytics.thisWeek?.count || 0) / 7 * 1.1) },
    { day: 'Fri', sessions: Math.floor((sessionAnalytics.thisWeek?.count || 0) / 7 * 1.3) },
    { day: 'Sat', sessions: Math.floor((sessionAnalytics.thisWeek?.count || 0) / 7 * 1.5) },
    { day: 'Sun', sessions: Math.floor((sessionAnalytics.thisWeek?.count || 0) / 7 * 1.2) }
  ];

  // Revenue comparison
  const revenueComparisonData = [
    { period: 'Today', amount: paymentData.todayRevenue || 0 },
    { period: 'Week', amount: paymentData.weekRevenue || 0 },
    { period: 'Month', amount: paymentData.monthRevenue || 0 }
  ];

  // Find peak hour
  const peakHour = sessionAnalytics.peakHour 
    ? {
        hour: sessionAnalytics.peakHour._id < 12 
          ? `${sessionAnalytics.peakHour._id === 0 ? 12 : sessionAnalytics.peakHour._id}:00 AM`
          : `${sessionAnalytics.peakHour._id === 12 ? 12 : sessionAnalytics.peakHour._id - 12}:00 PM`,
        sessions: sessionAnalytics.peakHour.count
      }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Analytics Header */}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Sessions Trend */}
        <ChartCard title="Weekly Sessions Pattern" icon={Calendar}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklySessionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Session Status Breakdown */}
        <ChartCard title="Session Status Distribution" icon={Activity}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Revenue Comparison */}
      <ChartCard title="Revenue Comparison" icon={TrendingUp}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}
              formatter={(value) => [`₹${value}`, 'Revenue']}
            />
            <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
              {revenueComparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index + 3]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticCard
          label="Today's Sessions"
          value={sessionAnalytics.today?.length || 0}
          icon={Activity}
          color="indigo"
        />
        <AnalyticCard
          label="This Week"
          value={sessionAnalytics.thisWeek?.count || 0}
          icon={Calendar}
          color="emerald"
        />
        <AnalyticCard
          label="Occupancy Rate"
          value={`${stats.occupancyRate || 0}%`}
          icon={Gauge}
          color="orange"
        />
        <AnalyticCard
          label="Paid Sessions"
          value={paymentData.summary?.paidCount || 0}
          icon={DollarSign}
          color="purple"
        />
      </div>
    </motion.div>
  );
};

// ==================== SLOTS TAB ====================
const SlotsTab = ({ slotAnalytics, stats }) => {
  const sectionData = slotAnalytics.bySection || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Slot Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <SlotTypeCard
          title="Normal"
          count={slotAnalytics.byType?.Normal || 0}
          icon={Car}
          gradient="from-neutral-600 to-neutral-700"
        />
        <SlotTypeCard
          title="EV Charging"
          count={slotAnalytics.byType?.EV || 0}
          icon={Zap}
          gradient="from-yellow-500 to-orange-500"
        />
        <SlotTypeCard
          title="Emergency"
          count={slotAnalytics.byType?.Emergency || 0}
          icon={AlertCircle}
          gradient="from-red-500 to-rose-500"
        />
        <SlotTypeCard
          title="Disabled"
          count={slotAnalytics.byType?.Disabled || 0}
          icon={Shield}
          gradient="from-blue-500 to-indigo-500"
        />
        <SlotTypeCard
          title="Available"
          count={stats.availableSlots || 0}
          icon={CheckCircle}
          gradient="from-emerald-500 to-green-500"
        />
      </div>

      {/* Section-wise Distribution */}
      <ChartCard title="Section-wise Slot Distribution" icon={MapPin}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}
            />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
            <Bar dataKey="available" fill="#10b981" name="Available" radius={[4, 4, 0, 0]} />
            <Bar dataKey="occupied" fill="#ef4444" name="Occupied" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Section Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionData.map((section, idx) => (
          <SectionCard key={idx} section={section} />
        ))}
      </div>

      {/* Slot Status Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-neutral-200">
        <h3 className="text-xl font-black text-neutral-900 mb-4 flex items-center gap-2">
          <Wifi className="w-6 h-6 text-blue-600" />
          Slot Status Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard label="Total Slots" value={stats.totalSlots || 0} color="blue" />
          <StatusCard label="Occupied" value={stats.occupiedSlots || 0} color="red" />
          <StatusCard label="Available" value={stats.availableSlots || 0} color="green" />
          <StatusCard label="Reserved" value={stats.reservedSlots || 0} color="purple" />
        </div>
      </div>
    </motion.div>
  );
};

// ==================== ACTIVE SESSIONS TAB ====================
const ActiveSessionsTab = ({ activeSessions, onViewDetails, onForceComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-neutral-200">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-neutral-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            Live Active Sessions
          </h3>
          <div className="flex items-center gap-2 text-emerald-600">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold">{activeSessions.length} Active</span>
          </div>
        </div>
      </div>

      {/* Active Sessions Grid */}
      {activeSessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-neutral-200 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <p className="text-lg font-bold text-neutral-500">No active sessions at the moment</p>
          <p className="text-sm text-neutral-400">Sessions will appear here when vehicles enter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSessions.map((session) => (
            <ActiveSessionCard
              key={session._id}
              session={session}
              onView={() => onViewDetails(session)}
              onForceComplete={() => onForceComplete(session._id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ==================== HELPER COMPONENTS ====================
const MetricCard = ({ title, value, subtitle, icon: Icon, gradient, pulse }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-white rounded-2xl p-6 border-2 border-neutral-200 shadow-lg"
  >
    <div
      className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg mb-4 ${
        pulse ? 'animate-pulse' : ''
      }`}
    >
      <Icon className="w-7 h-7 text-white" />
    </div>
    <p className="text-sm font-bold text-neutral-600 mb-2 uppercase">{title}</p>
    <p className="text-4xl font-black text-neutral-900 mb-1">{value}</p>
    {subtitle && <p className="text-xs font-semibold text-blue-600">{subtitle}</p>}
  </motion.div>
);

const ChartCard = ({ title, icon: Icon, children, highlighted }) => (
  <div
    className={`bg-white rounded-2xl p-6 shadow-lg ${
      highlighted ? 'border-4 border-blue-500' : 'border-2 border-neutral-200'
    }`}
  >
    <h3 className="text-xl font-black text-neutral-900 mb-4 flex items-center gap-2">
      <Icon className="w-6 h-6 text-blue-600" />
      {title}
    </h3>
    {children}
  </div>
);

const QuickStatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    red: 'from-red-500 to-rose-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-emerald-500 to-green-500',
    orange: 'from-orange-500 to-red-500'
  };

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-neutral-200 shadow-md">
      <div className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black text-neutral-900">{value}</p>
      <p className="text-xs font-bold text-neutral-600 uppercase">{label}</p>
    </div>
  );
};

const AnalyticCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl p-5 border-2 border-neutral-200 shadow-md">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-black text-neutral-900 mb-1">{value}</p>
      <p className="text-xs font-bold text-neutral-600 uppercase">{label}</p>
    </div>
  );
};

const SlotTypeCard = ({ title, count, icon: Icon, gradient }) => (
  <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border-2 border-neutral-200 shadow-lg">
    <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm font-bold text-neutral-600 mb-2 uppercase">{title}</p>
    <p className="text-3xl font-black text-neutral-900">{count}</p>
  </motion.div>
);

const SectionCard = ({ section }) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-md">
    <div className="flex justify-between mb-4">
      <h4 className="text-xl font-black text-neutral-900">Section {section.name}</h4>
      <MapPin className="w-5 h-5 text-blue-600" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="text-center">
        <p className="text-2xl font-black text-neutral-900">{section.total}</p>
        <p className="text-xs font-semibold text-neutral-600">Total</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-black text-emerald-600">{section.available}</p>
        <p className="text-xs font-semibold text-neutral-600">Available</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-black text-orange-600">{section.occupied}</p>
        <p className="text-xs font-semibold text-neutral-600">Occupied</p>
      </div>
    </div>
  </div>
);

const StatusCard = ({ label, value, color }) => {
  const colors = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-emerald-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="text-center p-4 bg-neutral-50 rounded-xl border-2 border-neutral-200">
      <p className={`text-3xl font-black ${colors[color]}`}>{value}</p>
      <p className="text-xs font-bold text-neutral-600 uppercase mt-1">{label}</p>
    </div>
  );
};

const ActiveSessionCard = ({ session, onView, onForceComplete }) => {
  const elapsed = differenceInMinutes(new Date(), new Date(session.entryTime));
  const remaining = Math.max(0, session.allottedDuration - elapsed);
  const isOvertime = remaining === 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl p-5 border-2 shadow-lg ${
        isOvertime ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
      }`}
    >
      <div className="flex justify-between mb-3">
        <span className={`text-xs font-bold uppercase ${isOvertime ? 'text-red-600' : 'text-blue-600'}`}>
          {isOvertime ? '⚠️ Overtime' : '✓ Active'}
        </span>
        <Circle className={`w-3 h-3 fill-current animate-pulse ${isOvertime ? 'text-red-500' : 'text-emerald-500'}`} />
      </div>

      <p className="text-2xl font-black text-neutral-900 mb-2">{session.vehicleNumber}</p>
      <div className="space-y-1 mb-3">
        <p className="text-sm font-bold text-neutral-700">
          Slot: {session.slotId?.slotNumber || 'N/A'}
        </p>
        <p className="text-sm font-bold text-neutral-700">
          Type: {session.vehicleType}
        </p>
        <p className="text-xs text-neutral-600">{format(new Date(session.entryTime), 'hh:mm a')}</p>
      </div>

      <div className="flex justify-between pt-3 border-t-2 border-neutral-200 mb-3">
        <span className={`text-sm font-bold ${isOvertime ? 'text-red-600' : 'text-neutral-600'}`}>
          {isOvertime ? `+${Math.abs(remaining)}m overtime` : `${remaining}m left`}
        </span>
        <span className="text-emerald-700 font-black text-lg">₹{session.totalAmount}</span>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onView}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onForceComplete}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-1"
        >
          <XCircle className="w-4 h-4" />
          Complete
        </motion.button>
      </div>
    </motion.div>
  );
};

const SessionDetailsModal = ({ session, onClose, onForceComplete }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8"
    >
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-black text-neutral-900">Session Details</h2>
        <button onClick={onClose} className="p-2 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors">
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <DetailItem label="Token ID" value={session.tokenId} />
        <DetailItem label="Vehicle Number" value={session.vehicleNumber} />
        <DetailItem label="Vehicle Type" value={session.vehicleType} />
        <DetailItem label="Slot" value={session.slotId?.slotNumber || 'N/A'} />
        <DetailItem label="User Name" value={session.userName} />
        <DetailItem label="Contact" value={session.userContact} />
        <DetailItem label="Entry Time" value={format(new Date(session.entryTime), 'PPpp')} />
        <DetailItem label="Allotted Duration" value={`${session.allottedDuration} minutes`} />
        <DetailItem label="Total Amount" value={`₹${session.totalAmount}`} />
        <DetailItem label="Payment Status" value={session.paymentStatus.toUpperCase()} />
        <DetailItem label="Status" value={session.status.toUpperCase()} />
      </div>

      {session.status === 'active' && (
        <div className="mt-6 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onForceComplete(session._id)}
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold shadow-lg"
          >
            Force Complete Session
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg"
          >
            Close
          </motion.button>
        </div>
      )}
    </motion.div>
  </motion.div>
);

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between p-4 bg-neutral-50 rounded-xl border-2 border-neutral-200">
    <span className="font-bold text-neutral-600">{label}</span>
    <span className="font-black text-neutral-900">{value}</span>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 mx-auto mb-6"
      >
        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
      </motion.div>
      <p className="text-2xl font-black text-neutral-900">Loading Dashboard...</p>
      <p className="text-sm text-neutral-600 mt-2">Fetching real-time data</p>
    </div>
  </div>
);

export default AdminDashboard;
