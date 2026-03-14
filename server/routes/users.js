const express      = require('express');
const router       = express.Router();
const Tournament   = require('../models/Tournament');
const Registration = require('../models/Registration');
const { protect }  = require('../middleware/auth');

// GET /api/users/stats  – dashboard data for both roles
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role === 'host') {
      const tournaments = await Tournament.find({ host: req.user._id }).sort({ createdAt: -1 });
      const ids = tournaments.map((t) => t._id);

      const totalRegistrations = await Registration.countDocuments({
        tournament: { $in: ids },
        status: 'confirmed',
      });

      const totalRevenue = tournaments.reduce(
        (sum, t) => sum + t.registeredCount * t.entryFee,
        0
      );

      res.json({
        tournamentsHosted:    tournaments.length,
        totalRegistrations,
        totalRevenue,
        upcomingTournaments:  tournaments.filter((t) => t.status === 'upcoming').length,
        tournaments,
      });
    } else {
      const registrations = await Registration.find({ user: req.user._id })
        .populate('tournament', 'title sport location startDate endDate status entryFee withdrawalDeadline')
        .sort({ createdAt: -1 });

      res.json({
        totalRegistrations: registrations.length,
        confirmed:  registrations.filter((r) => r.status === 'confirmed').length,
        waitlisted: registrations.filter((r) => r.status === 'waitlisted').length,
        registrations,
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
