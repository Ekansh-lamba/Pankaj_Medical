const express = require('express');
const router = express.Router();

// Prescription routes skeleton (Full prescription implementation deferred to Phase 3)
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Prescriptions list placeholder' });
});

module.exports = router;
