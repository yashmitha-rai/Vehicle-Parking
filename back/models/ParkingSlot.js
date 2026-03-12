const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  slotType: {
    type: String,
  },
  section: {
    type: String,
    required: true,
  },
  position: {
    row: { type: Number, required: true },
    column: { type: Number, required: true }
  },
  size: {
    type: String,
    enum: ['Small', 'Medium', 'Large'],
    default: 'Medium'
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isReserved: {
    type: Boolean,
    default: false
  },
  reservedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSession',
    default: null
  },
  chargingStation: {
    available: {
      type: Boolean,
      default: false
    },
    powerOutput: {
      type: String,
      default: '0kW'
    },
    chargingStatus: {
      type: String,
      enum: ['idle', 'charging', 'maintenance'],
      default: 'idle'
    },
    costPerHour: {
      type: Number,
      default: 0
    }
  },
  pricing: {
    baseRate: {
      type: Number,
      default: 20
    },
    peakHourRate: {
      type: Number,
      default: 30
    }
  },
  amenities: [{
    type: String,
  }],
  lastMaintenance: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  // NEW VEHICLE TYPES & EMERGENCY
  vehicleTypes: [{
    type: String,
    enum: ['Car', 'SUV', 'Bus', 'Truck', 'TwoWheeler', 'ThreeWheeler', 'Emergency'],
    default: ['Car']
  }],
  
  // EMERGENCY OVERRIDE
  emergencyMode: {
    type: Boolean,
    default: false
  },
  emergencyPriority: {
    type: Number,
    enum: [0, 1, 2, 3], // 0=Normal, 3=Critical
    default: 0
  },
  
  // GATE CONTROL
  entryGate: {
    type: String,
    enum: ['Gate1', 'Gate2', 'Gate3', 'Gate4', 'VIP', 'Emergency'],
    default: 'Gate1'
  },
  exitGate: {
    type: String,
    enum: ['Gate1', 'Gate2', 'Gate3', 'Gate4', 'VIP', 'Emergency'],
    default: 'Gate1'
  },
  
  // ENHANCED PRICING
  dynamicPricing: {
    weekendMultiplier: { type: Number, default: 1.5 },
    holidayMultiplier: { type: Number, default: 2.0 },
    peakHours: { start: String, end: String }
  },
  
  // MAINTENANCE & SENSORS
  sensorStatus: {
    type: String,
    enum: ['online', 'offline', 'faulty', 'maintenance'],
    default: 'online'
  },
  lastOccupied: Date,
  occupancyHistory: [{
    date: Date,
    duration: Number, // minutes
    vehicleType: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
