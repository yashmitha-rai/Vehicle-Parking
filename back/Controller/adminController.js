const ParkingSlot = require('../models/ParkingSlot');
const ParkingSession = require('../models/ParkingSession');
const User = require('../models/User');

// @desc    Get Admin Dashboard Stats (ENHANCED)
// @desc    Get All Parking Slots (FIXED - Remove isActive filter)
// @desc    Get All Parking Slots WITH Occupied Vehicle Details (ADMIN)
exports.getAllSlots = async (req, res) => {
  try {
    const {
      section, slotType, status, vehicleType, emergency, gate,
      sensorStatus, size, minPrice, maxPrice, page = 1, limit = 500
    } = req.query;

    let filter = {}; // Shows ALL slots
    
    // All advanced filters
    if (section) filter.section = section;
    if (slotType) filter.slotType = slotType;
    if (status === 'occupied') filter.isOccupied = true;
    if (status === 'available') filter.$and = [{ isOccupied: false }, { isActive: true }, { isReserved: false }];
    if (status === 'reserved') filter.isReserved = true;
    if (status === 'inactive') filter.isActive = false;
    if (vehicleType) filter.vehicleTypes = vehicleType;
    if (emergency === 'true') filter.emergencyMode = true;
    if (emergency === 'false') filter.emergencyMode = false;
    if (gate) filter.$or = [{ entryGate: gate }, { exitGate: gate }];
    if (sensorStatus) filter.sensorStatus = sensorStatus;
    if (size) filter.size = size;
    if (minPrice || maxPrice) {
      filter['pricing.baseRate'] = {};
      if (minPrice) filter['pricing.baseRate'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.baseRate'].$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const total = await ParkingSlot.countDocuments(filter);

    // Get all slots with basic session info
    const slots = await ParkingSlot.find(filter)
      .populate('currentSessionId', 'status entryTime vehicleNumber userName userContact vehicleType tokenId allottedDuration isEmergencyVehicle')
      .populate('reservedFor', 'name email phone vehicleNumber')
      .sort({ section: 1, 'position.row': 1, 'position.column': 1, emergencyPriority: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Add occupiedBy details for better frontend access
    const slotsWithDetails = slots.map(slot => {
      const slotObj = slot.toObject();
      
      // If occupied and has session, create occupiedBy object
      if (slotObj.isOccupied && slotObj.currentSessionId) {
        const session = slotObj.currentSessionId;
        slotObj.occupiedBy = {
          vehicleNumber: session.vehicleNumber,
          userName: session.userName,
          userContact: session.userContact,
          vehicleType: session.vehicleType,
          tokenId: session.tokenId,
          entryTime: session.entryTime,
          duration: session.allottedDuration,
          isEmergency: session.isEmergencyVehicle,
          status: session.status
        };
      }
      
      return slotObj;
    });

    res.status(200).json({
      success: true,
      count: slotsWithDetails.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      slots: slotsWithDetails
    });
  } catch (error) {
    console.error('Get Slots Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete All Slots (FIXED - Delete ALL slots)
exports.deleteAllSlots = async (req, res) => {
  try {
    const occupiedCount = await ParkingSlot.countDocuments({ 
      $or: [{ isOccupied: true }, { currentSessionId: { $ne: null } }] 
    });

    if (occupiedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${occupiedCount} slots have active sessions`
      });
    }

    const result = await ParkingSlot.deleteMany({}); // ✅ Delete ALL slots
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} slots deleted successfully`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Delete All Slots Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Admin Dashboard Stats (FIXED)
// ========================================
// DASHBOARD STATS - FIXED TO MATCH FRONTEND
// ========================================
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Core Stats
    const [
      totalSlots,
      occupiedSlots,
      reservedSlots,
      inactiveSlots,
      emergencySlots,
      activeSessions,
      
      // Today's data
      sessionsToday,
      revenueToday,
      
      // Week data
      sessionsWeek,
      revenueWeek,
      
      // Month data
      sessionsMonth,
      revenueMonth,
      
      // All time
      totalRevenue,
      
      // Payment breakdown
      paymentBreakdown,
      
      // Slot analytics
      slotTypeStats,
      sectionStats,
      vehicleTypeStats
    ] = await Promise.all([
      // Slot counts
      ParkingSlot.countDocuments({}),
      ParkingSlot.countDocuments({ isOccupied: true }),
      ParkingSlot.countDocuments({ isReserved: true }),
      ParkingSlot.countDocuments({ isActive: false }),
      ParkingSlot.countDocuments({ emergencyMode: true, isOccupied: false }),
      ParkingSession.countDocuments({ status: 'active' }),
      
      // Today's sessions and revenue
      ParkingSession.countDocuments({ createdAt: { $gte: today } }),
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Week sessions and revenue
      ParkingSession.countDocuments({ createdAt: { $gte: weekStart } }),
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: weekStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Month sessions and revenue
      ParkingSession.countDocuments({ createdAt: { $gte: monthStart } }),
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: monthStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Total revenue
      ParkingSession.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Payment method breakdown
      ParkingSession.aggregate([
        { $match: { paymentStatus: 'paid', paymentMethod: { $ne: null } } },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            amount: { $sum: '$totalAmount' }
          }
        }
      ]),
      
      // Slot type stats
      ParkingSlot.aggregate([
        {
          $group: {
            _id: '$slotType',
            count: { $sum: 1 },
            occupied: { $sum: { $cond: ['$isOccupied', 1, 0] } }
          }
        }
      ]),
      
      // Section stats
      ParkingSlot.aggregate([
        {
          $group: {
            _id: '$section',
            total: { $sum: 1 },
            occupied: { $sum: { $cond: ['$isOccupied', 1, 0] } },
            available: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isOccupied', false] }, { $eq: ['$isActive', true] }] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Vehicle type stats
      ParkingSlot.aggregate([
        { $unwind: '$vehicleTypes' },
        { $group: { _id: '$vehicleTypes', count: { $sum: 1 } } }
      ])
    ]);

    const availableSlots = totalSlots - occupiedSlots - reservedSlots - inactiveSlots;

    // Process payment breakdown
    const onlinePayment = paymentBreakdown.find(p => p._id === 'Online') || { count: 0, amount: 0 };
    const cashPayment = paymentBreakdown.find(p => p._id === 'Cash') || { count: 0, amount: 0 };
    const walletPayment = paymentBreakdown.find(p => p._id === 'Wallet') || { count: 0, amount: 0 };

    // Process slot type breakdown
    const slotTypeBreakdown = {};
    slotTypeStats.forEach(stat => {
      slotTypeBreakdown[stat._id] = stat.count;
    });

    // Process section breakdown with proper naming
    const processedSections = sectionStats.map(section => ({
      name: section._id,
      total: section.total,
      occupied: section.occupied,
      available: section.available
    }));

    // Get recent sessions
    const recentSessions = await ParkingSession.find()
      .populate('slotId', 'slotNumber section slotType vehicleTypes emergencyMode')
      .sort({ createdAt: -1 })
      .limit(10);

    // Pending payments calculation
    const pendingPayments = await ParkingSession.aggregate([
      { $match: { paymentStatus: 'pending' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const response = {
      success: true,
      stats: {
        // Core metrics
        totalSlots,
        occupiedSlots,
        reservedSlots,
        availableSlots,
        inactiveSlots,
        emergencySlots,
        activeSessions,
        
        // Session counts
        sessionsToday,
        sessionsWeek,
        sessionsMonth,
        
        // Revenue metrics
        revenueToday: revenueToday[0]?.total || 0,
        todayRevenue: revenueToday[0]?.total || 0, // Alias for compatibility
        weekRevenue: revenueWeek[0]?.total || 0,
        monthRevenue: revenueMonth[0]?.total || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingAmount: pendingPayments[0]?.total || 0,
        
        // Payment methods
        onlineCount: onlinePayment.count,
        onlineAmount: onlinePayment.amount,
        cashCount: cashPayment.count,
        cashAmount: cashPayment.amount,
        walletCount: walletPayment.count,
        walletAmount: walletPayment.amount,
        
        // Analytics
        occupancyRate: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
        
        // Breakdowns
        slotTypeStats: slotTypeBreakdown,
        byType: slotTypeBreakdown, // Alias for compatibility
        sectionStats: processedSections,
        vehicleTypeStats
      },
      recentSessions
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========================================
// SLOT ANALYTICS - FIXED STRUCTURE
// ========================================
exports.getSlotAnalytics = async (req, res) => {
  try {
    const [slotTypes, sections, vehicleTypes, gates] = await Promise.all([
      // Slot types
      ParkingSlot.aggregate([
        {
          $group: {
            _id: '$slotType',
            count: { $sum: 1 },
            occupied: { $sum: { $cond: ['$isOccupied', 1, 0] } }
          }
        }
      ]),
      
      // Sections
      ParkingSlot.aggregate([
        {
          $group: {
            _id: '$section',
            total: { $sum: 1 },
            occupied: { $sum: { $cond: ['$isOccupied', 1, 0] } },
            available: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isOccupied', false] }, { $eq: ['$isActive', true] }] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Vehicle types
      ParkingSlot.aggregate([
        { $unwind: '$vehicleTypes' },
        { $group: { _id: '$vehicleTypes', count: { $sum: 1 } } }
      ]),
      
      // Gates
      ParkingSlot.aggregate([
        {
          $group: {
            _id: '$entryGate',
            count: { $sum: 1 },
            occupied: { $sum: { $cond: ['$isOccupied', 1, 0] } }
          }
        }
      ])
    ]);

    // Format slot types
    const byType = {};
    slotTypes.forEach(type => {
      byType[type._id] = type.count;
    });

    // Format sections
    const bySection = sections.map(section => ({
      name: section._id,
      total: section.total,
      occupied: section.occupied,
      available: section.available
    }));

    // Format vehicle types
    const byVehicle = {};
    vehicleTypes.forEach(type => {
      byVehicle[type._id] = type.count;
    });

    res.status(200).json({
      success: true,
      analytics: {
        byType,
        bySection,
        byVehicle,
        gates,
        totalSlots: await ParkingSlot.countDocuments(),
        emergencyReady: await ParkingSlot.countDocuments({ 
          emergencyMode: true, 
          isActive: true, 
          isOccupied: false 
        })
      }
    });
  } catch (error) {
    console.error('Slot Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// SESSION ANALYTICS - COMPLETE DATA
// ========================================
exports.getSessionAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayStats, yesterdayStats, weekStats, monthStats, hourlyStats, statusStats] = await Promise.all([
      // Today
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } }
          }
        }
      ]),
      
      // Yesterday
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: yesterday, $lt: today } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } }
          }
        }
      ]),
      
      // This week
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } }
          }
        }
      ]),
      
      // This month
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } }
          }
        }
      ]),
      
      // Hourly distribution
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Status breakdown
      ParkingSession.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const peakHour = hourlyStats.length > 0
      ? hourlyStats.reduce((max, hour) => (hour.count > max.count ? hour : max))
      : null;

    res.status(200).json({
      success: true,
      today: todayStats,
      yesterday: yesterdayStats[0] || { count: 0, revenue: 0 },
      thisWeek: weekStats[0] || { count: 0, revenue: 0 },
      thisMonth: monthStats[0] || { count: 0, revenue: 0 },
      hourlyDistribution: hourlyStats,
      statusBreakdown: statusStats,
      peakHour
    });
  } catch (error) {
    console.error('Session Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// PAYMENT ANALYTICS - COMPLETE BREAKDOWN
// ========================================
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDate;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [summary, methodStats, dailyRevenue, todayData, weekData, monthData] = await Promise.all([
      // Summary
      ParkingSession.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
            totalPaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
            totalPending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$totalAmount', 0] } },
            totalPenalty: { $sum: '$penaltyCharge' },
            paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
            pendingCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } }
          }
        }
      ]),
      
      // Payment methods
      ParkingSession.aggregate([
        { $match: { paymentStatus: 'paid', paymentMethod: { $ne: null } } },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            amount: { $sum: '$totalAmount' }
          }
        }
      ]),
      
      // Daily revenue (last 30 days)
      ParkingSession.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]),
      
      // Today
      ParkingSession.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // This week
      ParkingSession.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
            paymentStatus: 'paid'
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // This month
      ParkingSession.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
            paymentStatus: 'paid'
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const summaryData = summary[0] || {
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      totalPenalty: 0,
      paidCount: 0,
      pendingCount: 0
    };

    const onlinePayment = methodStats.find(m => m._id === 'Online') || { count: 0, amount: 0 };
    const cashPayment = methodStats.find(m => m._id === 'Cash') || { count: 0, amount: 0 };

    res.status(200).json({
      success: true,
      summary: summaryData,
      todayRevenue: todayData[0]?.total || 0,
      weekRevenue: weekData[0]?.total || 0,
      monthRevenue: monthData[0]?.total || 0,
      totalRevenue: summaryData.totalRevenue,
      pendingAmount: summaryData.totalPending,
      onlineCount: onlinePayment.count,
      onlineAmount: onlinePayment.amount,
      cashCount: cashPayment.count,
      cashAmount: cashPayment.amount,
      paymentMethods: methodStats,
      dailyRevenue
    });
  } catch (error) {
    console.error('Payment Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Generate Parking Slots (ENHANCED with ALL NEW FIELDS)
// @desc    Generate Parking Slots (REAL-WORLD, SCHEMA-ALIGNED)
// IMPROVED CONTROLLER - adminController.js (generateSlots function)

exports.generateSlots = async (req, res) => {
  try {
    const {
      sections, rows, columns,
      slotTypes = {},
      gateDistribution = { Gate1: 40, Gate2: 30, Gate3: 20, Gate4: 10 },
      pricingConfig = {}
    } = req.body;

    if (!sections || !rows || !columns) {
      return res.status(400).json({ success: false, message: 'Sections, rows, and columns required' });
    }

    const sectionArray = sections.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    if (!sectionArray.length) {
      return res.status(400).json({ success: false, message: 'No valid sections' });
    }

    // Calculate total slots per section
    const slotsPerSection = rows * columns;

    // Slot type distribution (only EV and Normal - Emergency is allocated on-demand)
    const typeConfig = {
      EV: Math.floor((Number(slotTypes.ev) || 15) * slotsPerSection / 100), // 15% EV slots with charging
      Emergency: Math.floor(2), // 2 emergency slots per section (always free)
      Disabled: Math.floor(2) // 2 disabled slots per section
    };

    // Vehicle type assignment based on slot type
    const getVehicleTypeForSlot = (slotType) => {
      switch (slotType) {
        case 'EV':
          return ['Car']; // EV slots for electric cars only
        case 'Emergency':
          return ['Emergency']; // Emergency vehicles (Ambulance, Fire Service)
        case 'Disabled':
          return ['Car']; // Disabled parking for cars with accessibility
        case 'Normal':
        default:
          return ['Car']; // All normal slots for regular cars
      }
    };

    // Size based on slot type
    const getSizeForSlotType = (slotType) => {
      switch (slotType) {
        case 'EV': return 'Large'; // Larger for charging equipment
        case 'Emergency': return 'Large'; // Large for ambulances/fire trucks
        case 'Disabled': return 'Large'; // Wide for wheelchair access
        case 'Normal':
        default: return 'Medium'; // Standard car slots
      }
    };

    // Pricing: Emergency vehicles FREE, EV & Normal charged
    const getPricingForSlotType = (slotType) => {
      const basePrices = {
        Emergency: 0, // ✅ FREE for ambulance, fire service
        EV: pricingConfig.ev?.base || 30, // EV parking rate
        Disabled: pricingConfig.disabled?.base || 20,
        Normal: pricingConfig.car?.base || 25 // Regular car parking
      };

      const baseRate = basePrices[slotType] || 25;

      return {
        baseRate,
        peakHourRate: slotType === 'Emergency' ? 0 : Math.round(baseRate * 1.5) // Emergency always 0
      };
    };

    // Gate assignment
    const getGateForSection = (section) => {
      const sectionIndex = sectionArray.indexOf(section);
      const gates = ['Gate1', 'Gate2', 'Gate3', 'Gate4'];
      return gates[sectionIndex % gates.length];
    };

    // Amenities
    const getAmenitiesForSection = (section, slotType) => {
      const amenities = ['CCTV'];
      
      if (['A', 'B'].includes(section)) {
        amenities.push('Covered', 'Security');
      }
      
      if (slotType === 'EV') {
        amenities.push('ChargingStation'); // ✅ Near charging points
      }
      
      if (slotType === 'Emergency') {
        amenities.push('QuickAccess', 'NearEntrance'); // ✅ Immediate access
      }
      
      return [...new Set(amenities)];
    };

    const slots = [];

    for (const section of sectionArray) {
      let counters = { EV: 0, Emergency: 0, Disabled: 0, Normal: 0 };
      const primaryGate = getGateForSection(section);

      // ✅ SMART ALLOCATION: Emergency & EV slots at front rows (near entrance/charging)
      for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= columns; col++) {
          const slotNumber = `${section}${row}${col.toString().padStart(2, '0')}`;
          const exists = await ParkingSlot.findOne({ slotNumber });
          if (exists) continue;

          let slotType = 'Normal';
          
          // ✅ ROW 1: Emergency & Disabled slots (nearest to entrance)
          if (row === 1) {
            if (col <= typeConfig.Emergency && counters.Emergency < typeConfig.Emergency) {
              slotType = 'Emergency';
              counters.Emergency++;
            } else if (col <= typeConfig.Emergency + typeConfig.Disabled && counters.Disabled < typeConfig.Disabled) {
              slotType = 'Disabled';
              counters.Disabled++;
            } else if (counters.EV < typeConfig.EV) {
              slotType = 'EV';
              counters.EV++;
            }
          }
          // ✅ ROW 2: EV slots (near charging stations)
          else if (row === 2 && counters.EV < typeConfig.EV) {
            slotType = 'EV';
            counters.EV++;
          }
          // ✅ Fill remaining EV quota in middle rows
          else if (counters.EV < typeConfig.EV) {
            slotType = 'EV';
            counters.EV++;
          }

          const vehicleTypes = getVehicleTypeForSlot(slotType);
          const size = getSizeForSlotType(slotType);
          const pricing = getPricingForSlotType(slotType);
          const amenities = getAmenitiesForSection(section, slotType);

          const newSlot = {
            slotNumber,
            slotType,
            section,
            position: { row, column: col },
            size,
            vehicleTypes, // ✅ Only Car, EV, Emergency
            entryGate: slotType === 'Emergency' ? 'Emergency' : primaryGate, // ✅ Dedicated emergency gate
            exitGate: primaryGate,
            isOccupied: false,
            isActive: true,
            isReserved: false,
            sensorStatus: Math.random() > 0.95 ? 'faulty' : 'online',
            pricing,
            dynamicPricing: {
              weekendMultiplier: slotType === 'Emergency' ? 1 : 1.5, // Emergency no multiplier
              holidayMultiplier: slotType === 'Emergency' ? 1 : 2.0,
              peakHours: { start: '18:00', end: '22:00' }
            },
            amenities,
            emergencyMode: slotType === 'Emergency', // ✅ Emergency slots always in emergency mode
            emergencyPriority: slotType === 'Emergency' ? 3 : 0
          };

          // ✅ EV slots get charging stations
          if (slotType === 'EV') {
            newSlot.chargingStation = {
              available: true,
              powerOutput: '7.4kW',
              chargingStatus: 'idle',
              costPerHour: pricingConfig.ev?.chargerCost || 35
            };
          }

          slots.push(newSlot);
          counters.Normal++;
        }
      }
    }

    if (!slots.length) {
      return res.status(400).json({ success: false, message: 'All slots already exist' });
    }

    await ParkingSlot.insertMany(slots);

    // Breakdown
    const breakdown = {
      sections: sectionArray.length,
      totalSlots: slots.length,
      byType: slots.reduce((acc, slot) => {
        acc[slot.slotType] = (acc[slot.slotType] || 0) + 1;
        return acc;
      }, {}),
      byVehicle: slots.reduce((acc, slot) => {
        slot.vehicleTypes.forEach((type) => {
          acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
      }, {}),
      bySection: slots.reduce((acc, slot) => {
        acc[slot.section] = (acc[slot.section] || 0) + 1;
        return acc;
      }, {}),
      evWithChargers: slots.filter(s => s.slotType === 'EV' && s.chargingStation?.available).length,
      emergencySlots: slots.filter(s => s.slotType === 'Emergency').length,
      disabledAccess: slots.filter(s => s.slotType === 'Disabled').length
    };

    res.status(201).json({
      success: true,
      message: `✅ ${slots.length} parking slots generated (Car, EV, Emergency)`,
      count: slots.length,
      breakdown
    });
  } catch (error) {
    console.error('Generate Slots Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Bulk Update Slots (NEW SUPERPOWER)
exports.bulkUpdateSlots = async (req, res) => {
  try {
    const { slotIds, updates } = req.body;

    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No slot IDs provided' });
    }

    // Prevent dangerous bulk operations
    const dangerousFields = ['slotNumber', '_id'];
    const hasDangerousUpdate = Object.keys(updates).some(key => 
      dangerousFields.includes(key) || key.includes('__')
    );

    if (hasDangerousUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'Dangerous fields cannot be updated in bulk' 
      });
    }

    const result = await ParkingSlot.updateMany(
      { _id: { $in: slotIds } },
      { $set: updates }
    );

    // Refresh affected slots
    const updatedSlots = await ParkingSlot.find({ _id: { $in: slotIds } });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} slots updated successfully`,
      count: result.modifiedCount,
      updatedSlots
    });
  } catch (error) {
    console.error('Bulk Update Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Emergency Override (CRITICAL)
exports.setEmergencySlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority = 3 } = req.body;

    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Emergency override - clears everything
    slot.emergencyMode = true;
    slot.emergencyPriority = Math.max(0, Math.min(3, priority));
    slot.isOccupied = false;
    slot.isReserved = false;
    slot.reservedFor = null;
    slot.currentSessionId = null;
    slot.sensorStatus = 'online'; // Force online for emergency

    await slot.save();

    res.status(200).json({
      success: true,
      message: `🚨 Slot ${slot.slotNumber} set to EMERGENCY PRIORITY ${priority}`,
      slot
    });
  } catch (error) {
    console.error('Emergency Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear Emergency Mode
exports.clearEmergencySlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    slot.emergencyMode = false;
    slot.emergencyPriority = 0;
    await slot.save();

    res.status(200).json({
      success: true,
      message: `Slot ${slot.slotNumber} cleared from emergency mode`,
      slot
    });
  } catch (error) {
    console.error('Clear Emergency Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create Single Slot (ENHANCED)
exports.createSlot = async (req, res) => {
  try {
    const slotExists = await ParkingSlot.findOne({ slotNumber: req.body.slotNumber });
    if (slotExists) {
      return res.status(400).json({ success: false, message: 'Slot number already exists' });
    }

    const slot = await ParkingSlot.create({
      ...req.body,
      vehicleTypes: req.body.vehicleTypes || ['Car'],
      entryGate: req.body.entryGate || 'Gate1',
      exitGate: req.body.exitGate || 'Gate1',
      sensorStatus: req.body.sensorStatus || 'online'
    });

    res.status(201).json({ success: true, message: 'Slot created successfully', slot });
  } catch (error) {
    console.error('Create Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update Slot (FULL SUPPORT)
exports.updateSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true, runValidators: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    res.status(200).json({ success: true, message: 'Slot updated successfully', slot });
  } catch (error) {
    console.error('Update Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle Slot Status (SAFER)
exports.toggleSlotStatus = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (slot.isOccupied) {
      return res.status(400).json({ success: false, message: 'Cannot toggle occupied slot' });
    }

    slot.isActive = !slot.isActive;
    await slot.save();

    res.status(200).json({
      success: true,
      message: `Slot ${slot.isActive ? 'activated' : 'deactivated'} successfully`,
      slot
    });
  } catch (error) {
    console.error('Toggle Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete Slot (SAFER)
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (slot.isOccupied || slot.currentSessionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete slot with active session' 
      });
    }

    await ParkingSlot.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Delete Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get All Sessions (ENHANCED)
exports.getAllSessions = async (req, res) => {
  try {
    const { status, vehicleType, gate } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (gate) filter.entryGate = gate;

    const sessions = await ParkingSession.find(filter)
      .populate('userId', 'name email phone vehicleNumber')
      .populate({
        path: 'slotId',
        select: 'slotNumber section slotType vehicleTypes emergencyMode entryGate sensorStatus'
      })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    console.error('Get Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Gate Status (NEW)
exports.getGateStatus = async (req, res) => {
  try {
    const gateStats = await ParkingSlot.aggregate([
      {
        $group: {
          _id: '$entryGate',
          totalSlots: { $sum: 1 },
          occupiedSlots: { $sum: { $cond: ['$isOccupied', 1, 0] } },
          emergencySlots: { $sum: { $cond: ['$emergencyMode', 1, 0] } },
          avgOccupancy: { $avg: { $cond: ['$isOccupied', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      gates: gateStats,
      summary: {
        totalGates: gateStats.length,
        avgOccupancy: gateStats.reduce((sum, gate) => sum + (gate.avgOccupancy || 0), 0) / gateStats.length
      }
    });
  } catch (error) {
    console.error('Gate Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// 🎫 ADMIN SESSION MANAGEMENT (PRODUCTION-READY)
// ========================================

// @desc    Get All Sessions with Advanced Filters
exports.getAllSessionsDetailed = async (req, res) => {
  try {
    const {
      status,
      vehicleType,
      paymentStatus,
      emergency,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};
    
    if (status) filter.status = status;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (emergency === 'true') filter.isEmergencyVehicle = true;
    if (emergency === 'false') filter.isEmergencyVehicle = false;

    // Date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Search
    if (search) {
      filter.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userContact: { $regex: search, $options: 'i' } },
        { tokenId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await ParkingSession.countDocuments(filter);

    const sessions = await ParkingSession.find(filter)
      .populate({
        path: 'slotId',
        select: 'slotNumber section slotType entryGate exitGate vehicleTypes pricing emergencyMode'
      })
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    // Summary stats
    const summaryStats = await ParkingSession.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$totalAmount', 0] }
          },
          emergencyCount: { $sum: { $cond: ['$isEmergencyVehicle', 1, 0] } },
          totalPenalty: { $sum: '$penaltyCharge' }
        }
      }
    ]);

    const summary = summaryStats[0] || {
      totalSessions: 0,
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      emergencyCount: 0,
      totalPenalty: 0
    };

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      summary,
      sessions
    });
  } catch (error) {
    console.error('Get Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Active Sessions (Live)
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await ParkingSession.find({ status: 'active' })
      .populate({
        path: 'slotId',
        select: 'slotNumber section slotType entryGate exitGate emergencyMode'
      })
      .sort({ entryTime: -1 });

    const now = new Date();
    const sessionsWithLiveData = sessions.map(session => {
      const entryTime = new Date(session.entryTime);
      const elapsedMinutes = Math.floor((now - entryTime) / 60000);
      const remainingMinutes = Math.max(0, session.allottedDuration - elapsedMinutes);
      const isOvertime = elapsedMinutes > session.allottedDuration;

      return {
        ...session.toObject(),
        liveData: {
          elapsedMinutes,
          remainingMinutes,
          isOvertime,
          overtimeMinutes: isOvertime ? elapsedMinutes - session.allottedDuration : 0
        }
      };
    });

    res.status(200).json({
      success: true,
      count: sessionsWithLiveData.length,
      sessions: sessionsWithLiveData
    });
  } catch (error) {
    console.error('Get Active Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Single Session Details
exports.getSessionDetails = async (req, res) => {
  try {
    const session = await ParkingSession.findById(req.params.id)
      .populate({
        path: 'slotId',
        select: 'slotNumber section slotType entryGate exitGate vehicleTypes pricing amenities size'
      });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const now = new Date();
    const entryTime = new Date(session.entryTime);
    const elapsedMinutes = Math.floor((now - entryTime) / 60000);
    const remainingMinutes = Math.max(0, session.allottedDuration - elapsedMinutes);
    const isOvertime = elapsedMinutes > session.allottedDuration;

    res.status(200).json({
      success: true,
      session,
      liveStats: {
        elapsedMinutes,
        remainingMinutes,
        isOvertime,
        currentTime: now,
        entryTime: session.entryTime,
        exitTime: session.exitTime
      }
    });
  } catch (error) {
    console.error('Get Session Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Admin Force Complete Session (STRICT VALIDATION)
exports.forceCompleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, paymentMethod } = req.body;

    const session = await ParkingSession.findById(id).populate('slotId');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // ✅ VALIDATION: Only active sessions can be completed
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete ${session.status} session. Only active sessions can be completed.`
      });
    }

    // ✅ VALIDATION: Check if already has exit time
    if (session.exitTime) {
      return res.status(400).json({
        success: false,
        message: 'Session already has an exit time'
      });
    }

    const exitTime = new Date();
    const entryTime = new Date(session.entryTime);
    const actualDuration = Math.floor((exitTime - entryTime) / 60000);

    // ✅ Calculate penalty ONLY if overtime and NOT emergency vehicle
    let penaltyCharge = 0;
    if (actualDuration > session.allottedDuration && !session.isEmergencyVehicle) {
      const overtimeMinutes = actualDuration - session.allottedDuration;
      const overtimeHours = overtimeMinutes / 60;
      penaltyCharge = Math.round(session.baseRate * overtimeHours * 1.5);
    }

    const finalAmount = session.isEmergencyVehicle ? 0 : session.totalAmount + penaltyCharge;

    // ✅ VALIDATION: Payment method required if amount > 0
    if (finalAmount > 0 && !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method required for paid sessions'
      });
    }

    // Update session
    session.exitTime = exitTime;
    session.actualDuration = actualDuration;
    session.penaltyCharge = penaltyCharge;
    session.totalAmount = finalAmount;
    session.paymentStatus = finalAmount === 0 ? 'paid' : (paymentMethod ? 'paid' : 'pending');
    session.paymentMethod = paymentMethod || null;
    session.status = 'completed';
    await session.save();

    // Free up slot
    const slot = await ParkingSlot.findById(session.slotId);
    if (slot) {
      slot.isOccupied = false;
      slot.currentSessionId = null;
      slot.occupancyHistory.push({
        date: session.entryTime,
        duration: actualDuration,
        vehicleType: session.vehicleType
      });
      await slot.save();
    }

    res.status(200).json({
      success: true,
      message: 'Session force completed successfully',
      session
    });
  } catch (error) {
    console.error('Force Complete Session Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Admin Update Payment Status (STRICT VALIDATION)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    // ✅ VALIDATION: Check valid payment status
    if (!['paid', 'pending', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be paid, pending, or failed'
      });
    }

    const session = await ParkingSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // ✅ VALIDATION: Cannot update payment of cancelled sessions
    if (session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update payment status of cancelled session'
      });
    }

    // ✅ VALIDATION: Emergency vehicles are always free
    if (session.isEmergencyVehicle && paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Emergency vehicles are always marked as paid (FREE)'
      });
    }

    // ✅ VALIDATION: Payment method required when marking as paid
    if (paymentStatus === 'paid' && !paymentMethod && !session.isEmergencyVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Payment method required when marking as paid'
      });
    }

    session.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid' && paymentMethod) {
      session.paymentMethod = paymentMethod;
    }
    await session.save();

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      session
    });
  } catch (error) {
    console.error('Update Payment Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Sessions by Vehicle Number
exports.getSessionsByVehicle = async (req, res) => {
  try {
    const { vehicleNumber } = req.params;

    const sessions = await ParkingSession.find({
      vehicleNumber: { $regex: vehicleNumber, $options: 'i' }
    })
      .populate('slotId', 'slotNumber section slotType')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: sessions.length,
      vehicleNumber,
      sessions
    });
  } catch (error) {
    console.error('Get Sessions by Vehicle Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk Delete Sessions (STRICT VALIDATION)
exports.bulkDeleteSessions = async (req, res) => {
  try {
    const { olderThan } = req.query;

    // ✅ VALIDATION: Minimum 30 days
    if (!olderThan || olderThan < 30) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete sessions older than 30 days'
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(olderThan));

    // ✅ VALIDATION: Only delete completed or cancelled sessions
    const result = await ParkingSession.deleteMany({
      status: { $in: ['completed', 'cancelled'] },
      createdAt: { $lt: cutoffDate }
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} old sessions deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk Delete Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
