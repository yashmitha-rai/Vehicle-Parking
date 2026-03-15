const ParkingSlot = require('../models/ParkingSlot');
const ParkingSession = require('../models/ParkingSession');
const crypto = require('crypto');

// @desc    Get Available Slots for Users (Public)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { section, vehicleType, gate, slotType } = req.query;

    // Build filter for available slots only
    let filter = {
      isActive: true,
      isOccupied: false,
      isReserved: false,
      sensorStatus: 'online' // Only show slots with working sensors
    };

    // Apply filters
    if (section) filter.section = section;
    if (gate) filter.entryGate = gate;
    if (slotType) filter.slotType = slotType;
    if (vehicleType) filter.vehicleTypes = vehicleType;

    const slots = await ParkingSlot.find(filter)
      .select('-notes -lastMaintenance -occupancyHistory') // Hide internal data
      .sort({ section: 1, 'position.row': 1, 'position.column': 1 });

    // Also fetch ALL slots (including occupied) for the UI to show parking layout
    const allSlots = await ParkingSlot.find({ isActive: true })
      .select('-notes -lastMaintenance -occupancyHistory')
      .sort({ section: 1, 'position.row': 1, 'position.column': 1 });

    // Group by section for better UI display
    const sections = {};
    slots.forEach(slot => {
      const sectionKey = slot.section || 'Unknown';
      if (!sections[sectionKey]) {
        sections[sectionKey] = {
          name: sectionKey,
          gate: slot.entryGate,
          slots: [],
          available: 0
        };
      }
      sections[sectionKey].slots.push(slot);
      sections[sectionKey].available++;
    });

    res.status(200).json({
      success: true,
      totalAvailable: slots.length,
      sections: Object.values(sections),
      slots,
      allSlots
    });
  } catch (error) {
    console.error('Get Available Slots Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Slot Availability Summary (Real-time stats)
exports.getSlotSummary = async (req, res) => {
  try {
    const [totalSlots, availableSlots, evSlots, emergencySlots, sectionStats] = await Promise.all([
      ParkingSlot.countDocuments({ isActive: true }),
      ParkingSlot.countDocuments({ isActive: true, isOccupied: false, isReserved: false, sensorStatus: 'online' }),
      ParkingSlot.countDocuments({ slotType: 'EV', isActive: true, isOccupied: false }),
      ParkingSlot.countDocuments({ slotType: 'Emergency', isActive: true, isOccupied: false }),
      ParkingSlot.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$section',
            total: { $sum: 1 },
            available: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isOccupied', false] }, { $eq: ['$sensorStatus', 'online'] }] },
                  1,
                  0
                ]
              }
            },
            gate: { $first: '$entryGate' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalSlots,
        availableSlots,
        occupiedSlots: totalSlots - availableSlots,
        evSlots,
        emergencySlots,
        occupancyRate: totalSlots > 0 ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100) : 0
      },
      sections: sectionStats
    });
  } catch (error) {
    console.error('Get Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Single Slot Details
exports.getSlotDetails = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id)
      .select('-notes -lastMaintenance -occupancyHistory');

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Check if slot is truly available
    const isAvailable = slot.isActive && !slot.isOccupied && !slot.isReserved && slot.sensorStatus === 'online';

    res.status(200).json({
      success: true,
      slot,
      isAvailable
    });
  } catch (error) {
    console.error('Get Slot Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Book a Parking Slot (Create Session)
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, userName, userContact, userEmail, vehicleNumber, vehicleType, allottedDuration } = req.body;

    // Validation
    if (!slotId || !userName || !userContact || !userEmail || !vehicleNumber || !vehicleType || !allottedDuration) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Ensure phone is 10 digit number
    if (!/^[0-9]{10}$/.test(userContact)) {
      return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
    }

    // Find slot
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Check availability
    if (!slot.isActive || slot.isOccupied || slot.isReserved) {
      return res.status(400).json({ success: false, message: 'Slot is not available' });
    }

    if (slot.sensorStatus !== 'online') {
      return res.status(400).json({ success: false, message: 'Slot sensor is not working' });
    }

    // Check vehicle type compatibility
    // if (!slot.vehicleTypes.includes(vehicleType) && vehicleType !== 'Emergency') {
    //   return res.status(400).json({ success: false, message: 'Vehicle type not compatible with this slot' });
    // }

    // Generate unique token
    const tokenId = `TKN${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Determine if emergency vehicle (FREE parking)
    const isEmergencyVehicle = vehicleType === 'Emergency' || slot.slotType === 'Emergency';
    
    // Calculate pricing
    const baseRate = isEmergencyVehicle ? 0 : slot.pricing.baseRate;
    const hours = allottedDuration / 60;
    const totalAmount = Math.round(baseRate * hours);

    // Create parking session
    const session = await ParkingSession.create({
      tokenId,
      userName,
      userContact,
      userEmail,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      slotId,
      slotNumber: slot.slotNumber, // ✅ Saved directly for redundancy
      section: slot.section,       // ✅ Saved directly for redundancy
      allottedDuration,
      baseRate,
      totalAmount,
      isEmergencyVehicle,
      paymentStatus: isEmergencyVehicle ? 'paid' : 'pending',
      status: 'active'
    });

    // Update slot
    slot.isOccupied = true;
    slot.currentSessionId = session._id;
    slot.lastOccupied = new Date();
    await slot.save();

    // Populate slot details in response
    const populatedSession = await ParkingSession.findById(session._id)
      .populate('slotId', 'slotNumber section slotType entryGate exitGate pricing amenities');

    res.status(201).json({
      success: true,
      message: isEmergencyVehicle ? '🚨 Emergency slot booked (FREE)' : '✅ Slot booked successfully',
      session: populatedSession,
      tokenId
    });
  } catch (error) {
    console.error('Book Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get Session by Token ID (For users to check their booking)
exports.getSessionByToken = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const session = await ParkingSession.findOne({ tokenId })
      .populate('slotId', 'slotNumber section slotType entryGate exitGate pricing amenities chargingStation');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Calculate time remaining
    const now = new Date();
    const entryTime = new Date(session.entryTime);
    const elapsedMinutes = Math.floor((now - entryTime) / 60000);
    const remainingMinutes = Math.max(0, session.allottedDuration - elapsedMinutes);

    res.status(200).json({
      success: true,
      session,
      timeInfo: {
        elapsedMinutes,
        remainingMinutes,
        isOvertime: elapsedMinutes > session.allottedDuration,
        entryTime: session.entryTime
      }
    });
  } catch (error) {
    console.error('Get Session Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Extend Parking Session
exports.extendSession = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { additionalMinutes } = req.body;

    if (!additionalMinutes || additionalMinutes < 15) {
      return res.status(400).json({ success: false, message: 'Minimum 15 minutes extension required' });
    }

    const session = await ParkingSession.findOne({ tokenId, status: 'active' })
      .populate('slotId');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    // Calculate additional charges
    const hours = additionalMinutes / 60;
    const additionalCharge = session.isEmergencyVehicle ? 0 : Math.round(session.baseRate * hours);

    // Update session
    session.allottedDuration += additionalMinutes;
    session.totalAmount += additionalCharge;
    await session.save();

    res.status(200).json({
      success: true,
      message: `Session extended by ${additionalMinutes} minutes`,
      session,
      additionalCharge,
      newTotalAmount: session.totalAmount
    });
  } catch (error) {
    console.error('Extend Session Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Complete Parking Session (Exit)
exports.completeSession = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { paymentMethod } = req.body;

    const session = await ParkingSession.findOne({ tokenId, status: 'active' })
      .populate('slotId');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const exitTime = new Date();
    const actualDuration = Math.floor((exitTime - session.entryTime) / 60000);

    // Calculate penalty for overtime
    let penaltyCharge = 0;
    if (actualDuration > session.allottedDuration && !session.isEmergencyVehicle) {
      const overtimeMinutes = actualDuration - session.allottedDuration;
      const overtimeHours = overtimeMinutes / 60;
      penaltyCharge = Math.round(session.baseRate * overtimeHours * 1.5); // 50% penalty
    }

    const finalAmount = session.isEmergencyVehicle ? 0 : session.totalAmount + penaltyCharge;

    // Update session
    session.exitTime = exitTime;
    session.actualDuration = actualDuration;
    session.penaltyCharge = penaltyCharge;
    session.totalAmount = finalAmount;
    session.paymentStatus = session.isEmergencyVehicle ? 'paid' : (paymentMethod ? 'paid' : 'pending');
    session.paymentMethod = paymentMethod || null;
    session.status = 'completed';
    await session.save();

    // Free up the slot
    const slot = await ParkingSlot.findById(session.slotId);
    if (slot) {
      slot.isOccupied = false;
      slot.currentSessionId = null;
      
      // Add to occupancy history
      slot.occupancyHistory.push({
        date: session.entryTime,
        duration: actualDuration,
        vehicleType: session.vehicleType
      });
      
      await slot.save();
    }

    res.status(200).json({
      success: true,
      message: session.isEmergencyVehicle ? '🚨 Emergency session completed (FREE)' : '✅ Session completed successfully',
      session,
      billing: {
        baseAmount: session.totalAmount - penaltyCharge,
        penaltyCharge,
        finalAmount,
        actualDuration,
        overtimeMinutes: Math.max(0, actualDuration - session.allottedDuration)
      }
    });
  } catch (error) {
    console.error('Complete Session Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Cancel Parking Session (Before entry)
exports.cancelSession = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const session = await ParkingSession.findOne({ tokenId, status: 'active' })
      .populate('slotId');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    // Check if user has entered (more than 5 minutes since booking)
    const now = new Date();
    const bookingTime = new Date(session.entryTime);
    const minutesSinceBooking = Math.floor((now - bookingTime) / 60000);

    if (minutesSinceBooking > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel after 5 minutes. Please complete session for exit.' 
      });
    }

    // Update session
    session.status = 'cancelled';
    session.exitTime = now;
    await session.save();

    // Free up the slot
    const slot = await ParkingSlot.findById(session.slotId);
    if (slot) {
      slot.isOccupied = false;
      slot.currentSessionId = null;
      await slot.save();
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      session
    });
  } catch (error) {
    console.error('Cancel Session Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Pricing Information
exports.getPricingInfo = async (req, res) => {
  try {
    const pricingInfo = {
      normal: {
        baseRate: 25,
        peakHourRate: 38,
        description: 'Regular car parking'
      },
      ev: {
        baseRate: 30,
        chargingCost: 35,
        description: 'Electric vehicle with charging'
      },
      emergency: {
        baseRate: 0,
        description: 'FREE for emergency vehicles (Ambulance, Fire Service)'
      },
      disabled: {
        baseRate: 20,
        description: 'Accessible parking'
      },
      penalties: {
        overtimeMultiplier: 1.5,
        description: '50% extra charge for overtime'
      }
    };

    res.status(200).json({
      success: true,
      pricing: pricingInfo
    });
  } catch (error) {
    console.error('Get Pricing Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
