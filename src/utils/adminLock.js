/**
 * Concurrency mutex to ensure atomic last-admin checks and state changes.
 * Prevents race conditions where concurrent requests simultaneously check
 * active admin counts and deactivate, delete, or demote the remaining administrators.
 */
let adminMutex = Promise.resolve();

const withAdminLock = async (fn) => {
  const currentMutex = adminMutex;
  let release;
  adminMutex = new Promise((resolve) => {
    release = resolve;
  });

  try {
    await currentMutex;
    return await fn();
  } finally {
    release();
  }
};

module.exports = {
  withAdminLock,
};
