const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  getSlotSummary,
  getSlotDetails,
  bookSlot,
  getSessionByToken,
  extendSession,
  completeSession,
  cancelSession,
  getPricingInfo
} = require('../Controller/UserController');

// 🌐 All routes are PUBLIC (no authentication required)

// Slot Information
router.get('/slots/available', getAvailableSlots);
router.get('/slots/summary', getSlotSummary);
router.get('/slots/:id', getSlotDetails);
router.get('/pricing', getPricingInfo);

// Booking Management
router.post('/book', bookSlot);
router.get('/session/:tokenId', getSessionByToken);
router.patch('/session/:tokenId/extend', extendSession);
router.patch('/session/:tokenId/complete', completeSession);
router.patch('/session/:tokenId/cancel', cancelSession);

module.exports = router;
