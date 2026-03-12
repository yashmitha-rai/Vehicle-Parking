const express = require('express');
const router = express.Router();
const contactController = require('../Controller/ContactController');

// Public route
router.post('/contact', contactController.submitContactForm);

// Admin routes
router.get('/contacts', contactController.getAllContacts);
router.get('/contacts/stats', contactController.getContactStats);
router.get('/contacts/:id', contactController.getContactById);
router.patch('/contacts/:id', contactController.updateContactStatus);
router.delete('/contacts/:id', contactController.deleteContact);

module.exports = router;
