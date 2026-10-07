const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');

/**
 * Clean up all dependent records associated with a user when they are deleted.
 * Covers user favorites, notifications, active trips, and driver vehicle assignments.
 */
const cleanupUserDependencies = async (userId) => {
  if (!userId) return;

  await Promise.all([
    Favorite.deleteMany({ userId }).catch(() => {}),
    Notification.deleteMany({ userId }).catch(() => {}),
    Trip.updateMany(
      { driverId: userId, status: 'active' },
      { status: 'cancelled', endTime: new Date() },
    ).catch(() => {}),
    Vehicle.updateMany({ driverId: userId }, { isActive: false }).catch(
      () => {},
    ),
  ]);
};

module.exports = {
  cleanupUserDependencies,
};
