import { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, RefreshCw, Zap, AlertTriangle, Car,
  Settings, Edit, MapPin, DoorOpen, Activity,
  CheckCircle, XCircle, Clock, Grid, ChevronRight,
  Building2, Layers, Info, TrendingUp, X, Save,
  Power, Trash2, DollarSign, Trash, Wifi, WifiOff,
  Wrench, AlertCircle
} from 'lucide-react';
import AuthContext from '../Context/Context';
import toast from 'react-hot-toast';

const SlotManagement = () => {
  const {
    getAllSlots,
    generateSlots,
    updateSlot,
    deleteSlot,
    deleteAllSlots,
    toggleSlotStatus,
    setEmergencySlot,
    clearEmergencySlot,
    getDashboardStats
  } = useContext(AuthContext);

  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  
  // Generate Form
  const [generateForm, setGenerateForm] = useState({
    sections: 'A,B,C',
    rows: 4,
    columns: 5,
    slotTypes: { ev: 15 },
    pricingConfig: {
      car: { base: 25 },
      ev: { base: 30, chargerCost: 35 },
      disabled: { base: 20 }
    }
  });
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    slotType: 'Normal',
    size: 'Medium',
    isActive: true,
    isReserved: false,
    vehicleTypes: ['Car'],
    entryGate: 'Gate1',
    exitGate: 'Gate1',
    sensorStatus: 'online',
    emergencyMode: false,
    emergencyPriority: 0,
    pricing: { baseRate: 25, peakHourRate: 38 },
    amenities: [],
    notes: ''
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    section: '',
    slotType: '',
    status: '',
    sensorStatus: '',
    gate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsRes, statsRes] = await Promise.all([
        getAllSlots(),
        getDashboardStats()
      ]);
      
      if (slotsRes?.success) {
        const slotsData = slotsRes.data?.slots || slotsRes.slots || slotsRes.data || [];
        setSlots(Array.isArray(slotsData) ? slotsData : []);
      } else {
        setSlots([]);
      }
      
      if (statsRes?.success) {
        setStats(statsRes.data || statsRes.stats || {});
      }
    } catch (error) {
      console.error('Load Data Error:', error);
      setSlots([]);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await generateSlots(generateForm);
      if (result?.success) {
        toast.success(result.message || 'Slots generated successfully');
        setShowGenerateModal(false);
        await loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllSlots = async () => {
    setLoading(true);
    try {
      const result = await deleteAllSlots();
      if (result?.success) {
        toast.success('All slots deleted successfully');
        setShowDeleteAllModal(false);
        setSlots([]);
        await loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Group slots by section and organize by rows/columns
  const organizedSlots = useMemo(() => {
    let filtered = [...slots];

    // Apply filters
    if (filters.search) {
      filtered = filtered.filter(s => 
        s.slotNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.section?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.section) filtered = filtered.filter(s => s.section === filters.section);
    if (filters.slotType) filtered = filtered.filter(s => s.slotType === filters.slotType);
    if (filters.gate) filtered = filtered.filter(s => s.entryGate === filters.gate);
    if (filters.sensorStatus) filtered = filtered.filter(s => s.sensorStatus === filters.sensorStatus);
    
    if (filters.status) {
      if (filters.status === 'occupied') filtered = filtered.filter(s => s.isOccupied);
      if (filters.status === 'available') filtered = filtered.filter(s => !s.isOccupied && s.isActive);
      if (filters.status === 'reserved') filtered = filtered.filter(s => s.isReserved);
      if (filters.status === 'inactive') filtered = filtered.filter(s => !s.isActive);
      if (filters.status === 'emergency') filtered = filtered.filter(s => s.emergencyMode);
    }

    // Group by section
    const sections = {};
    filtered.forEach(slot => {
      const section = slot.section || 'Unknown';
      if (!sections[section]) {
        sections[section] = {
          slots: [],
          gate: slot.entryGate || 'Gate1',
          rows: new Set(),
          columns: new Set()
        };
      }
      sections[section].slots.push(slot);
      if (slot.position?.row) sections[section].rows.add(slot.position.row);
      if (slot.position?.column) sections[section].columns.add(slot.position.column);
    });

    // Organize slots by row and column
    Object.keys(sections).forEach(sectionKey => {
      const section = sections[sectionKey];
      const maxRow = Math.max(...Array.from(section.rows), 0);
      const maxCol = Math.max(...Array.from(section.columns), 0);
      
      const grid = [];
      for (let row = 1; row <= maxRow; row++) {
        const rowSlots = [];
        for (let col = 1; col <= maxCol; col++) {
          const slot = section.slots.find(s => s.position?.row === row && s.position?.column === col);
          rowSlots.push(slot || null);
        }
        grid.push(rowSlots);
      }
      section.grid = grid;
    });

    return sections;
  }, [slots, filters]);

  const openSlotDetails = (slot) => {
    if (!slot) return;
    setSelectedSlot(slot);
    setEditForm({
      slotType: slot.slotType || 'Normal',
      size: slot.size || 'Medium',
      isActive: slot.isActive ?? true,
      isReserved: slot.isReserved || false,
      vehicleTypes: slot.vehicleTypes || ['Car'],
      entryGate: slot.entryGate || 'Gate1',
      exitGate: slot.exitGate || 'Gate1',
      sensorStatus: slot.sensorStatus || 'online',
      emergencyMode: slot.emergencyMode || false,
      emergencyPriority: slot.emergencyPriority || 0,
      pricing: slot.pricing || { baseRate: 25, peakHourRate: 38 },
      amenities: slot.amenities || [],
      notes: slot.notes || ''
    });
    setShowSidebar(true);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    try {
      const result = await updateSlot(selectedSlot._id, editForm);
      if (result?.success) {
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot._id === selectedSlot._id 
              ? { ...slot, ...editForm }
              : slot
          )
        );
        setShowSidebar(false);
        await loadData();
      }
    } catch (error) {
      console.error('Update Error:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedSlot) return;
    
    try {
      const result = await toggleSlotStatus(selectedSlot._id);
      if (result?.success) {
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot._id === selectedSlot._id 
              ? { ...slot, isActive: !slot.isActive }
              : slot
          )
        );
        setShowSidebar(false);
        await loadData();
      }
    } catch (error) {
      console.error('Toggle Error:', error);
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlot || !window.confirm(`Delete slot ${selectedSlot.slotNumber} permanently?`)) return;
    
    try {
      const result = await deleteSlot(selectedSlot._id);
      if (result?.success) {
        setSlots(prevSlots => prevSlots.filter(slot => slot._id !== selectedSlot._id));
        setShowSidebar(false);
        await loadData();
      }
    } catch (error) {
      console.error('Delete Error:', error);
    }
  };

  const handleEmergency = async () => {
    if (!selectedSlot) return;
    
    try {
      const result = await setEmergencySlot(selectedSlot._id, 3);
      if (result?.success) {
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot._id === selectedSlot._id 
              ? { ...slot, emergencyMode: true, emergencyPriority: 3 }
              : slot
          )
        );
        setShowSidebar(false);
        await loadData();
      }
    } catch (error) {
      console.error('Emergency Error:', error);
    }
  };

  const handleClearEmergency = async () => {
    if (!selectedSlot) return;
    
    try {
      const result = await clearEmergencySlot(selectedSlot._id);
      if (result?.success) {
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot._id === selectedSlot._id 
              ? { ...slot, emergencyMode: false, emergencyPriority: 0 }
              : slot
          )
        );
        setShowSidebar(false);
        await loadData();
      }
    } catch (error) {
      console.error('Clear Emergency Error:', error);
    }
  };

  const getSlotColor = (slot) => {
    if (!slot) return 'bg-gray-100 border-gray-200';
    
    // Emergency priority
    if (slot.emergencyMode || slot.slotType === 'Emergency') return 'bg-red-500 border-red-600 shadow-xl';
    
    // Sensor status affects appearance
    if (slot.sensorStatus === 'faulty' || slot.sensorStatus === 'offline') {
      return 'bg-yellow-400 border-yellow-500 opacity-75';
    }
    if (slot.sensorStatus === 'maintenance') {
      return 'bg-purple-400 border-purple-500';
    }
    
    // Regular status
    if (!slot.isActive) return 'bg-gray-400 border-gray-500';
    if (slot.isOccupied) return 'bg-orange-500 border-orange-600';
    if (slot.isReserved) return 'bg-blue-500 border-blue-600';
    if (slot.slotType === 'EV') return 'bg-emerald-500 border-emerald-600';
    
    return 'bg-emerald-500 border-emerald-600';
  };

  const getSlotIcon = (slot) => {
    if (!slot) return null;
    
    // Sensor status icons
    if (slot.sensorStatus === 'offline') return <WifiOff className="w-4 h-4" />;
    if (slot.sensorStatus === 'faulty') return <AlertCircle className="w-4 h-4" />;
    if (slot.sensorStatus === 'maintenance') return <Wrench className="w-4 h-4" />;
    
    // Type icons
    if (slot.slotType === 'EV') return <Zap className="w-4 h-4" />;
    if (slot.slotType === 'Emergency' || slot.emergencyMode) return <AlertTriangle className="w-4 h-4" />;
    
    return <Car className="w-4 h-4" />;
  };

  const getStatusText = (slot) => {
    if (!slot) return '';
    
    // Sensor status priority
    if (slot.sensorStatus === 'offline') return 'Offline';
    if (slot.sensorStatus === 'faulty') return 'Faulty';
    if (slot.sensorStatus === 'maintenance') return 'Maintenance';
    
    // Regular status
    if (slot.emergencyMode || slot.slotType === 'Emergency') return 'Emergency';
    if (!slot.isActive) return 'Inactive';
    if (slot.isOccupied) return 'Occupied';
    if (slot.isReserved) return 'Reserved';
    
    return 'Available';
  };

  const getSensorStatusBadge = (status) => {
    const badges = {
      online: { icon: Wifi, color: 'text-green-600 bg-green-100', label: 'Online' },
      offline: { icon: WifiOff, color: 'text-gray-600 bg-gray-200', label: 'Offline' },
      faulty: { icon: AlertCircle, color: 'text-orange-600 bg-orange-100', label: 'Faulty' },
      maintenance: { icon: Wrench, color: 'text-purple-600 bg-purple-100', label: 'Maintenance' }
    };
    
    const badge = badges[status] || badges.online;
    const Icon = badge.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </div>
    );
  };

  const uniqueSections = [...new Set(slots.map(s => s.section))].sort();
  const uniqueGates = [...new Set(slots.map(s => s.entryGate))].sort();

  // Calculate sensor statistics
  const sensorStats = useMemo(() => {
    const stats = {
      online: slots.filter(s => s.sensorStatus === 'online').length,
      offline: slots.filter(s => s.sensorStatus === 'offline').length,
      faulty: slots.filter(s => s.sensorStatus === 'faulty').length,
      maintenance: slots.filter(s => s.sensorStatus === 'maintenance').length
    };
    return stats;
  }, [slots]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading Parking Layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Parking Management System</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {stats.totalSlots || slots.length} Total Slots • {stats.availableSlots || slots.filter(s => !s.isOccupied && s.isActive).length} Available
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Generate Layout
              </button>
              {slots.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all shadow-md"
                >
                  <Trash className="w-4 h-4" />
                  Delete All
                </button>
              )}
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Grid with Sensor Status */}
          <div className="grid grid-cols-8 gap-3">
            <StatCard label="Total" value={slots.length} icon={Grid} color="blue" />
            <StatCard label="Available" value={slots.filter(s => !s.isOccupied && s.isActive).length} icon={CheckCircle} color="green" />
            <StatCard label="Occupied" value={slots.filter(s => s.isOccupied).length} icon={Car} color="orange" />
            <StatCard label="EV Slots" value={slots.filter(s => s.slotType === 'EV').length} icon={Zap} color="green" />
            <StatCard label="Online" value={sensorStats.online} icon={Wifi} color="green" />
            <StatCard label="Faulty" value={sensorStats.faulty} icon={AlertCircle} color="orange" />
            <StatCard label="Offline" value={sensorStats.offline} icon={WifiOff} color="gray" />
            <StatCard label="Emergency" value={slots.filter(s => s.slotType === 'Emergency' || s.emergencyMode).length} icon={AlertTriangle} color="red" />
          </div>

          {/* Filters */}
          {slots.length > 0 && (
            <div className="mt-4 flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search slot number or section..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={filters.section}
                onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                {uniqueSections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="inactive">Inactive</option>
                <option value="emergency">Emergency</option>
              </select>

              <select
                value={filters.sensorStatus}
                onChange={(e) => setFilters({ ...filters, sensorStatus: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sensors</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="faulty">Faulty</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                value={filters.slotType}
                onChange={(e) => setFilters({ ...filters, slotType: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="Normal">Normal (Car)</option>
                <option value="EV">EV Charging</option>
                <option value="Emergency">Emergency</option>
                <option value="Disabled">Disabled</option>
              </select>

              {Object.values(filters).some(v => v) && (
                <button
                  onClick={() => setFilters({ search: '', section: '', slotType: '', status: '', sensorStatus: '', gate: '' })}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Parking Layout */}
      <main className="max-w-full px-6 py-6">
        {Object.keys(organizedSlots).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-20 text-center">
            <Grid className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-xl font-semibold">No slots found</p>
            <p className="text-gray-400 text-sm mt-2">
              {slots.length === 0 
                ? 'Generate a parking layout to get started' 
                : 'No slots match your current filters'}
            </p>
            {slots.length === 0 && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Generate Layout
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(organizedSlots).sort(([a], [b]) => a.localeCompare(b)).map(([sectionName, sectionData], sIdx) => (
              <motion.div
                key={sectionName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden"
              >
                {/* Section Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between border-b-4 border-slate-900">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border-2 border-white/20">
                      <MapPin className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-wide">Section {sectionName}</h2>
                      <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" />
                        {sectionData.slots.length} slots • {sectionData.slots.filter(s => !s.isOccupied && s.isActive).length} available
                      </p>
                    </div>
                  </div>

                  {/* Gate Indicator */}
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur px-5 py-3 rounded-xl border-2 border-white/20">
                    <DoorOpen className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-xs text-slate-300 uppercase tracking-wide">Entry/Exit</p>
                      <p className="text-lg font-bold text-white">{sectionData.gate}</p>
                    </div>
                  </div>
                </div>

                {/* Parking Grid */}
                <div className="p-6">
                  <div className="relative">
                    {/* Gate Entrance Arrow */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-emerald-500 text-white px-3 py-2 rounded-r-xl shadow-lg z-10">
                      <DoorOpen className="w-5 h-5" />
                      <ChevronRight className="w-4 h-4" />
                    </div>

                    {/* Slot Grid */}
                    <div className="space-y-3">
                      {sectionData.grid?.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-3">
                          {/* Row Number */}
                          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-sm font-bold text-white">{rowIdx + 1}</span>
                          </div>

                          {/* Slots in Row */}
                          <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                            {row.map((slot, colIdx) => (
                              <motion.div
                                key={colIdx}
                                whileHover={{ scale: slot ? 1.05 : 1, zIndex: 10 }}
                                className={`relative h-32 rounded-xl border-2 transition-all shadow-md ${
                                  slot ? getSlotColor(slot) + ' cursor-pointer' : 'bg-gray-100 border-dashed border-gray-300'
                                }`}
                                onClick={() => openSlotDetails(slot)}
                              >
                                {slot ? (
                                  <div className="h-full flex flex-col justify-between p-3">
                                    {/* Slot Number & Badges */}
                                    <div className="flex items-start justify-between">
                                      <span className="text-sm font-bold text-white drop-shadow-lg">{slot.slotNumber}</span>
                                      <div className="flex gap-1">
                                        {slot.slotType === 'EV' && (
                                          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                                            <Zap className="w-3.5 h-3.5 text-yellow-900" />
                                          </div>
                                        )}
                                        {(slot.emergencyMode || slot.slotType === 'Emergency') && (
                                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Icon & Status */}
                                    <div className="flex flex-col items-center justify-center flex-1">
                                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur mb-2">
                                        <div className="text-white">
                                          {getSlotIcon(slot)}
                                        </div>
                                      </div>
                                      <p className="text-[10px] font-bold text-white text-center uppercase tracking-wide">
                                        {getStatusText(slot)}
                                      </p>
                                    </div>

                                    {/* Price & Sensor */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-center gap-1 bg-white/20 backdrop-blur rounded-lg px-2 py-1">
                                        <TrendingUp className="w-3 h-3 text-white" />
                                        <span className="text-xs font-bold text-white">
                                          {slot.slotType === 'Emergency' ? 'FREE' : `₹${slot.pricing?.baseRate}`}
                                        </span>
                                      </div>
                                      {slot.sensorStatus !== 'online' && (
                                        <div className="flex items-center justify-center gap-1 bg-white/30 backdrop-blur rounded-lg px-2 py-0.5">
                                          {slot.sensorStatus === 'offline' && <WifiOff className="w-2.5 h-2.5 text-white" />}
                                          {slot.sensorStatus === 'faulty' && <AlertCircle className="w-2.5 h-2.5 text-white" />}
                                          {slot.sensorStatus === 'maintenance' && <Wrench className="w-2.5 h-2.5 text-white" />}
                                          <span className="text-[9px] font-bold text-white uppercase">{slot.sensorStatus}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-xs text-gray-400 font-medium">Empty</span>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Exit Arrow */}
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-l-xl shadow-lg z-10">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <DoorOpen className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Legend */}
        {slots.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Status Legend
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <LegendItem color="bg-emerald-500" label="Available / EV" icon={<Zap className="w-4 h-4" />} />
              <LegendItem color="bg-orange-500" label="Occupied" icon={<Car className="w-4 h-4" />} />
              <LegendItem color="bg-blue-500" label="Reserved" icon={<Clock className="w-4 h-4" />} />
              <LegendItem color="bg-red-500" label="Emergency (FREE)" icon={<AlertTriangle className="w-4 h-4" />} />
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 mt-6">
              <Activity className="w-5 h-5 text-purple-600" />
              Sensor Status
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <LegendItem color="bg-green-500" label="Online" icon={<Wifi className="w-4 h-4" />} />
              <LegendItem color="bg-yellow-400" label="Faulty" icon={<AlertCircle className="w-4 h-4" />} />
              <LegendItem color="bg-gray-400" label="Offline" icon={<WifiOff className="w-4 h-4" />} />
              <LegendItem color="bg-purple-400" label="Maintenance" icon={<Wrench className="w-4 h-4" />} />
            </div>
          </div>
        )}
      </main>

      {/* Sidebar - Edit Slot */}
      <AnimatePresence>
        {showSidebar && selectedSlot && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: 480, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 480, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-[34rem] bg-white shadow-2xl z-50 overflow-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between z-10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Slot Controls</h2>
                    <p className="text-sm text-blue-100 mt-0.5">{selectedSlot.slotNumber} • Section {selectedSlot.section}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSidebar(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateSlot} className="p-6 space-y-6">
                {/* Status Overview */}
                <div className={`rounded-2xl border-2 ${getSlotColor(selectedSlot)} p-5 shadow-xl`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-white drop-shadow-lg">{selectedSlot.slotNumber}</span>
                    <span className="text-xs px-4 py-2 bg-white/25 text-white rounded-xl font-bold backdrop-blur-sm">
                      {getStatusText(selectedSlot)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-white/95 bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Row {selectedSlot.position?.row}, Col {selectedSlot.position?.column}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4" />
                      <span>{selectedSlot.entryGate}</span>
                    </div>
                  </div>
                  
                  {/* Sensor Status Badge */}
                  <div className="mt-3">
                    {getSensorStatusBadge(selectedSlot.sensorStatus)}
                  </div>
                </div>

                {/* Vehicle Type Display */}
                <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-3">
                    <Car className="w-4 h-4" />
                    Vehicle Type
                  </label>
                  <div className="bg-white rounded-lg p-3 border border-blue-300">
                    <p className="text-gray-800 font-semibold">
                      {selectedSlot.slotType === 'EV' ? '⚡ Electric Vehicle (Car)' : 
                       selectedSlot.slotType === 'Emergency' ? '🚨 Emergency Vehicle (FREE)' : 
                       '🚗 Regular Car'}
                    </p>
                  </div>
                </div>

                {/* Slot Type & Size */}
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <Layers className="w-4 h-4" />
                      Slot Type
                    </label>
                    <select
                      value={editForm.slotType}
                      onChange={(e) => setEditForm({ ...editForm, slotType: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 bg-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Normal">Normal (Car)</option>
                      <option value="EV">EV Charging</option>
                      <option value="Emergency">Emergency (FREE)</option>
                      <option value="Disabled">Disabled Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <Grid className="w-4 h-4" />
                      Size
                    </label>
                    <select
                      value={editForm.size}
                      onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 bg-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                {selectedSlot.slotType !== 'Emergency' && (
                  <div className="bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 mb-3">
                      <DollarSign className="w-4 h-4" />
                      Pricing (₹/hour)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-2">Base Rate</label>
                        <input
                          type="number"
                          value={editForm.pricing.baseRate}
                          onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, baseRate: parseInt(e.target.value) || 0 } })}
                          className="w-full px-3 py-2.5 border-2 border-emerald-300 bg-white rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-2">Peak Rate</label>
                        <input
                          type="number"
                          value={editForm.pricing.peakHourRate}
                          onChange={(e) => setEditForm({ ...editForm, pricing: { ...editForm.pricing, peakHourRate: parseInt(e.target.value) || 0 } })}
                          className="w-full px-3 py-2.5 border-2 border-emerald-300 bg-white rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sensor Status - Radio Buttons */}
                <div className="bg-purple-50 rounded-2xl p-5 border-2 border-purple-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-4">
                    <Activity className="w-4 h-4" />
                    Sensor Status
                  </label>
                  <div className="space-y-3">
                    {['online', 'offline', 'faulty', 'maintenance'].map((status) => (
                      <label key={status} className="flex items-center gap-3 cursor-pointer group p-3 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 transition">
                        <input
                          type="radio"
                          name="sensorStatus"
                          value={status}
                          checked={editForm.sensorStatus === status}
                          onChange={(e) => setEditForm({ ...editForm, sensorStatus: e.target.value })}
                          className="w-4 h-4 text-purple-600 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm font-semibold text-purple-900 capitalize flex items-center gap-2">
                          {status === 'online' && <Wifi className="w-4 h-4 text-green-600" />}
                          {status === 'offline' && <WifiOff className="w-4 h-4 text-gray-600" />}
                          {status === 'faulty' && <AlertCircle className="w-4 h-4 text-orange-600" />}
                          {status === 'maintenance' && <Wrench className="w-4 h-4 text-purple-600" />}
                          {status}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Controls - Radio Buttons */}
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 space-y-4">
                  <p className="text-sm font-bold text-slate-700 mb-3">Slot Status</p>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-400 transition">
                      <input
                        type="radio"
                        name="slotStatus"
                        checked={editForm.isActive && !editForm.isReserved && !editForm.emergencyMode}
                        onChange={() => setEditForm({ ...editForm, isActive: true, isReserved: false, emergencyMode: false })}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Active/Available
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-amber-400 transition">
                      <input
                        type="radio"
                        name="slotStatus"
                        checked={editForm.isReserved}
                        onChange={() => setEditForm({ ...editForm, isReserved: true, isActive: true, emergencyMode: false })}
                        className="w-4 h-4 text-amber-600 focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Reserved
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-red-400 transition">
                      <input
                        type="radio"
                        name="slotStatus"
                        checked={editForm.emergencyMode}
                        onChange={() => setEditForm({ ...editForm, emergencyMode: true, isActive: true, isReserved: false })}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-500"
                      />
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Emergency Mode
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-gray-400 transition">
                      <input
                        type="radio"
                        name="slotStatus"
                        checked={!editForm.isActive}
                        onChange={() => setEditForm({ ...editForm, isActive: false, isReserved: false, emergencyMode: false })}
                        className="w-4 h-4 text-gray-600 focus:ring-2 focus:ring-gray-500"
                      />
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Power className="w-4 h-4 text-gray-600" />
                        Inactive
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                    <Edit className="w-4 h-4" />
                    Internal Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Add internal notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t-2 border-slate-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={loading}
                    className="w-full px-6 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Power className="w-4 h-4" />
                    {selectedSlot.isActive ? 'Deactivate' : 'Activate'} Slot
                  </motion.button>

                  {selectedSlot.emergencyMode || selectedSlot.slotType === 'Emergency' ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleClearEmergency}
                      disabled={loading}
                      className="w-full px-6 py-3.5 bg-slate-600 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Clear Emergency
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleEmergency}
                      disabled={loading}
                      className="w-full px-6 py-3.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Set Emergency
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleDeleteSlot}
                    disabled={loading}
                    className="w-full px-6 py-3.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Slot
                  </motion.button>
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGenerateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Grid className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Generate Parking Layout</h2>
                      <p className="text-sm text-blue-100 mt-0.5">Create organized parking sections</p>
                    </div>
                  </div>
                  <button onClick={() => setShowGenerateModal(false)} className="text-white hover:bg-white/20 p-2 rounded-xl transition">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleGenerateSlots} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Sections (comma-separated)</label>
                    <input
                      type="text"
                      value={generateForm.sections}
                      onChange={(e) => setGenerateForm({ ...generateForm, sections: e.target.value })}
                      placeholder="A,B,C,D"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Rows per Section</label>
                      <input
                        type="number"
                        value={generateForm.rows}
                        onChange={(e) => setGenerateForm({ ...generateForm, rows: parseInt(e.target.value) })}
                        min="1"
                        max="10"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Columns per Row</label>
                      <input
                        type="number"
                        value={generateForm.columns}
                        onChange={(e) => setGenerateForm({ ...generateForm, columns: parseInt(e.target.value) })}
                        min="1"
                        max="20"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">EV Slots (%)</label>
                    <input
                      type="number"
                      value={generateForm.slotTypes.ev}
                      onChange={(e) => setGenerateForm({ ...generateForm, slotTypes: { ...generateForm.slotTypes, ev: parseInt(e.target.value) } })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <p className="text-sm text-blue-900 font-semibold">
                      Will generate: {generateForm.sections.split(',').length} sections × {generateForm.rows} rows × {generateForm.columns} slots = {generateForm.sections.split(',').length * generateForm.rows * generateForm.columns} total slots
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate Layout'}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
                      className="px-6 py-3.5 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete All Modal */}
      <AnimatePresence>
        {showDeleteAllModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteAllModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Delete All Slots?</h2>
                  </div>
                  <button onClick={() => setShowDeleteAllModal(false)} className="text-white hover:bg-white/20 p-2 rounded-xl transition">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-6">
                    This will permanently delete all <span className="font-bold text-red-600">{slots.length} slots</span> from the system. This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteAllSlots}
                      disabled={loading}
                      className="flex-1 px-6 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete All'}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteAllModal(false)}
                      className="px-6 py-3.5 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border-2 ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, icon }) => (
  <div className="flex items-center gap-3">
    <div className={`w-10 h-10 ${color} rounded-lg border-2 border-gray-800 shadow-md flex items-center justify-center text-white`}>
      {icon}
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </div>
);

export default SlotManagement;
