const express = require('express');
const router = express.Router();

router.use('/szco-vs-sro', require('./szcoVsSro'));
router.use('/mortgage-bonita', require('./mortgageBonita'));
router.use('/vehicle-financing', require('./vehicleFinancing'));
router.use('/employee-cost', require('./employeeCost'));
router.use('/insurance-profiler', require('./insuranceProfiler'));
router.use('/dph-threshold', require('./dphThreshold'));
router.use('/company-reserve', require('./companyReserve'));
router.use('/investor-readiness', require('./investorReadiness'));

module.exports = router;
