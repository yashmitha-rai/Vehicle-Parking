const express = require('express');
const router = express.Router();
const {
  // Dashboard & Stats
  getDashboardStats,
  getSlotAnalytics,
  getGateStatus,
  
  // Slot Management
  getAllSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  generateSlots,
  toggleSlotStatus,
  deleteAllSlots,
  bulkUpdateSlots,
  
  // Emergency Control
  setEmergencySlot,
  clearEmergencySlot,
  
  // Sessions
  getAllSessions,
    getAllSessionsDetailed,
    getActiveSessions,
    getSessionAnalytics,
    getPaymentAnalytics,
    getSessionsByVehicle,
    getSessionDetails,
    forceCompleteSession,
    updatePaymentStatus,
    bulkDeleteSessions,
} = require('../Controller/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// 🔐 All routes require authentication & admin privileges
router.use(protect);
router.use(adminOnly);

// 📊 Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/slots/analytics', getSlotAnalytics);
router.get('/gates/status', getGateStatus);

// 🅿️ Slot Management (CRUD + Bulk)
router.route('/slots')
  .get(getAllSlots)
  .post(createSlot);

router.post('/slots/generate', generateSlots);
router.patch('/slots/bulk', bulkUpdateSlots);
router.delete('/slots/all', deleteAllSlots);

router.route('/slots/:id')
  .put(updateSlot)
  .delete(deleteSlot);

router.patch('/slots/:id/toggle', toggleSlotStatus);

// 🚨 Emergency Control
router.patch('/slots/:id/emergency', setEmergencySlot);
router.patch('/slots/:id/emergency/clear', clearEmergencySlot);

// 📋 Sessions
router.get('/sessions', getAllSessions);

// Session Management Routes (ADD THESE)
router.get('/sessions/detailed', protect, adminOnly, getAllSessionsDetailed);
router.get('/sessions/active', protect, adminOnly, getActiveSessions);
router.get('/sessions/analytics', protect, adminOnly, getSessionAnalytics);
router.get('/sessions/payments', protect, adminOnly, getPaymentAnalytics);
router.get('/sessions/vehicle/:vehicleNumber', protect, adminOnly, getSessionsByVehicle);
router.get('/sessions/:id', protect, adminOnly, getSessionDetails);
router.patch('/sessions/:id/force-complete', protect, adminOnly, forceCompleteSession);
router.patch('/sessions/:id/payment', protect, adminOnly, updatePaymentStatus);
router.delete('/sessions/bulk-delete', protect, adminOnly, bulkDeleteSessions);

module.exports = router;
