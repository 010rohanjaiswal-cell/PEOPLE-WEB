const express = require('express');
const router = express.Router();
const axios = require('axios');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes
router.get('/freelancer-verifications', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.getFreelancerVerifications);
router.post('/approve-freelancer/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.approveFreelancer);
router.post('/reject-freelancer/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.rejectFreelancer);
router.get('/withdrawal-requests', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.getWithdrawalRequests);
router.post('/approve-withdrawal/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.approveWithdrawal);
router.post('/reject-withdrawal/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.rejectWithdrawal);

// User search and profile routes
router.get('/search-users', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.searchUsers);
router.get('/user-profile/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.getUserProfile);

// Jobs management
router.get('/open-jobs', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.getOpenJobs);
router.delete('/jobs/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.deleteJobByAdmin);
router.post('/jobs/:id/unassign-freelancer', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.unassignFreelancerByAdmin);

// Metrics proxy routes (calls People backend with X-Admin-API-Key)
function requireEnv(name) {
  const v = process.env[name];
  return v && String(v).trim() ? String(v).trim() : '';
}

async function proxyPeopleMetrics(req, res, path) {
  const base = requireEnv('PEOPLE_API_BASE_URL').replace(/\/+$/, '');
  const key = requireEnv('ADMIN_PANEL_API_KEY');

  if (!base || !key) {
    return res.status(500).json({
      success: false,
      message:
        'Missing backend env. Please set PEOPLE_API_BASE_URL and ADMIN_PANEL_API_KEY on this admin backend.',
    });
  }

  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  try {
    const resp = await axios.get(url, {
      headers: { 'X-Admin-API-Key': key },
      timeout: 20000,
      validateStatus: () => true,
    });
    return res.status(resp.status).json(resp.data);
  } catch (e) {
    return res.status(502).json({
      success: false,
      message: 'Failed to reach People backend',
      error: e && e.message ? e.message : String(e),
    });
  }
}

router.get(
  '/metrics/summary',
  authMiddleware.verifyToken,
  authMiddleware.verifyAdmin,
  async (req, res) => proxyPeopleMetrics(req, res, '/api/admin/metrics/summary')
);

router.get(
  '/red-ratings',
  authMiddleware.verifyToken,
  authMiddleware.verifyAdmin,
  async (req, res) => proxyPeopleMetrics(req, res, '/api/admin/metrics/red-ratings')
);

module.exports = router;
