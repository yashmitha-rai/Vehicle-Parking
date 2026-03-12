const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  userName: {
    type: String,
    required: true
  },
  userContact: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['EV', 'Normal', 'Car'],
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date,
    default: null
  },
  allottedDuration: {
    type: Number, // in minutes
    required: true
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },
  baseRate: {
    type: Number,
    default: 20 // ₹20 per hour
  },
  penaltyCharge: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'Wallet'],
    default: null
  },
  isEmergencyVehicle: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);
