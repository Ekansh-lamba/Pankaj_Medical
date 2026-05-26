const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { uploadPrescription } = require('../middleware/upload.middleware');
const {
  uploadPrescriptionImage,
  getMyPrescriptions,
  getPendingPrescriptions,
  approvePrescription,
  rejectPrescription,
  requestPrescriptionReupload
} = require('../controllers/prescription.controller');

// All routes require authentication
router.use(protect);

// Customer endpoints
router.post('/upload', uploadPrescription.single('prescription'), uploadPrescriptionImage);
router.get('/my-prescriptions', getMyPrescriptions);

// Staff/Admin endpoints
router.get('/pending', requireRole(['staff', 'admin']), getPendingPrescriptions);
router.put('/:id/approve', requireRole(['staff', 'admin']), approvePrescription);
router.put('/:id/reject', requireRole(['staff', 'admin']), rejectPrescription);
router.put('/:id/request-reupload', requireRole(['staff', 'admin']), requestPrescriptionReupload);

module.exports = router;
