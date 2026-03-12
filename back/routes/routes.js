const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  userLogin, 
  register, 
  getMe 
} = require('../Controller/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/admin/login', adminLogin);
router.post('/login', userLogin);
router.post('/register', register);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
